import { useAuthStore } from "@/store/useAuthStore";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { HRDashboardV2 } from "@/components/v2/HRDashboardV2";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const V2Index = () => {
  const { userRole, isLoading } = useAuthStore();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading AI-Powered Workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 min-h-0">
        {userRole === 'hr' ? (
          <HRDashboardV2 />
        ) : userRole === 'marcomms' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Admin Review Queue</h2>
              <p className="text-muted-foreground max-w-md">
                Review and approve AI-generated creative submissions from the HR team
              </p>
              <Button size="lg" onClick={() => navigate("/v2/admin/reviews")}>
                Go to Review Queue
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Invalid user role</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default V2Index;
