import { useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { FormGenerator } from "./FormGenerator";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const HRInterface = () => {
  const { currentSlide } = useTemplateStore();

  if (!currentSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Template Available</h3>
            <p className="text-muted-foreground">Please wait for admin to set up a template</p>
          </div>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    toast.info("Export functionality will be implemented with html-to-image integration");
  };

  // Calculate scale
  const containerPadding = 80;
  const availableWidth = window.innerWidth - 400 - containerPadding; // 400px for form
  const availableHeight = window.innerHeight - 64 - containerPadding;
  const scaleX = availableWidth / currentSlide.width;
  const scaleY = availableHeight / currentSlide.height;
  const scale = Math.min(scaleX, scaleY, 1);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-96 bg-panel border-r border-border overflow-auto">
        <div className="h-12 border-b border-border flex items-center justify-between px-4">
          <h3 className="font-semibold text-sm text-foreground">Customize</h3>
          <Button size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-3 h-3" />
            Export
          </Button>
        </div>
        
        <FormGenerator />
      </div>
      
      <div className="flex-1 bg-canvas flex items-center justify-center p-10 overflow-auto">
        <SlideRenderer
          slide={currentSlide}
          scale={scale}
          interactive={false}
        />
      </div>
    </div>
  );
};
