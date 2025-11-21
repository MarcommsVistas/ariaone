import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { toast } from 'sonner';

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

  return { exportAsImage, isExporting };
};
