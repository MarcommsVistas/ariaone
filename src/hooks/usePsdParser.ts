import { useState } from 'react';
import { readPsd } from 'ag-psd';
import { Layer, Slide, Template } from '@/store/useTemplateStore';

interface PsdLayer {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  opacity: number;
  blendMode?: string;
  canvas?: HTMLCanvasElement;
  text?: {
    text: string;
    font?: {
      name?: string;
      sizes?: number[];
      colors?: number[][];
    };
    style?: {
      fontSize?: number;
      fillColor?: { r: number; g: number; b: number };
      alignment?: string[];
    };
  };
  children?: PsdLayer[];
}

export const usePsdParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const canvasToDataUrl = (canvas: HTMLCanvasElement | undefined): string | undefined => {
    if (!canvas) return undefined;
    try {
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error converting canvas to data URL:', error);
      return undefined;
    }
  };

  const flattenLayers = (
    layers: PsdLayer[], 
    parentX = 0, 
    parentY = 0,
    zIndexCounter = { value: 0 }
  ): Layer[] => {
    const result: Layer[] = [];

    for (const layer of layers) {
      // Don't accumulate parent coordinates for groups - use absolute positions
      const x = layer.left;
      const y = layer.top;
      const width = layer.right - layer.left;
      const height = layer.bottom - layer.top;

      console.log('Parsing layer:', layer.name, { x, y, width, height, hasCanvas: !!layer.canvas, hasText: !!layer.text });

      // Process children first (if folder/group)
      if (layer.children && layer.children.length > 0) {
        result.push(...flattenLayers(layer.children, 0, 0, zIndexCounter));
        continue; // Skip adding the group itself
      }

      // Determine layer type
      let type: 'text' | 'image' | 'shape' = 'shape';
      let textContent = '';
      let fontSize = 16;
      let fontFamily = 'DM Sans';
      let color = '#000000';
      let align: 'left' | 'center' | 'right' = 'left';
      let src: string | undefined;

      if (layer.text) {
        type = 'text';
        textContent = layer.text.text || '';
        
        // Get font size
        if (layer.text.style?.fontSize) {
          fontSize = layer.text.style.fontSize;
        } else if (layer.text.font?.sizes && layer.text.font.sizes.length > 0) {
          fontSize = layer.text.font.sizes[0];
        }

        // Get font family
        if (layer.text.font?.name) {
          fontFamily = layer.text.font.name;
        }

        // Get color
        if (layer.text.style?.fillColor) {
          const fc = layer.text.style.fillColor;
          color = rgbToHex(fc.r, fc.g, fc.b);
        } else if (layer.text.font?.colors && layer.text.font.colors.length > 0) {
          const [r, g, b] = layer.text.font.colors[0];
          color = rgbToHex(r, g, b);
        }

        // Get alignment
        if (layer.text.style?.alignment && layer.text.style.alignment.length > 0) {
          const alignment = layer.text.style.alignment[0].toLowerCase();
          if (alignment.includes('center')) align = 'center';
          else if (alignment.includes('right')) align = 'right';
          else align = 'left';
        }
      } else if (layer.canvas) {
        type = 'image';
        src = canvasToDataUrl(layer.canvas);
      }

      const rawOpacity = layer.opacity;
      let normalizedOpacity = 1;

      if (rawOpacity !== undefined && rawOpacity !== null) {
        if (rawOpacity > 0 && rawOpacity <= 1) {
          // Opacity is already in 0-1 range
          normalizedOpacity = rawOpacity;
        } else if (rawOpacity > 1 && rawOpacity <= 255) {
          // Opacity is in 0-255 range, normalize to 0-1
          normalizedOpacity = rawOpacity / 255;
        } else {
          // Any other value (including 0) defaults to fully opaque
          normalizedOpacity = 1;
        }
      }

      const newLayer: Layer = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        name: layer.name || 'Unnamed Layer',
        visible: true,
        locked: false,
        zIndex: zIndexCounter.value++,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        opacity: normalizedOpacity,
        rotation: 0,
        ...(type === 'text' && {
          text: textContent,
          fontFamily,
          fontSize,
          color,
          align,
          lineHeight: 1.2,
          letterSpacing: 0,
          textTransform: 'none',
          maxLength: 500,
        }),
        ...(type === 'image' && { src }),
      };

      result.push(newLayer);
    }

    return result;
  };

  const parsePsdFile = async (file: File): Promise<Template | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const psd = readPsd(buffer);

      if (!psd) {
        throw new Error('Failed to parse PSD file');
      }

      const layers = psd.children ? flattenLayers(psd.children as PsdLayer[]).reverse() : [];

      console.log('PSD parsed:', {
        dimensions: { width: psd.width, height: psd.height },
        layerCount: layers.length,
        layers: layers.map(l => ({ name: l.name, type: l.type, x: l.x, y: l.y, width: l.width, height: l.height }))
      });

      const slide: Slide = {
        id: `slide-${Date.now()}`,
        name: file.name.replace('.psd', ''),
        width: psd.width || 1080,
        height: psd.height || 1080,
        layers,
      };

      const template: Template = {
        id: `template-${Date.now()}`,
        name: file.name.replace('.psd', ''),
        slides: [slide],
      };

      setIsLoading(false);
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Error parsing PSD:', err);
      return null;
    }
  };

  return { parsePsdFile, isLoading, error };
};
