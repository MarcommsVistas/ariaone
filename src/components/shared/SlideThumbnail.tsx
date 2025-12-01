import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { Slide } from "@/store/useTemplateStore";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SlideThumbnailProps {
  // Data source - ONE of these
  slide?: Slide;
  instanceId?: string;
  templateId?: string;
  
  // Size variant
  size?: 'sm' | 'md' | 'lg';
  
  // Layout mode
  mode?: 'grid' | 'list';
  
  // Optional class overrides
  className?: string;
}

const SIZE_MAP = {
  sm: 150,
  md: 280,
  lg: 420
};

const CONTAINER_STYLES = {
  grid: {
    sm: { minHeight: '200px' },
    md: { minHeight: '260px' },
    lg: { minHeight: '340px' }
  },
  list: {
    sm: { width: '160px', height: '120px' },
    md: { width: '200px', height: '150px' },
    lg: { width: '240px', height: '180px' }
  }
};

export const SlideThumbnail = ({ 
  slide: providedSlide, 
  instanceId, 
  templateId,
  size = 'md',
  mode = 'grid',
  className 
}: SlideThumbnailProps) => {
  const [fetchedSlide, setFetchedSlide] = useState<Slide | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (providedSlide || (!instanceId && !templateId)) return;

    const fetchSlide = async () => {
      setIsLoading(true);
      try {
        const query = supabase
          .from("slides")
          .select("*, layers(*)")
          .order("order_index", { ascending: true })
          .limit(1);

        if (instanceId) {
          query.eq("instance_id", instanceId);
        } else if (templateId) {
          query.eq("template_id", templateId);
        }

        const { data: slidesData, error } = await query;

        if (error) throw error;

        if (slidesData && slidesData.length > 0) {
          const slideData = slidesData[0];
          const mappedSlide = {
            ...slideData,
            layers: slideData.layers.map((layer: any) => ({
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
          };
          setFetchedSlide(mappedSlide as Slide);
        }
      } catch (error) {
        console.error("Error fetching slide:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlide();
  }, [instanceId, templateId, providedSlide]);

  const slide = providedSlide || fetchedSlide;
  const maxThumbnailSize = SIZE_MAP[size];
  const containerStyle = CONTAINER_STYLES[mode][size];
  const paddingClass = mode === 'grid' ? 'p-6' : 'p-3';

  if (isLoading) {
    return (
      <div 
        className={`bg-muted/30 ${paddingClass} flex items-center justify-center ${className || ''}`}
        style={containerStyle}
      >
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div 
        className={`bg-muted/30 ${paddingClass} flex flex-col items-center justify-center gap-2 ${className || ''}`}
        style={containerStyle}
      >
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">No preview available</p>
      </div>
    );
  }

  const scale = maxThumbnailSize / Math.max(slide.width, slide.height);

  return (
    <div 
      className={`bg-muted/30 ${paddingClass} flex items-center justify-center overflow-hidden ${className || ''}`}
      style={containerStyle}
    >
      <div 
        className="relative bg-white shadow-md rounded-sm overflow-hidden" 
        style={{
          width: slide.width * scale,
          height: slide.height * scale,
          maxWidth: `${maxThumbnailSize}px`,
          maxHeight: `${maxThumbnailSize}px`
        }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: slide.width,
            height: slide.height
          }}
        >
          <SlideRenderer slide={slide} interactive={false} />
        </div>
      </div>
    </div>
  );
};
