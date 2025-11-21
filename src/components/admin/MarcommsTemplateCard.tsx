import { Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Template } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";

interface MarcommsTemplateCardProps {
  template: Template;
  onEditTemplate: (templateId: string) => void;
}

export const MarcommsTemplateCard = ({ template, onEditTemplate }: MarcommsTemplateCardProps) => {
  const firstSlide = template.slides[0];
  const isPublished = template.saved;

  return (
    <Card className="border border-border hover:border-primary/50 transition-colors overflow-hidden group">
      {/* Thumbnail Preview */}
      <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center overflow-hidden">
        {firstSlide ? (
          <div className="w-full h-full flex items-center justify-center">
            <div
              style={{
                transform: `scale(${Math.min(
                  250 / firstSlide.width,
                  250 / firstSlide.height
                )})`,
                transformOrigin: 'center',
              }}
            >
              <SlideRenderer slide={firstSlide} />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No preview</div>
        )}
      </div>

      {/* Template Info */}
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{template.name}</h3>
            <Badge 
              variant={isPublished ? "default" : "secondary"}
              className={isPublished ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {template.category && (
              <span className="text-primary font-medium">{template.category}</span>
            )}
            {template.category && template.brand && (
              <span>•</span>
            )}
            {template.brand && (
              <span>{template.brand}</span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {template.slides.length} {template.slides.length === 1 ? 'slide' : 'slides'}
          </p>
        </div>

        <Button
          onClick={() => onEditTemplate(template.id)}
          className="w-full"
          variant="outline"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Template
        </Button>
      </CardContent>
    </Card>
  );
};
