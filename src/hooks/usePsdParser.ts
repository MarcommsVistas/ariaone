import { useState } from 'react';
import { readPsd } from 'ag-psd';
import { Layer, Slide, Template } from '@/store/useTemplateStore';
import { supabase } from '@/integrations/supabase/client';

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
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

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

  const parsePsdFile = async (file: File, brand?: string, category?: string): Promise<Template | null> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressStatus('Initializing...');

    try {
      // Get current user
      setProgress(10);
      setProgressStatus('Authenticating...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload templates');
      }

      // Parse PSD file
      setProgress(20);
      setProgressStatus('Reading PSD file...');
      const buffer = await file.arrayBuffer();
      setProgress(40);
      setProgressStatus('Parsing layers...');
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

      // Upload PSD file to storage
      setProgress(50);
      setProgressStatus('Uploading to storage...');
      const timestamp = Date.now();
      const storagePath = `templates/${timestamp}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('psd-files')
        .upload(storagePath, file, {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload PSD file: ${uploadError.message}`);
      }
      
      setProgress(60);

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('psd-files')
        .getPublicUrl(storagePath);

      // Insert template into database
      setProgressStatus('Creating template...');
      const templateName = file.name.replace('.psd', '');
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: templateName,
          created_by: user.id,
          is_published: false,
          psd_file_url: publicUrl,
          brand: brand || null,
          category: category || null
        })
        .select()
        .single();

      if (templateError || !templateData) {
        throw new Error(`Failed to create template: ${templateError?.message}`);
      }
      
      setProgress(70);
      setProgressStatus('Creating slide...');

      // Insert slide into database
      const { data: slideData, error: slideError } = await supabase
        .from('slides')
        .insert({
          template_id: templateData.id,
          name: templateName,
          width: psd.width || 1080,
          height: psd.height || 1080,
          order_index: 0
        })
        .select()
        .single();

      if (slideError || !slideData) {
        throw new Error(`Failed to create slide: ${slideError?.message}`);
      }

      // Insert layers into database
      setProgress(80);
      setProgressStatus(`Saving ${layers.length} layers...`);
      const layersToInsert = layers.map((layer, index) => ({
        slide_id: slideData.id,
        type: layer.type,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        z_index: index,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        opacity: layer.opacity,
        rotation: layer.rotation,
        text_content: layer.text || null,
        font_family: layer.fontFamily || null,
        font_size: layer.fontSize != null ? Math.round(layer.fontSize) : null,
        color: layer.color || null,
        text_align: layer.align || null,
        line_height: layer.lineHeight || null,
        letter_spacing: layer.letterSpacing || null,
        text_transform: layer.textTransform || null,
        max_length: layer.maxLength || null,
        image_src: layer.src || null
      }));

      const { data: layersData, error: layersError } = await supabase
        .from('layers')
        .insert(layersToInsert)
        .select();

      if (layersError) {
        throw new Error(`Failed to create layers: ${layersError.message}`);
      }

      // Track PSD upload
      setProgress(90);
      setProgressStatus('Finalizing...');
      await supabase
        .from('psd_uploads')
        .insert({
          template_id: templateData.id,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          uploaded_by: user.id
        });

      // Build template object with database IDs
      setProgress(100);
      setProgressStatus('Complete!');
      const dbLayers: Layer[] = layersData.map((dbLayer) => ({
        id: dbLayer.id,
        type: dbLayer.type as 'text' | 'image' | 'shape',
        name: dbLayer.name,
        visible: dbLayer.visible,
        locked: dbLayer.locked,
        zIndex: dbLayer.z_index,
        x: dbLayer.x,
        y: dbLayer.y,
        width: dbLayer.width,
        height: dbLayer.height,
        opacity: dbLayer.opacity,
        rotation: dbLayer.rotation,
        ...(dbLayer.type === 'text' && {
          text: dbLayer.text_content || '',
          fontFamily: dbLayer.font_family || 'DM Sans',
          fontSize: dbLayer.font_size || 16,
          color: dbLayer.color || '#000000',
          align: (dbLayer.text_align as 'left' | 'center' | 'right') || 'left',
          lineHeight: dbLayer.line_height || 1.2,
          letterSpacing: dbLayer.letter_spacing || 0,
          textTransform: (dbLayer.text_transform as 'none' | 'uppercase' | 'lowercase' | 'capitalize') || 'none',
          maxLength: dbLayer.max_length || 500
        }),
        ...(dbLayer.type === 'image' && {
          src: dbLayer.image_src || undefined
        })
      }));

      const slide: Slide = {
        id: slideData.id,
        name: slideData.name,
        width: slideData.width,
        height: slideData.height,
        layers: dbLayers
      };

      const template: Template = {
        id: templateData.id,
        name: templateData.name,
        brand: templateData.brand || undefined,
        category: templateData.category || undefined,
        slides: [slide],
        saved: templateData.is_published
      };

      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      console.error('Error parsing PSD:', err);
      return null;
    }
  };

  const parsePsdFiles = async (files: File[], brand?: string, category?: string): Promise<Template | null> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressStatus('Initializing...');

    try {
      // Get current user
      setProgress(5);
      setProgressStatus('Authenticating...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload templates');
      }

      const psdFiles = files.filter(file => file.name.toLowerCase().endsWith('.psd'));
      
      if (psdFiles.length === 0) {
        throw new Error('No valid PSD files found');
      }

      // Use first file name as template name
      setProgress(10);
      setProgressStatus('Creating template...');
      const templateName = psdFiles[0].name.replace('.psd', '');
      const timestamp = Date.now();

      // Insert template into database first
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: templateName,
          created_by: user.id,
          is_published: false,
          brand: brand || null,
          category: category || null
        })
        .select()
        .single();

      if (templateError || !templateData) {
        throw new Error(`Failed to create template: ${templateError?.message}`);
      }

      const slides: Slide[] = [];
      const progressPerFile = 80 / psdFiles.length; // 80% of progress for processing files
      
      for (let fileIndex = 0; fileIndex < psdFiles.length; fileIndex++) {
        const file = psdFiles[fileIndex];
        const baseProgress = 15 + (fileIndex * progressPerFile);
        
        setProgress(Math.round(baseProgress));
        setProgressStatus(`Processing file ${fileIndex + 1}/${psdFiles.length}: ${file.name}`);

        // Parse PSD
        const buffer = await file.arrayBuffer();
        setProgress(Math.round(baseProgress + progressPerFile * 0.3));
        const psd = readPsd(buffer);

        if (!psd) {
          console.warn(`Failed to parse ${file.name}`);
          continue;
        }

        const layers = psd.children ? flattenLayers(psd.children as PsdLayer[]).reverse() : [];

        // Upload PSD file to storage
        setProgress(Math.round(baseProgress + progressPerFile * 0.5));
        setProgressStatus(`Uploading ${file.name}...`);
        const storagePath = `templates/${templateData.id}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('psd-files')
          .upload(storagePath, file, {
            contentType: 'application/octet-stream',
            upsert: false
          });

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          continue;
        }

        // Insert slide into database
        const { data: slideData, error: slideError } = await supabase
          .from('slides')
          .insert({
            template_id: templateData.id,
            name: file.name.replace('.psd', ''),
            width: psd.width || 1080,
            height: psd.height || 1080,
            order_index: fileIndex
          })
          .select()
          .single();

        if (slideError || !slideData) {
          console.error(`Failed to create slide for ${file.name}:`, slideError);
          continue;
        }

        // Insert layers into database
        const layersToInsert = layers.map((layer, index) => ({
          slide_id: slideData.id,
          type: layer.type,
          name: layer.name,
          visible: layer.visible,
          locked: layer.locked,
          z_index: index,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          opacity: layer.opacity,
          rotation: layer.rotation,
          text_content: layer.text || null,
          font_family: layer.fontFamily || null,
          font_size: layer.fontSize != null ? Math.round(layer.fontSize) : null,
          color: layer.color || null,
          text_align: layer.align || null,
          line_height: layer.lineHeight || null,
          letter_spacing: layer.letterSpacing || null,
          text_transform: layer.textTransform || null,
          max_length: layer.maxLength || null,
          image_src: layer.src || null
        }));

        const { data: layersData, error: layersError } = await supabase
          .from('layers')
          .insert(layersToInsert)
          .select();

        if (layersError || !layersData) {
          console.error(`Failed to create layers for ${file.name}:`, layersError);
          continue;
        }

        // Track PSD upload
        await supabase
          .from('psd_uploads')
          .insert({
            template_id: templateData.id,
            file_name: file.name,
            file_size: file.size,
            storage_path: storagePath,
            uploaded_by: user.id
          });

        // Build slide object with database IDs
        const dbLayers: Layer[] = layersData.map((dbLayer) => ({
          id: dbLayer.id,
          type: dbLayer.type as 'text' | 'image' | 'shape',
          name: dbLayer.name,
          visible: dbLayer.visible,
          locked: dbLayer.locked,
          zIndex: dbLayer.z_index,
          x: dbLayer.x,
          y: dbLayer.y,
          width: dbLayer.width,
          height: dbLayer.height,
          opacity: dbLayer.opacity,
          rotation: dbLayer.rotation,
          ...(dbLayer.type === 'text' && {
            text: dbLayer.text_content || '',
            fontFamily: dbLayer.font_family || 'DM Sans',
            fontSize: dbLayer.font_size || 16,
            color: dbLayer.color || '#000000',
            align: (dbLayer.text_align as 'left' | 'center' | 'right') || 'left',
            lineHeight: dbLayer.line_height || 1.2,
            letterSpacing: dbLayer.letter_spacing || 0,
            textTransform: (dbLayer.text_transform as 'none' | 'uppercase' | 'lowercase' | 'capitalize') || 'none',
            maxLength: dbLayer.max_length || 500
          }),
          ...(dbLayer.type === 'image' && {
            src: dbLayer.image_src || undefined
          })
        }));

        const slide: Slide = {
          id: slideData.id,
          name: slideData.name,
          width: slideData.width,
          height: slideData.height,
          layers: dbLayers
        };

        slides.push(slide);
      }

      if (slides.length === 0) {
        // Clean up template if no slides were created
        await supabase.from('templates').delete().eq('id', templateData.id);
        throw new Error('Failed to parse any PSD files');
      }

      setProgress(95);
      setProgressStatus('Finalizing template...');

      const template: Template = {
        id: templateData.id,
        name: templateData.name,
        brand: templateData.brand || undefined,
        category: templateData.category || undefined,
        slides,
        saved: templateData.is_published
      };

      setProgress(100);
      setProgressStatus('Complete!');
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      console.error('Error parsing PSD files:', err);
      return null;
    }
  };

  return { parsePsdFile, parsePsdFiles, isLoading, error, progress, progressStatus };
};

export const useAddSlideToTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

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
      const x = layer.left;
      const y = layer.top;
      const width = layer.right - layer.left;
      const height = layer.bottom - layer.top;

      if (layer.children && layer.children.length > 0) {
        result.push(...flattenLayers(layer.children, 0, 0, zIndexCounter));
        continue;
      }

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
        
        if (layer.text.style?.fontSize) {
          fontSize = layer.text.style.fontSize;
        } else if (layer.text.font?.sizes && layer.text.font.sizes.length > 0) {
          fontSize = layer.text.font.sizes[0];
        }

        if (layer.text.font?.name) {
          fontFamily = layer.text.font.name;
        }

        if (layer.text.style?.fillColor) {
          const fc = layer.text.style.fillColor;
          color = rgbToHex(fc.r, fc.g, fc.b);
        } else if (layer.text.font?.colors && layer.text.font.colors.length > 0) {
          const [r, g, b] = layer.text.font.colors[0];
          color = rgbToHex(r, g, b);
        }

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
          normalizedOpacity = rawOpacity;
        } else if (rawOpacity > 1 && rawOpacity <= 255) {
          normalizedOpacity = rawOpacity / 255;
        } else {
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

  const addSlideToTemplate = async (file: File, templateId: string): Promise<Slide | null> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressStatus('Initializing...');

    try {
      setProgress(10);
      setProgressStatus('Authenticating...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Get current template to determine next order_index
      setProgress(20);
      setProgressStatus('Loading template...');
      const { data: existingSlides, error: slidesError } = await supabase
        .from('slides')
        .select('order_index')
        .eq('template_id', templateId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (slidesError) {
        throw new Error(`Failed to fetch slides: ${slidesError.message}`);
      }

      const nextOrderIndex = existingSlides && existingSlides.length > 0 
        ? existingSlides[0].order_index + 1 
        : 0;

      setProgress(30);
      setProgressStatus('Reading PSD file...');
      const buffer = await file.arrayBuffer();
      
      setProgress(50);
      setProgressStatus('Parsing layers...');
      const psd = readPsd(buffer);

      if (!psd) {
        throw new Error('Failed to parse PSD file');
      }

      const layers = psd.children ? flattenLayers(psd.children as PsdLayer[]).reverse() : [];

      // Upload PSD file
      setProgress(60);
      setProgressStatus('Uploading to storage...');
      const storagePath = `templates/${templateId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('psd-files')
        .upload(storagePath, file, {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload PSD: ${uploadError.message}`);
      }

      setProgress(70);
      setProgressStatus('Creating slide...');
      
      // Insert slide
      const { data: slideData, error: slideError } = await supabase
        .from('slides')
        .insert({
          template_id: templateId,
          name: file.name.replace('.psd', ''),
          width: psd.width || 1080,
          height: psd.height || 1080,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (slideError || !slideData) {
        throw new Error(`Failed to create slide: ${slideError?.message}`);
      }

      setProgress(80);
      setProgressStatus(`Saving ${layers.length} layers...`);

      // Insert layers
      const layersToInsert = layers.map((layer, index) => ({
        slide_id: slideData.id,
        type: layer.type,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        z_index: index,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        opacity: layer.opacity,
        rotation: layer.rotation,
        text_content: layer.text || null,
        font_family: layer.fontFamily || null,
        font_size: layer.fontSize != null ? Math.round(layer.fontSize) : null,
        color: layer.color || null,
        text_align: layer.align || null,
        line_height: layer.lineHeight || null,
        letter_spacing: layer.letterSpacing || null,
        text_transform: layer.textTransform || null,
        max_length: layer.maxLength || null,
        image_src: layer.src || null
      }));

      const { data: layersData, error: layersError } = await supabase
        .from('layers')
        .insert(layersToInsert)
        .select();

      if (layersError || !layersData) {
        throw new Error(`Failed to create layers: ${layersError?.message}`);
      }

      setProgress(90);
      setProgressStatus('Finalizing...');

      // Track PSD upload
      await supabase
        .from('psd_uploads')
        .insert({
          template_id: templateId,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          uploaded_by: user.id
        });

      setProgress(100);
      setProgressStatus('Complete!');

      // Build slide object
      const dbLayers: Layer[] = layersData.map((dbLayer) => ({
        id: dbLayer.id,
        type: dbLayer.type as 'text' | 'image' | 'shape',
        name: dbLayer.name,
        visible: dbLayer.visible,
        locked: dbLayer.locked,
        zIndex: dbLayer.z_index,
        x: dbLayer.x,
        y: dbLayer.y,
        width: dbLayer.width,
        height: dbLayer.height,
        opacity: dbLayer.opacity,
        rotation: dbLayer.rotation,
        ...(dbLayer.type === 'text' && {
          text: dbLayer.text_content || '',
          fontFamily: dbLayer.font_family || 'DM Sans',
          fontSize: dbLayer.font_size || 16,
          color: dbLayer.color || '#000000',
          align: (dbLayer.text_align as 'left' | 'center' | 'right') || 'left',
          lineHeight: dbLayer.line_height || 1.2,
          letterSpacing: dbLayer.letter_spacing || 0,
          textTransform: (dbLayer.text_transform as 'none' | 'uppercase' | 'lowercase' | 'capitalize') || 'none',
          maxLength: dbLayer.max_length || 500
        }),
        ...(dbLayer.type === 'image' && {
          src: dbLayer.image_src || undefined
        })
      }));

      const slide: Slide = {
        id: slideData.id,
        name: slideData.name,
        width: slideData.width,
        height: slideData.height,
        layers: dbLayers
      };

      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      return slide;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
      console.error('Error adding slide:', err);
      return null;
    }
  };

  return { addSlideToTemplate, isLoading, error, progress, progressStatus };
};
