import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { FileText } from "lucide-react";

interface TemplateThumbnailProps {
  templateId: string;
}

export const TemplateThumbnail = ({ templateId }: TemplateThumbnailProps) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data: slidesData, error } = await supabase
          .from("slides")
          .select("*, layers(*)")
          .eq("template_id", templateId)
          .order("order_index", { ascending: true });

        if (error) throw error;

        // Map database properties to component interface
        const mappedSlides = slidesData?.map(slide => ({
          ...slide,
          layers: slide.layers.map((layer: any) => ({
            id: layer.id,
            name: layer.name,
            type: layer.type,
            text: layer.text_content,
            src: layer.image_src,
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            opacity: layer.opacity,
            rotation: layer.rotation,
            visible: layer.visible,
            locked: layer.locked,
            zIndex: layer.z_index,
            fontFamily: layer.font_family,
            fontSize: layer.font_size,
            fontWeight: layer.font_weight,
            color: layer.color,
            align: layer.text_align,
            lineHeight: layer.line_height,
            letterSpacing: layer.letter_spacing,
            textTransform: layer.text_transform
          }))
        })) || [];

        setSlides(mappedSlides);
      } catch (error) {
        console.error("Error fetching template thumbnail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, [templateId]);

  if (isLoading) {
    return (
      <div className="aspect-[16/10] bg-muted/30 rounded-t-lg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="aspect-[16/10] bg-muted/30 rounded-t-lg flex flex-col items-center justify-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">No preview available</p>
      </div>
    );
  }

  const firstSlide = slides[0];

  return (
    <div className="aspect-[16/10] bg-white rounded-t-lg overflow-hidden flex items-center justify-center p-2">
      <div 
        style={{ 
          transform: 'scale(0.15)', 
          transformOrigin: 'center',
          width: firstSlide.width,
          height: firstSlide.height
        }}
      >
        <SlideRenderer slide={firstSlide} />
      </div>
    </div>
  );
};
