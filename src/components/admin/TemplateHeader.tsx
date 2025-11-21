import { useState } from "react";
import { Layers, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useToast } from "@/hooks/use-toast";

export const TemplateHeader = () => {
  const { currentTemplate, updateTemplateName, saveTemplate, clearCurrentTemplate } = useTemplateStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(currentTemplate?.name || "Untitled Template");
  const { toast } = useToast();

  if (!currentTemplate) return null;

  const handleNameClick = () => {
    setIsEditing(true);
    setTempName(currentTemplate.name);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      updateTemplateName(tempName.trim());
    } else {
      setTempName(currentTemplate.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempName(currentTemplate.name);
    }
  };

  const handleCancel = () => {
    clearCurrentTemplate();
  };

  const handleSave = () => {
    saveTemplate();
    toast({
      title: "Template saved",
      description: `${currentTemplate.name} is now available for HR to use`,
    });
  };

  return (
    <div className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-primary" />
        {isEditing ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="h-8 w-64 text-lg font-semibold"
            autoFocus
          />
        ) : (
          <h2
            className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={handleNameClick}
          >
            {currentTemplate.name}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </div>
    </div>
  );
};
