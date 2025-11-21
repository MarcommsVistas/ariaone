import { useTemplateStore } from "@/store/useTemplateStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export const FormGenerator = () => {
  const { currentSlide, updateLayer } = useTemplateStore();

  if (!currentSlide) return null;

  const editableLayers = currentSlide.layers.filter(
    (layer) => !layer.locked && layer.type === 'text'
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

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {editableLayers.map((layer) => {
          const isMultiline = (layer.height || 0) > (layer.fontSize || 16) * 2;
          
          return (
            <div key={layer.id}>
              <Label htmlFor={`hr-${layer.id}`} className="text-sm font-medium">
                {layer.name}
              </Label>
              
              {isMultiline ? (
                <Textarea
                  id={`hr-${layer.id}`}
                  value={layer.text || ''}
                  onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                  maxLength={layer.maxLength}
                  className="mt-1.5 min-h-[100px]"
                  placeholder={`Enter ${layer.name.toLowerCase()}...`}
                />
              ) : (
                <Input
                  id={`hr-${layer.id}`}
                  value={layer.text || ''}
                  onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                  maxLength={layer.maxLength}
                  className="mt-1.5"
                  placeholder={`Enter ${layer.name.toLowerCase()}...`}
                />
              )}
              
              {layer.maxLength && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(layer.text?.length || 0)} / {layer.maxLength} characters
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
