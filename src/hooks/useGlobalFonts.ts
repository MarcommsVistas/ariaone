import { useEffect, useRef } from "react";
import { useFontStore } from "@/store/useFontStore";
import { supabase } from "@/integrations/supabase/client";

export const useGlobalFonts = () => {
  const { uploadedFonts, fetchFonts } = useFontStore();
  const loadedFamiliesRef = useRef<Set<string>>(new Set());

  // Fetch fonts from Supabase on mount
  useEffect(() => {
    fetchFonts();
  }, [fetchFonts]);

  // Load fonts when they change
  useEffect(() => {
    const loadFonts = async () => {
      for (const font of uploadedFonts) {
        if (!font.family || !font.storage_path) continue;

        // Skip if already loaded
        if (loadedFamiliesRef.current.has(font.family)) continue;

        const isAlreadyInDocument = Array.from(document.fonts).some(
          (f) => f.family === font.family
        );
        if (isAlreadyInDocument) {
          loadedFamiliesRef.current.add(font.family);
          continue;
        }

        try {
          // Get signed URL from Supabase Storage
          const { data, error } = await supabase.storage
            .from('custom-fonts')
            .createSignedUrl(font.storage_path, 3600); // 1 hour expiry

          if (error) throw error;
          if (!data?.signedUrl) throw new Error('No signed URL returned');

          // Create and load FontFace
          const fontFace = new FontFace(
            font.family,
            `url(${data.signedUrl})`,
            {
              weight: font.weight?.toString() || 'normal',
              style: font.style ?? "normal",
            }
          );

          const loaded = await fontFace.load();
          document.fonts.add(loaded);
          loadedFamiliesRef.current.add(font.family);
          console.log(`✓ Loaded custom font: ${font.name} (${font.family})`);
        } catch (err) {
          console.error(`✗ Failed to load custom font ${font.name}:`, err);
        }
      }
    };

    loadFonts();
  }, [uploadedFonts]);
};
