import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { FileText } from "lucide-react";

interface InstanceThumbnailProps {
  instanceId: string;
}

export const InstanceThumbnail = ({ instanceId }: InstanceThumbnailProps) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedThumbnailUrl, setCachedThumbnailUrl] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        // First, try to get cached thumbnail
        const { data: cachedData, error: cacheError } = await supabase
          .from("instance_thumbnails")
          .select("thumbnail_url")
          .eq("instance_id", instanceId)
          .maybeSingle();

        if (!cacheError && cachedData?.thumbnail_url) {
          setCachedThumbnailUrl(cachedData.thumbnail_url);
          setIsLoading(false);
          return;
        }

        // If no cached thumbnail, fall back to fetching slides (only first slide)
        setUseFallback(true);
        const { data: slidesData, error } = await supabase
          .from("slides")
          .select("*, layers(*)")
          .eq("instance_id", instanceId)
          .order("order_index", { ascending: true })
          .limit(1);

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

        // Trigger background thumbnail generation
        if (mappedSlides.length > 0) {
          triggerThumbnailGeneration(instanceId);
        }
      } catch (error) {
        console.error("Error fetching thumbnail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumbnail();
  }, [instanceId]);

  const triggerThumbnailGeneration = async (instanceId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ instanceId }),
      });
    } catch (error) {
      console.error("Error triggering thumbnail generation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="aspect-[16/10] bg-muted/30 rounded-t-lg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Show cached thumbnail if available
  if (cachedThumbnailUrl && !useFallback) {
    return (
      <div className="aspect-[4/3] bg-muted/30 rounded-t-lg overflow-hidden flex items-center justify-center">
        <img 
          src={cachedThumbnailUrl} 
          alt="Thumbnail" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="aspect-[16/10] bg-muted/30 rounded-t-lg flex flex-col items-center justify-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Preview coming soon</p>
      </div>
    );
  }

  const firstSlide = slides[0];
  const maxThumbnailSize = 280;
  const scale = maxThumbnailSize / Math.max(firstSlide.width, firstSlide.height);

  return (
    <div className="aspect-[4/3] bg-muted/30 rounded-t-lg overflow-hidden flex items-center justify-center">
      <div 
        className="relative bg-white shadow-md rounded-sm overflow-hidden" 
        style={{
          width: '100%',
          maxWidth: `${maxThumbnailSize}px`,
          aspectRatio: `${firstSlide.width} / ${firstSlide.height}`
        }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: firstSlide.width,
            height: firstSlide.height
          }}
        >
          <SlideRenderer slide={firstSlide} />
        </div>
      </div>
    </div>
  );
};
