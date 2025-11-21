import { Layer, Slide } from "@/store/useTemplateStore";
import { CanvasLayer } from "./CanvasLayer";

interface SlideRendererProps {
  slide: Slide;
  scale?: number;
  interactive?: boolean;
  onLayerClick?: (layerId: string) => void;
}

export const SlideRenderer = ({ 
  slide, 
  scale = 1, 
  interactive = false,
  onLayerClick 
}: SlideRendererProps) => {
  return (
    <div 
      className="relative bg-white shadow-lg overflow-hidden"
      style={{
        width: slide.width,
        height: slide.height,
      }}
    >
      {slide.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(layer => (
          <CanvasLayer
            key={layer.id}
            layer={layer}
            interactive={interactive}
            onClick={() => onLayerClick?.(layer.id)}
          />
        ))}
    </div>
  );
};
