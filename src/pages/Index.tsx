import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigation } from "@/components/Navigation";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { HRInterface } from "@/components/hr/HRInterface";
import { CreativeDashboard } from "@/components/admin/CreativeDashboard";
import { HRDashboard } from "@/components/hr/HRDashboard";
import { Layers } from "lucide-react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { mode, currentTemplate, currentInstance } = useTemplateStore();
  const { userRole, isLoading } = useAuthStore();

  // Redirect HR and marcomms users to V2 by default
  if (!isLoading && (userRole === 'hr' || userRole === 'marcomms')) {
    return <Navigate to="/v2" replace />;
  }

  const renderContent = () => {
    // Show loading state while auth is initializing
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // HR users can ONLY access HR interface
  if (userRole === 'hr') {
    return (currentTemplate || currentInstance) ? <HRInterface /> : <HRDashboard />;
  }
    
    // Marcomms users can switch between modes
    if (userRole === 'marcomms') {
      if (mode === 'admin') {
        return currentTemplate ? <AdminStudio enableAI={false} /> : <CreativeDashboard />;
      }
      return currentTemplate ? <HRInterface /> : <HRDashboard />;
    }
    
    // Fallback for unknown roles
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Invalid user role</p>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
