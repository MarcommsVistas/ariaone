import { useTemplateStore } from "@/store/useTemplateStore";
import { Navigation } from "@/components/Navigation";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { HRInterface } from "@/components/hr/HRInterface";
import { CreativeDashboard } from "@/components/admin/CreativeDashboard";

const Index = () => {
  const { mode, currentTemplate } = useTemplateStore();

  const renderContent = () => {
    // Show dashboard if no template is selected in admin mode
    if (mode === 'admin' && !currentTemplate) {
      return <CreativeDashboard />;
    }
    
    // Show editor/interface when template is selected
    return mode === 'admin' ? <AdminStudio /> : <HRInterface />;
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
