import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigation } from "@/components/Navigation";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { HRInterface } from "@/components/hr/HRInterface";
import { CreativeDashboard } from "@/components/admin/CreativeDashboard";
import { HRDashboard } from "@/components/hr/HRDashboard";

const Index = () => {
  const { mode, currentTemplate } = useTemplateStore();
  const { userRole } = useAuthStore();

  const renderContent = () => {
    // HR users can ONLY access HR interface
    if (userRole === 'hr') {
      return currentTemplate ? <HRInterface /> : <HRDashboard />;
    }
    
    // Marcomms users can switch between modes
    if (userRole === 'marcomms') {
      if (mode === 'admin') {
        return currentTemplate ? <AdminStudio /> : <CreativeDashboard />;
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
