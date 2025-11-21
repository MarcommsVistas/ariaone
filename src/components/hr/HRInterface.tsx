import { useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { FormGenerator } from "./FormGenerator";
import { SlideNavigation } from "@/components/editor/SlideNavigation";
import { useExport } from "@/hooks/useExport";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, Sparkles, DownloadCloud } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const HRInterface = () => {
  const { currentSlide, currentTemplate, setCurrentSlideIndex } = useTemplateStore();
  const { exportAsImage, exportAllSlides, isExporting } = useExport();

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

  const handleExportCurrent = () => {
    exportAsImage('hr-export-canvas', currentSlide.name, 'jpeg', 0.95);
  };

  const handleExportAll = async () => {
    if (!currentTemplate) return;

    await exportAllSlides(
      currentTemplate.slides.map(s => ({ id: s.id, name: s.name })),
      async (slideId) => {
        const slideIndex = currentTemplate.slides.findIndex(s => s.id === slideId);
        setCurrentSlideIndex(slideIndex);
      },
      'hr-export-canvas',
      currentTemplate.name,
      'jpeg',
      0.95
    );
  };

  // Calculate scale
  const containerPadding = 80;
  const availableWidth = window.innerWidth - 400 - containerPadding; // 400px for form
  const availableHeight = window.innerHeight - 64 - containerPadding;
  const scaleX = availableWidth / currentSlide.width;
  const scaleY = availableHeight / currentSlide.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const hasMultipleSlides = currentTemplate && currentTemplate.slides.length > 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] bg-panel border-r border-border overflow-auto">
          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm border-b border-border">
            <div className="h-14 flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Customize Template</h3>
              </div>
              
              {hasMultipleSlides ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      className="gap-2 shadow-sm"
                      disabled={isExporting}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCurrent}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Current Slide
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportAll}>
                      <DownloadCloud className="w-4 h-4 mr-2" />
                      Export All Slides (ZIP)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleExportCurrent} 
                  className="gap-2 shadow-sm"
                  disabled={isExporting}
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              )}
            </div>
        </div>
        
        <FormGenerator />
      </div>
      
      <div className="flex-1 bg-canvas flex items-center justify-center overflow-auto p-8">
        <div 
          id="hr-export-canvas"
          className="shadow-lg rounded-lg overflow-hidden"
          style={{
            width: currentSlide.width * scale,
            height: currentSlide.height * scale,
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <SlideRenderer
              slide={currentSlide}
              scale={1}
              interactive={false}
            />
          </div>
        </div>
      </div>
      </div>
      <SlideNavigation />
    </div>
  );
};
