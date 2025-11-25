import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Studio = () => {
  const { userRole, isLoading } = useAuthStore();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
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
      <div className="border-b bg-background px-6 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/v2/admin/templates")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        {currentTemplate && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Editing:</span>
            <span className="text-sm font-medium">{currentTemplate.name}</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <AdminStudio enableAI={true} />
      </div>
    </div>
  );
};

export default Studio;
