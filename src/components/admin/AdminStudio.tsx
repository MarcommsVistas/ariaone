import { useState } from "react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { InteractionOverlay } from "@/components/editor/InteractionOverlay";
import { LayerPanel } from "./LayerPanel";
import { PropertyPanel } from "./PropertyPanel";
import { AlertCircle, Minus, Plus } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export const AdminStudio = () => {
  const { currentSlide, setSelectedLayer } = useTemplateStore();

  if (!currentSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Template Loaded</h3>
            <p className="text-muted-foreground">Upload a PSD file to get started</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate base scale to fit the canvas
  const containerPadding = 80;
  const availableWidth = window.innerWidth - 600 - containerPadding; // approx space for panels
  const availableHeight = window.innerHeight - 64 - containerPadding; // 64px for nav
  const scaleX = availableWidth / currentSlide.width;
  const scaleY = availableHeight / currentSlide.height;
  const baseScale = Math.min(scaleX, scaleY, 1);

  const [zoom, setZoom] = useState(100); // percentage
  const minZoom = 25;
  const maxZoom = 200;
  const effectiveScale = baseScale * (zoom / 100);

  const handleZoomIn = () => setZoom((z) => Math.min(maxZoom, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(minZoom, z - 10));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <ResizablePanel defaultSize={20} minSize={14} maxSize={35}>
          <LayerPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={55} minSize={40}>
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 bg-canvas flex items-center justify-center overflow-auto relative">
              <div 
                className="relative"
                style={{
                  width: currentSlide.width * effectiveScale,
                  height: currentSlide.height * effectiveScale,
                }}
              >
                <div style={{ transform: `scale(${effectiveScale})`, transformOrigin: 'top left' }}>
                  <SlideRenderer
                    slide={currentSlide}
                    scale={effectiveScale}
                    interactive={true}
                    onLayerClick={setSelectedLayer}
                  />
                  <InteractionOverlay
                    slideWidth={currentSlide.width}
                    slideHeight={currentSlide.height}
                    scale={effectiveScale}
                  />
                </div>
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-panel/90 border border-border rounded-full px-3 py-1.5 shadow-md backdrop-blur-sm">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="flex items-center justify-center h-7 w-7 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="text-xs font-medium text-muted-foreground min-w-[52px] text-center"
                >
                  {Math.round(zoom)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="flex items-center justify-center h-7 w-7 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <PropertyPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
