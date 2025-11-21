import { useTemplateStore } from "@/store/useTemplateStore";
import { AIGenerationDialog } from "./AIGenerationDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AlertCircle } from "lucide-react";

export const PropertyPanel = () => {
  const { selectedLayer, updateLayer } = useTemplateStore();

  if (!selectedLayer) {
    return (
      <div className="w-80 bg-panel border-l border-border flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Select a layer to edit properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-panel border-l border-border overflow-auto">
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <h3 className="font-semibold text-sm text-foreground">Properties</h3>
        <AIGenerationDialog />
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Layer Info
          </h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="layer-name" className="text-xs">Name</Label>
              <Input
                id="layer-name"
                value={selectedLayer.name}
                onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="layer-type" className="text-xs">Type</Label>
              <Input
                id="layer-type"
                value={selectedLayer.type}
                disabled
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Transform
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="layer-x" className="text-xs">X</Label>
                <Input
                  id="layer-x"
                  type="number"
                  value={selectedLayer.x}
                  onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="layer-y" className="text-xs">Y</Label>
                <Input
                  id="layer-y"
                  type="number"
                  value={selectedLayer.y}
                  onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="layer-width" className="text-xs">Width</Label>
                <Input
                  id="layer-width"
                  type="number"
                  value={selectedLayer.width}
                  onChange={(e) => updateLayer(selectedLayer.id, { width: Number(e.target.value) })}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="layer-height" className="text-xs">Height</Label>
                <Input
                  id="layer-height"
                  type="number"
                  value={selectedLayer.height}
                  onChange={(e) => updateLayer(selectedLayer.id, { height: Number(e.target.value) })}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="layer-opacity" className="text-xs">
                Opacity ({Math.round(selectedLayer.opacity * 100)}%)
              </Label>
              <Slider
                id="layer-opacity"
                min={0}
                max={1}
                step={0.01}
                value={[selectedLayer.opacity]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { opacity: value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="layer-rotation" className="text-xs">
                Rotation ({selectedLayer.rotation}°)
              </Label>
              <Slider
                id="layer-rotation"
                min={-180}
                max={180}
                step={1}
                value={[selectedLayer.rotation]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { rotation: value })}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {selectedLayer.type === 'text' && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Text Properties
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="layer-text" className="text-xs">Content</Label>
                <Input
                  id="layer-text"
                  value={selectedLayer.text || ''}
                  onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="layer-font-size" className="text-xs">Font Size</Label>
                  <Input
                    id="layer-font-size"
                    type="number"
                    value={selectedLayer.fontSize || 16}
                    onChange={(e) => updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="layer-color" className="text-xs">Color</Label>
                  <Input
                    id="layer-color"
                    type="color"
                    value={selectedLayer.color || '#000000'}
                    onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
