import { useEffect, useRef } from "react";
import { useFontStore } from "@/store/useFontStore";

export const useGlobalFonts = () => {
  const { uploadedFonts } = useFontStore();
  const loadedFamiliesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    uploadedFonts.forEach((font) => {
      if (!font.family || !font.dataUrl) return;

      // Avoid re-creating the same FontFace repeatedly
      if (loadedFamiliesRef.current.has(font.family)) return;

      const isAlreadyInDocument = Array.from(document.fonts).some(
        (f) => f.family === font.family
      );
      if (isAlreadyInDocument) {
        loadedFamiliesRef.current.add(font.family);
        return;
      }

      const fontFace = new FontFace(
        font.family,
        `url(${font.dataUrl})`,
        {
          weight: font.weight?.toString() || 'normal',
          style: font.style ?? "normal",
        }
      );

      fontFace
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
          loadedFamiliesRef.current.add(font.family);
          console.log(`✓ Loaded custom font: ${font.name} (${font.family})`);
        })
        .catch((err) => {
          console.error(`✗ Failed to load custom font ${font.name}:`, err);
        });
    });
  }, [uploadedFonts]);
};
