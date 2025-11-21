import { useTemplateStore } from "@/store/useTemplateStore";
import { Eye, EyeOff, Lock, Unlock, Type, Image as ImageIcon, Square, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export const LayerPanel = () => {
  const { currentSlide, currentSlideIndex, currentTemplate, selectedLayer, setSelectedLayer, updateLayer, reorderLayers } = useTemplateStore();
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  if (!currentSlide) return null;

  const sortedLayers = [...currentSlide.layers].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'shape': return <Square className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(layerId);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayer || draggedLayer === targetLayerId) return;

    const draggedIndex = sortedLayers.findIndex(l => l.id === draggedLayer);
    const targetIndex = sortedLayers.findIndex(l => l.id === targetLayerId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...sortedLayers];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update zIndex based on new order
    const reorderedLayers = newOrder.map((layer, index) => ({
      ...layer,
      zIndex: newOrder.length - index - 1,
    }));

    reorderLayers(currentSlide.id, reorderedLayers);
    setDraggedLayer(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedLayer(null);
    setDraggedOver(null);
  };

  return (
    <div className="h-full w-full bg-panel border-r border-border flex flex-col">
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <h3 className="font-semibold text-sm text-foreground">Layers</h3>
        {currentTemplate && currentTemplate.slides.length > 1 && (
          <span className="text-xs text-muted-foreground">
            Slide {currentSlideIndex + 1}
          </span>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedLayers.map((layer) => (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              className={`
                group flex items-center gap-2 p-2 rounded-md cursor-pointer
                transition-all
                ${selectedLayer?.id === layer.id 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'hover:bg-secondary border-2 border-transparent'
                }
                ${draggedLayer === layer.id ? 'opacity-50' : ''}
                ${draggedOver === layer.id && draggedLayer !== layer.id ? 'border-primary/50 bg-primary/5' : ''}
              `}
              onClick={() => setSelectedLayer(layer.id)}
            >
              <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3" />
              </div>
              
              <div className="text-muted-foreground">
                {getLayerIcon(layer.type)}
              </div>
              
              <span className="flex-1 min-w-0 text-sm truncate">
                {(() => {
                  const name = layer.name || '';
                  const words = name.split(/\s+/);
                  const maxWords = 4;
                  if (words.length <= maxWords) return name;
                  return words.slice(0, maxWords).join(' ') + '…';
                })()}
              </span>
              
              <div className="flex items-center gap-1 ml-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
                  className={`h-6 w-6 ${layer.locked ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  title={layer.locked ? "Locked - Not editable in HR view" : "Unlocked - Editable in HR view"}
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
