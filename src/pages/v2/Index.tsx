import { useAuthStore } from "@/store/useAuthStore";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { HRDashboardV2 } from "@/components/v2/HRDashboardV2";
import { AdminDashboardV2 } from "@/components/v2/AdminDashboardV2";
import { Sparkles } from "lucide-react";

const V2Index = () => {
  const { userRole, isLoading } = useAuthStore();

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
      <div className="flex-1 min-h-0 overflow-auto">
        {userRole === 'hr' ? (
          <HRDashboardV2 />
        ) : userRole === 'marcomms' ? (
          <AdminDashboardV2 />
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
