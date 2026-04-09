import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Link } from "lucide-react";

interface EmptyStateProps {
  onConnectAccount: () => void;
  onAddManually: () => void;
}

export default function EmptyState({ onConnectAccount, onAddManually }: EmptyStateProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-12 text-center" data-testid="empty-state">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="empty-state-title">
          No accounts found
        </h3>
        <p className="text-muted-foreground mb-6" data-testid="empty-state-description">
          Get started by connecting your first account through Plaid or add one manually.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={onConnectAccount}
            className="inline-flex items-center justify-center"
            data-testid="button-connect-plaid"
          >
            <Link className="w-5 h-5 mr-2" />
            Connect with Plaid
          </Button>
          <Button 
            variant="outline"
            onClick={onAddManually}
            className="inline-flex items-center justify-center"
            data-testid="button-add-manually"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
