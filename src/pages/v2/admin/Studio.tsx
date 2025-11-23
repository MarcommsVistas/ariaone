import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, useParams } from "react-router-dom";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useEffect } from "react";

const Studio = () => {
  const { userRole, isLoading } = useAuthStore();
  const { templateId } = useParams<{ templateId: string }>();
  const { setCurrentTemplate, currentTemplate, templates } = useTemplateStore();

  useEffect(() => {
    if (templateId) {
      setCurrentTemplate(templateId);
    }
  }, [templateId, setCurrentTemplate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (userRole !== 'marcomms') {
    return <Navigate to="/v2" replace />;
  }

  if (!currentTemplate && templateId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-hidden">
        <AdminStudio />
      </div>
    </div>
  );
};

export default Studio;
