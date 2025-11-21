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
      <div className="h-full w-full bg-panel border-l border-border flex items-center justify-center">
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
    <div className="h-full w-full bg-panel border-l border-border overflow-auto flex flex-col">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
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
              
              <div>
                <Label htmlFor="layer-font-family" className="text-xs">Font Family</Label>
                <select
                  id="layer-font-family"
                  value={selectedLayer.fontFamily || 'DM Sans'}
                  onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                  className="w-full h-8 text-sm mt-1 border border-input rounded-md px-2"
                >
                  <option value="DM Sans">DM Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
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
                  <Label htmlFor="layer-font-weight" className="text-xs">Font Weight</Label>
                  <select
                    id="layer-font-weight"
                    value={selectedLayer.fontWeight || 400}
                    onChange={(e) => updateLayer(selectedLayer.id, { fontWeight: Number(e.target.value) })}
                    className="w-full h-8 text-sm mt-1 border border-input rounded-md px-2"
                  >
                    <option value="100">Thin</option>
                    <option value="200">Extra Light</option>
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
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
              
              <div>
                <Label className="text-xs mb-2 block">Text Transform</Label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { textTransform: 'none' })}
                    className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                      (selectedLayer.textTransform || 'none') === 'none'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-secondary'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { textTransform: 'uppercase' })}
                    className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                      selectedLayer.textTransform === 'uppercase'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-secondary'
                    }`}
                  >
                    ABC
                  </button>
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { textTransform: 'lowercase' })}
                    className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                      selectedLayer.textTransform === 'lowercase'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-secondary'
                    }`}
                  >
                    abc
                  </button>
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { textTransform: 'capitalize' })}
                    className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                      selectedLayer.textTransform === 'capitalize'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-secondary'
                    }`}
                  >
                    Abc
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="layer-letter-spacing" className="text-xs">Letter Spacing</Label>
                  <Input
                    id="layer-letter-spacing"
                    type="number"
                    step="0.1"
                    value={selectedLayer.letterSpacing || 0}
                    onChange={(e) => updateLayer(selectedLayer.id, { letterSpacing: Number(e.target.value) })}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="layer-line-height" className="text-xs">Line Height</Label>
                  <Input
                    id="layer-line-height"
                    type="number"
                    step="0.1"
                    value={selectedLayer.lineHeight || 1.2}
                    onChange={(e) => updateLayer(selectedLayer.id, { lineHeight: Number(e.target.value) })}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="layer-text-align" className="text-xs">Align</Label>
                  <select
                    id="layer-text-align"
                    value={selectedLayer.align || 'left'}
                    onChange={(e) => updateLayer(selectedLayer.id, { align: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-full h-8 text-sm mt-1 border border-input rounded-md px-2"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
