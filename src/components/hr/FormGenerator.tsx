import { useTemplateStore } from "@/store/useTemplateStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";
import { toast } from "sonner";

export const FormGenerator = () => {
  const { currentSlide, updateLayer } = useTemplateStore();

  if (!currentSlide) return null;

  const editableLayers = currentSlide.layers.filter(
    (layer) => !layer.locked && (layer.type === 'text' || layer.type === 'image')
  );

  if (editableLayers.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          No editable fields available in this template.
        </p>
      </div>
    );
  }

  const handleImageUpload = (layerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (imageData) {
        updateLayer(layerId, { src: imageData });
        toast.success("Image updated successfully");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {editableLayers.map((layer) => {
          if (layer.type === 'image') {
            return (
              <Card key={layer.id} className="p-4 bg-card border-border">
                <Label className="text-sm font-semibold mb-3 block">
                  {layer.name}
                </Label>
                
                <div className="space-y-3">
                  {layer.src && (
                    <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                      <img 
                        src={layer.src} 
                        alt={layer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full relative"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {layer.src ? 'Change Image' : 'Upload Image'}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(layer.id, e)}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </Card>
            );
          }

          // Text layer
          const isMultiline = (layer.height || 0) > (layer.fontSize || 16) * 2;
          
          return (
            <Card key={layer.id} className="p-4 bg-card border-border">
              <Label htmlFor={`hr-${layer.id}`} className="text-sm font-semibold mb-3 block">
                {layer.name}
              </Label>
              
              {isMultiline ? (
                <Textarea
                  id={`hr-${layer.id}`}
                  value={layer.text || ''}
                  onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                  maxLength={layer.maxLength}
                  className="min-h-[100px] resize-none"
                  placeholder={`Enter ${layer.name.toLowerCase()}...`}
                />
              ) : (
                <Input
                  id={`hr-${layer.id}`}
                  value={layer.text || ''}
                  onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                  maxLength={layer.maxLength}
                  placeholder={`Enter ${layer.name.toLowerCase()}...`}
                />
              )}
              
              {layer.maxLength && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(layer.text?.length || 0)} / {layer.maxLength} characters
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
