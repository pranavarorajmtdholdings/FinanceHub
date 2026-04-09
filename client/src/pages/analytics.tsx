import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Analytics</CardTitle>
              <CardDescription>
                Detailed insights into your spending and savings
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>This feature is coming soon. Analytics will provide detailed charts and reports on your financial trends and patterns.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
