import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { Template, TemplateInstance } from "@/store/useTemplateStore";
import { Copy, FileEdit } from "lucide-react";
import { format } from "date-fns";
interface TemplateCardProps {
  template: Template;
  existingInstance?: TemplateInstance | null;
  onCreateCopy: (templateId: string) => void;
  onOpenStudio: (instanceId: string) => void;
}
export const TemplateCard = ({
  template,
  existingInstance,
  onCreateCopy,
  onOpenStudio
}: TemplateCardProps) => {
  const firstSlide = template.slides[0];
  return <Card className="overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
      {/* Thumbnail Preview */}
      <div className="bg-muted/30 flex items-center justify-center p-6 overflow-hidden px-[12px] py-[12px]">
        <div className="relative bg-white shadow-md rounded-sm overflow-hidden" style={{
        width: '100%',
        maxWidth: '360px',
        aspectRatio: firstSlide ? `${firstSlide.width} / ${firstSlide.height}` : '1 / 1'
      }}>
          {firstSlide ? <div className="absolute inset-0" style={{
          transform: `scale(${360 / Math.max(firstSlide.width, firstSlide.height)})`,
          transformOrigin: 'top left',
          width: firstSlide.width,
          height: firstSlide.height
        }}>
              <SlideRenderer slide={firstSlide} interactive={false} />
            </div> : <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No preview</p>
            </div>}
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
              {template.category && <Badge variant="default" className="text-xs">
                  {template.category}
                </Badge>}
              {template.brand && <Badge variant="secondary" className="text-xs">
                  {template.brand}
                </Badge>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {template.slides.length} {template.slides.length === 1 ? 'Slide' : 'Slides'}
          </p>
        </div>

        {existingInstance ? <>
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="default" size="lg" onClick={() => onOpenStudio(existingInstance.id)}>
              <FileEdit className="mr-2 h-4 w-4" />
              Open Studio
            </Button>
            <div className="text-xs text-muted-foreground text-center mt-1">
              Last edited: {format(new Date(existingInstance.updated_at), 'MMM d, yyyy')}
            </div>
          </> : <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="outline" size="lg" onClick={() => onCreateCopy(template.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Create a Copy
          </Button>}
      </div>
    </Card>;
};