import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { useFontStore } from '@/store/useFontStore';
import { supabase } from '@/integrations/supabase/client';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { uploadedFonts } = useFontStore();

  const injectCustomFonts = async (element: HTMLElement): Promise<string> => {
    // Collect all unique font families used in the element
    const usedFontFamilies = new Set<string>();
    element.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (fontFamily) usedFontFamilies.add(fontFamily);
    });

    console.log('Used font families in export:', Array.from(usedFontFamilies));
    
    let fontEmbedCSS = '';
    
    // Match used fonts to uploaded fonts with fuzzy matching
    for (const font of uploadedFonts) {
      // Check if this font or a variation is used
      const isUsed = Array.from(usedFontFamilies).some(used => {
        const usedLower = used.toLowerCase();
        const fontLower = font.family.toLowerCase();
        return usedLower.includes(fontLower) || fontLower.includes(usedLower);
      });
      
      if (!isUsed) continue;

      console.log(`Embedding font: ${font.family} (${font.name})`);
      
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

        // Add @font-face rule to CSS
        fontEmbedCSS += `
          @font-face {
            font-family: '${font.family}';
            src: url('${dataUrl}');
            font-weight: ${font.weight || 400};
            font-style: ${font.style || 'normal'};
          }
        `;
      } catch (error) {
        console.error(`Failed to fetch font ${font.name} for export:`, error);
      }
    }
    
    // Wait for fonts to load
    await document.fonts.ready;
    
    // Pre-load fonts used in the element
    await Promise.all(
      Array.from(usedFontFamilies).map(family =>
        document.fonts.load(`400 16px "${family}"`).catch(() => {})
      )
    );
    
    // Extra delay for font rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return fontEmbedCSS;
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

      // Inject fonts and get CSS
      const fontEmbedCSS = await injectCustomFonts(element);

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

      const exportFunction = format === 'png' ? toPng : toJpeg;
      const dataUrl = await exportFunction(element, {
        quality,
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS, // Provide embedded fonts as CSS
        backgroundColor: '#ffffff',
        width: parseInt(element.style.width) || element.offsetWidth,
        height: parseInt(element.style.height) || element.offsetHeight,
        // Override transform during capture to get 1:1 output
        style: {
          transform: 'none',
          transformOrigin: 'top left',
        },
      });

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

        // Inject fonts and get CSS
        const fontEmbedCSS = await injectCustomFonts(element);

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

        // Export the slide
        const dataUrl = await exportFunction(element, {
          quality,
          pixelRatio: 2,
          cacheBust: true,
          fontEmbedCSS, // Provide embedded fonts as CSS
          backgroundColor: '#ffffff',
          width: parseInt(element.style.width) || element.offsetWidth,
          height: parseInt(element.style.height) || element.offsetHeight,
          // Override transform during capture to get 1:1 output
          style: {
            transform: 'none',
            transformOrigin: 'top left',
          },
        });

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

  const exportAsPdf = async (
    slides: Array<{ id: string; name: string; width: number; height: number }>,
    renderSlide: (slideId: string) => Promise<void>,
    elementId: string,
    templateName: string,
    quality = 0.95
  ) => {
    setIsExporting(true);

    try {
      if (slides.length === 0) {
        throw new Error('No slides to export');
      }

      const firstSlide = slides[0];
      const orientation = firstSlide.width > firstSlide.height ? 'landscape' : 'portrait';
      
      // Convert pixels to mm at 96 DPI
      const pxToMm = (px: number) => px * 0.264583;
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [pxToMm(firstSlide.width), pxToMm(firstSlide.height)]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Render the slide
        await renderSlide(slide.id);
        await new Promise((resolve) => setTimeout(resolve, 500));

        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Element not found');
        }

        // Inject fonts and get CSS
        const fontEmbedCSS = await injectCustomFonts(element);

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

        // Export slide as JPEG data URL
        const dataUrl = await toJpeg(element, {
          quality,
          pixelRatio: 2,
          cacheBust: true,
          fontEmbedCSS,
          backgroundColor: '#ffffff',
          width: slide.width,
          height: slide.height,
          style: {
            transform: 'none',
            transformOrigin: 'top left',
          },
        });

        // Add new page for slides after the first
        if (i > 0) {
          const slideOrientation = slide.width > slide.height ? 'landscape' : 'portrait';
          pdf.addPage([pxToMm(slide.width), pxToMm(slide.height)], slideOrientation);
        }

        // Add image to cover full page
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pxToMm(slide.width), pxToMm(slide.height));

        toast(`Processing slide ${i + 1} of ${slides.length}`);
      }

      // Download PDF
      pdf.save(`${templateName}.pdf`);
      toast.success(`Successfully exported ${slides.length} slide${slides.length > 1 ? 's' : ''} as PDF`);

    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportAsImage, exportAllSlides, exportAsPdf, isExporting };
};
