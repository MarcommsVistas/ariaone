import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SlideRenderer } from "./SlideRenderer";
import { useEffect, useRef, useState } from "react";
import { useAddSlideToTemplate } from "@/hooks/usePsdParser";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export const SlideNavigation = () => {
  const { currentTemplate, currentInstance, currentSlideIndex, setCurrentSlideIndex, nextSlide, previousSlide, reorderSlides, mode, addSlide } = useTemplateStore();
  const { userRole } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const { addSlideToTemplate, isLoading, progress, progressStatus } = useAddSlideToTemplate();
  const { toast } = useToast();

  const isAdminMode = mode === 'admin';
  const isMarcomms = userRole === 'marcomms';

  useEffect(() => {
    // Scroll active slide into view
    const activeSlide = containerRef.current?.querySelector('[data-active="true"]');
    if (activeSlide) {
      activeSlide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentSlideIndex]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, previousSlide]);

  const workingContext = currentInstance || currentTemplate;
  
  if (!workingContext) {
    return null;
  }

  const canGoPrevious = currentSlideIndex > 0;
  const canGoNext = currentSlideIndex < workingContext.slides.length - 1;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isAdminMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdminMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isAdminMode) return;
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    const newOrder = [...workingContext.slides];
    const [draggedSlide] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSlide);

    reorderSlides(newOrder);
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleAddSlideClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workingContext) return;

    if (!file.name.toLowerCase().endsWith('.psd')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .psd file",
        variant: "destructive",
      });
      return;
    }

    const newSlide = await addSlideToTemplate(file, workingContext.id);
    
    if (newSlide) {
      addSlide(newSlide);
      toast({
        title: "Slide added",
        description: `${newSlide.name} has been added to the template`,
      });
      // Switch to the new slide
      setCurrentSlideIndex(workingContext.slides.length);
    } else {
      toast({
        title: "Failed to add slide",
        description: "Could not parse PSD file. Please try again.",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".psd"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Loading dialog */}
      <Dialog open={isLoading}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adding Slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progress} className="h-2" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-primary">
                {progress}%
              </p>
              <p className="text-sm text-muted-foreground">
                {progressStatus}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-panel border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="outline"
            size="icon"
            onClick={previousSlide}
            disabled={!canGoPrevious}
            className="shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div 
            ref={containerRef}
            className="flex-1 overflow-x-auto"
          >
            <div className="flex gap-2 min-w-min pb-1">
              {workingContext.slides.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              const isDragging = draggedIndex === index;
              const isDraggedOver = draggedOverIndex === index && draggedIndex !== index;
              const thumbnailScale = 80 / Math.max(slide.width, slide.height);

              return (
                <button
                  key={slide.id}
                  data-active={isActive}
                  draggable={isAdminMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`
                    relative shrink-0 rounded-lg overflow-hidden transition-all
                    ${isActive 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'ring-1 ring-border hover:ring-primary/50'
                    }
                    ${isDragging ? 'opacity-40 scale-95' : ''}
                    ${isDraggedOver ? 'ring-2 ring-primary/60 scale-105' : ''}
                    ${isAdminMode ? 'cursor-move' : 'cursor-pointer'}
                  `}
                  style={{
                    width: slide.width * thumbnailScale,
                    height: slide.height * thumbnailScale,
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-white"
                    style={{ transform: `scale(${thumbnailScale})`, transformOrigin: 'top left' }}
                  >
                    <SlideRenderer
                      slide={slide}
                      scale={thumbnailScale}
                      interactive={false}
                    />
                  </div>
                  
                  {/* Slide number overlay */}
                  <div className={`
                    absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background/80 text-foreground'
                    }
                  `}>
                    {index + 1}
                  </div>
                </button>
              );
            })}
            
            {/* Add Slide Button - Only for Marcomms in Admin Mode */}
            {isAdminMode && isMarcomms && (
              <button
                onClick={handleAddSlideClick}
                disabled={isLoading}
                className="
                  relative shrink-0 rounded-lg overflow-hidden transition-all
                  ring-1 ring-dashed ring-border hover:ring-primary/50
                  bg-muted/30 hover:bg-muted/50
                  flex items-center justify-center
                  cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{
                  width: 80,
                  height: 80,
                }}
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          disabled={!canGoNext}
          className="shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="text-xs text-muted-foreground shrink-0 min-w-[80px] text-right">
          Slide {currentSlideIndex + 1} of {workingContext.slides.length}
        </div>
      </div>
    </div>
    </>
  );
};
