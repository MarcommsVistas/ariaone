import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { useFontStore } from '@/store/useFontStore';
import { supabase } from '@/integrations/supabase/client';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { uploadedFonts } = useFontStore();

  const injectCustomFonts = async () => {
    const fontStyle = document.createElement('style');
    fontStyle.id = 'custom-fonts-for-export';
    
    // Fetch font data from Supabase Storage and convert to base64
    for (const font of uploadedFonts) {
      try {
        const { data, error } = await supabase.storage
          .from('custom-fonts')
          .createSignedUrl(font.storage_path, 60); // 1 minute expiry for export

        if (error) throw error;
        if (!data?.signedUrl) continue;

        // Fetch the font file and convert to base64
        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const fontFaceRule = `
          @font-face {
            font-family: '${font.family}';
            src: url('${dataUrl}');
            font-weight: ${font.weight || 400};
            font-style: ${font.style || 'normal'};
          }
        `;
        fontStyle.appendChild(document.createTextNode(fontFaceRule));
      } catch (error) {
        console.error(`Failed to fetch font ${font.name} for export:`, error);
      }
    }
    
    document.head.appendChild(fontStyle);
    
    // Wait for fonts to load - including common Google Fonts
    await document.fonts.ready;
    
    // Pre-load common fonts used in templates
    const commonFonts = [
      '400 16px "DM Sans"',
      '500 16px "DM Sans"',
      '600 16px "DM Sans"',
      '700 16px "DM Sans"',
    ];
    
    await Promise.all([
      ...commonFonts.map(f => document.fonts.load(f).catch(() => {})),
      ...uploadedFonts.map(font => 
        document.fonts.load(`${font.weight || 400} 16px "${font.family}"`).catch(() => {})
      )
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const exportAsImage = async (
    elementId: string,
    filename: string,
    format: 'png' | 'jpeg' = 'jpeg',
    quality = 0.95
  ) => {
    setIsExporting(true);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Inject fonts
      await injectCustomFonts();

      // Wait for all custom fonts to be loaded
      if (uploadedFonts.length > 0) {
        await Promise.all(
          uploadedFonts.map(font => document.fonts.load(`16px ${font.family}`))
        );
      }

      // Wait for all images to load
      const images = element.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            })
        )
      );

      // Add a delay to ensure fonts and rendering are complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      const exportFunction = format === 'png' ? toPng : toJpeg;
      const dataUrl = await exportFunction(element, {
        quality,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true, // Skip external stylesheets that cause CORS errors
      });

      // Clean up injected fonts
      const fontStyle = document.getElementById('custom-fonts-for-export');
      if (fontStyle) fontStyle.remove();

      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Exported as ${filename}.${format}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export image');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllSlides = async (
    slides: Array<{ id: string; name: string }>,
    renderSlide: (slideId: string) => Promise<void>,
    elementId: string,
    templateName: string,
    format: 'png' | 'jpeg' = 'jpeg',
    quality = 0.95
  ) => {
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const exportFunction = format === 'png' ? toPng : toJpeg;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Render the slide
        await renderSlide(slide.id);
        
        // Wait for rendering
        await new Promise((resolve) => setTimeout(resolve, 500));

        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Element not found');
        }

        // Inject fonts
        await injectCustomFonts();

        // Wait for all custom fonts to be loaded
        if (uploadedFonts.length > 0) {
          await Promise.all(
            uploadedFonts.map(font => document.fonts.load(`16px ${font.family}`))
          );
        }

        // Wait for all images to load
        const images = element.getElementsByTagName('img');
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) {
                  resolve(null);
                } else {
                  img.onload = () => resolve(null);
                  img.onerror = () => resolve(null);
                }
              })
          )
        );

        // Add delay to ensure fonts are rendered
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Export the slide
        const dataUrl = await exportFunction(element, {
          quality,
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true, // Skip external stylesheets that cause CORS errors
        });

        // Clean up injected fonts
        const fontStyle = document.getElementById('custom-fonts-for-export');
        if (fontStyle) fontStyle.remove();

        // Convert data URL to blob
        const base64Data = dataUrl.split(',')[1];
        const blob = await fetch(`data:image/${format};base64,${base64Data}`).then(r => r.blob());
        
        // Add to zip with proper naming
        const fileName = `${templateName}-slide-${i + 1}-${slide.name}.${format}`;
        zip.file(fileName, blob);

        toast(`Exported slide ${i + 1} of ${slides.length}`);
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${templateName}-all-slides.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();

      toast.success(`Successfully exported ${slides.length} slides`);
    } catch (error) {
      console.error('Batch export failed:', error);
      toast.error('Failed to export all slides');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportAsImage, exportAllSlides, isExporting };
};
