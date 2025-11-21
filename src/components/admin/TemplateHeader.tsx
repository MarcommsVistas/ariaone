import { useState } from "react";
import { Layers, Save, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useToast } from "@/hooks/use-toast";

export const TemplateHeader = () => {
  const { currentTemplate, updateTemplateName, updateTemplateBrand, saveTemplate, clearCurrentTemplate } = useTemplateStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [tempName, setTempName] = useState(currentTemplate?.name || "Untitled Template");
  const [tempBrand, setTempBrand] = useState(currentTemplate?.brand || "");
  const { toast } = useToast();

  if (!currentTemplate) return null;

  const handleNameClick = () => {
    setIsEditingName(true);
    setTempName(currentTemplate.name);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      updateTemplateName(tempName.trim());
    } else {
      setTempName(currentTemplate.name);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setTempName(currentTemplate.name);
    }
  };

  const handleBrandSave = () => {
    updateTemplateBrand(tempBrand.trim());
    setIsEditingBrand(false);
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
        {isEditingName ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
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
        
        {/* Brand Badge with Edit */}
        <Popover open={isEditingBrand} onOpenChange={setIsEditingBrand}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              {currentTemplate.brand ? (
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  <Tag className="h-3 w-3 mr-1" />
                  {currentTemplate.brand}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Add brand
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand Name</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Nike, Adidas"
                  value={tempBrand}
                  onChange={(e) => setTempBrand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBrandSave();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBrand(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleBrandSave}>
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
