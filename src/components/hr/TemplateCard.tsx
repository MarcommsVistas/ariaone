import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { Template } from "@/store/useTemplateStore";

interface TemplateCardProps {
  template: Template;
  onOpenStudio: (templateId: string) => void;
}

export const TemplateCard = ({ template, onOpenStudio }: TemplateCardProps) => {
  const firstSlide = template.slides[0];

  return (
    <Card className="overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
      {/* Thumbnail Preview */}
      <div className="bg-muted/30 flex items-center justify-center p-6 overflow-hidden">
        <div 
          className="relative bg-white shadow-md rounded-sm overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '360px',
            aspectRatio: firstSlide ? `${firstSlide.width} / ${firstSlide.height}` : '1 / 1',
          }}
        >
          {firstSlide ? (
            <div 
              className="absolute inset-0"
              style={{ 
                transform: `scale(${360 / Math.max(firstSlide.width, firstSlide.height)})`,
                transformOrigin: 'top left',
                width: firstSlide.width,
                height: firstSlide.height,
              }}
            >
              <SlideRenderer
                slide={firstSlide}
                scale={360 / Math.max(firstSlide.width, firstSlide.height)}
                interactive={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
              {template.name}
            </h3>
            <div className="flex flex-col gap-1 shrink-0">
              {template.category && (
                <Badge variant="default" className="text-xs">
                  {template.category}
                </Badge>
              )}
              {template.brand && (
                <Badge variant="secondary" className="text-xs">
                  {template.brand}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {template.slides.length} {template.slides.length === 1 ? 'Slide' : 'Slides'}
          </p>
        </div>

        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
          size="lg"
          onClick={() => onOpenStudio(template.id)}
        >
          Open Studio
        </Button>
      </div>
    </Card>
  );
};
