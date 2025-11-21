import { useTemplateStore } from "@/store/useTemplateStore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SlideRenderer } from "./SlideRenderer";
import { useEffect, useRef, useState } from "react";

export const SlideNavigation = () => {
  const { currentTemplate, currentSlideIndex, setCurrentSlideIndex, nextSlide, previousSlide, reorderSlides, mode } = useTemplateStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const isAdminMode = mode === 'admin';

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

  if (!currentTemplate || currentTemplate.slides.length <= 1) {
    return null;
  }

  const canGoPrevious = currentSlideIndex > 0;
  const canGoNext = currentSlideIndex < currentTemplate.slides.length - 1;

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

    const newOrder = [...currentTemplate.slides];
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

  return (
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
            {currentTemplate.slides.map((slide, index) => {
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
          Slide {currentSlideIndex + 1} of {currentTemplate.slides.length}
        </div>
      </div>
    </div>
  );
};
