import { useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { LayerPanel } from "./LayerPanel";
import { PropertyPanel } from "./PropertyPanel";
import { AlertCircle } from "lucide-react";

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

  // Calculate scale to fit the canvas
  const containerPadding = 80;
  const availableWidth = window.innerWidth - 600 - containerPadding; // 600px for panels
  const availableHeight = window.innerHeight - 64 - containerPadding; // 64px for nav
  const scaleX = availableWidth / currentSlide.width;
  const scaleY = availableHeight / currentSlide.height;
  const scale = Math.min(scaleX, scaleY, 1);

  return (
    <div className="flex-1 flex overflow-hidden">
      <LayerPanel />
      
      <div className="flex-1 bg-canvas flex items-center justify-center p-10 overflow-auto">
        <SlideRenderer
          slide={currentSlide}
          scale={scale}
          interactive={true}
          onLayerClick={setSelectedLayer}
        />
      </div>
      
      <PropertyPanel />
    </div>
  );
};
