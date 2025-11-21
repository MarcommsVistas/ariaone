import { useTemplateStore } from "@/store/useTemplateStore";
import { Eye, EyeOff, Lock, Unlock, Type, Image as ImageIcon, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const LayerPanel = () => {
  const { currentSlide, selectedLayer, setSelectedLayer, updateLayer } = useTemplateStore();

  if (!currentSlide) return null;

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'shape': return <Square className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="w-64 bg-panel border-r border-border flex flex-col">
      <div className="h-12 border-b border-border flex items-center px-4">
        <h3 className="font-semibold text-sm text-foreground">Layers</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {[...currentSlide.layers]
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((layer) => (
              <div
                key={layer.id}
                className={`
                  group flex items-center gap-2 p-2 rounded-md cursor-pointer
                  transition-colors
                  ${selectedLayer?.id === layer.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-secondary'
                  }
                `}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <div className="text-muted-foreground">
                  {getLayerIcon(layer.type)}
                </div>
                
                <span className="flex-1 text-sm truncate">
                  {layer.name}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { locked: !layer.locked });
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
};
