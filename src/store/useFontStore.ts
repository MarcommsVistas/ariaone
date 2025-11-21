import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomFont {
  name: string;
  family: string;
  dataUrl: string; // Store the font data URL for export
}

interface FontStore {
  uploadedFonts: CustomFont[];
  addFont: (font: CustomFont) => void;
  removeFont: (family: string) => void;
}

export const useFontStore = create<FontStore>()(
  persist(
    (set) => ({
      uploadedFonts: [],
      
      addFont: (font) => set((state) => {
        // Check if font already exists
        if (state.uploadedFonts.some(f => f.family === font.family)) {
          return state;
        }
        return { uploadedFonts: [...state.uploadedFonts, font] };
      }),
      
      removeFont: (family) => set((state) => ({
        uploadedFonts: state.uploadedFonts.filter(f => f.family !== family),
      })),
    }),
    {
      name: 'font-storage',
    }
  )
);
