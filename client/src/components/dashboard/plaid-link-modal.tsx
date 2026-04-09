import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, X } from "lucide-react";

declare global {
  interface Window {
    Plaid: any;
  }
}

interface PlaidLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManualAdd: () => void;
}

export default function PlaidLinkModal({ isOpen, onClose, onOpenManualAdd }: PlaidLinkModalProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Plaid Link script only once
  useEffect(() => {
    if (document.querySelector('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const res = await apiRequest("POST", "/api/plaid/exchange-token", {
        public_token: publicToken,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Connected Successfully",
        description: `Added ${data.accounts?.length || 0} account(s) from ${data.institution?.name || 'your bank'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/summary"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Error exchanging token:", error);
      const errorMessage = error?.message || "Failed to connect your account. Please try again.";
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsInitializing(false);
    },
  });

  const initializePlaidLink = async () => {
    setIsInitializing(true);
    try {
      // Get link token from backend
      const response = await apiRequest("POST", "/api/plaid/link-token");
      const { linkToken } = await response.json();
      setLinkToken(linkToken);

      // Wait for Plaid script to load
      if (!window.Plaid) {
        await new Promise((resolve) => {
          const checkPlaid = setInterval(() => {
            if (window.Plaid) {
              clearInterval(checkPlaid);
              resolve(true);
            }
          }, 100);
        });
      }

      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
          console.log("Plaid Link success:", metadata);
          exchangeTokenMutation.mutate(public_token);
        },
        onExit: (err: any, metadata: any) => {
          if (err) {
            console.error("Plaid Link error:", err);
            toast({
              title: "Connection Failed",
              description: err.display_message || "Failed to connect account.",
              variant: "destructive",
            });
          } else if (metadata.status === 'requires_questions' || metadata.status === 'requires_selections' || metadata.status === 'requires_credentials') {
            // User closed during a required step
            toast({
              title: "Connection Cancelled",
              description: "You closed the connection before completing. Please try again.",
            });
          }
          setIsInitializing(false);
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log("Plaid Link event:", eventName, metadata);
        },
      });

      // Open Plaid Link
      handler.open();

    } catch (error) {
      console.error("Error initializing Plaid Link:", error);
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize Plaid Link. Please try again.",
        variant: "destructive",
      });
      setIsInitializing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="plaid-link-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold" data-testid="modal-title">
              Connect Your Account
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground text-center" data-testid="modal-description">
            Securely link your bank accounts, credit cards, and investment accounts using Plaid.
          </p>

          <div className="space-y-4">
            <Button
              onClick={initializePlaidLink}
              disabled={isInitializing || exchangeTokenMutation.isPending}
              className="w-full"
              data-testid="button-initialize-plaid"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Continue with Plaid"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onOpenManualAdd}
              className="w-full"
              data-testid="button-add-manual"
            >
              Add Account Manually
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg" data-testid="security-notice">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Your data is secure</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We use bank-level encryption and never store your credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
