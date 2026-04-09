import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Collections</CardTitle>
              <CardDescription>
                Organize your financial goals and savings targets
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>This feature is coming soon. Collections will help you group accounts and track progress toward specific financial goals.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
