import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { toast } from 'sonner';
import JSZip from 'jszip';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

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

      // Add a small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const exportFunction = format === 'png' ? toPng : toJpeg;
      const dataUrl = await exportFunction(element, {
        quality,
        pixelRatio: 2, // 2x for retina quality
        cacheBust: true,
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

  return { exportAsImage, exportAllSlides, isExporting };
};
