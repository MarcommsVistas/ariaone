import { Layer } from "@/store/useTemplateStore";

interface CanvasLayerProps {
  layer: Layer;
  interactive?: boolean;
  onClick?: () => void;
}

export const CanvasLayer = ({ layer, interactive = false, onClick }: CanvasLayerProps) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    opacity: layer.opacity,
    transform: `rotate(${layer.rotation}deg)`,
    cursor: interactive ? 'pointer' : 'default',
    pointerEvents: layer.locked ? 'none' : 'auto',
  };

  if (layer.type === 'text') {
    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: layer.fontFamily || 'DM Sans, sans-serif',
          fontSize: layer.fontSize || 16,
          fontWeight: layer.fontWeight || 400,
          color: layer.color || '#000000',
          textAlign: layer.align || 'left',
          lineHeight: layer.lineHeight || 1.2,
          letterSpacing: layer.letterSpacing || 0,
          textTransform: layer.textTransform || 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
        }}
        onClick={onClick}
      >
        {layer.text}
      </div>
    );
  }

  if (layer.type === 'image' && layer.src) {
    return (
      <img
        src={layer.src}
        alt={layer.name}
        style={{
          ...baseStyle,
          objectFit: 'cover',
        }}
        onClick={onClick}
      />
    );
  }

  if (layer.type === 'shape') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: layer.color || '#000000',
        }}
        onClick={onClick}
      />
    );
  }

  return null;
};
