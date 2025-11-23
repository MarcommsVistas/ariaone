import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  weight?: number;
  style?: 'normal' | 'italic';
  storage_path: string;
  file_size: number;
}

interface FontStore {
  systemFonts: CustomFont[];
  uploadedFonts: CustomFont[];
  isLoading: boolean;
  fetchFonts: () => Promise<void>;
  addFont: (font: CustomFont) => void;
  removeFont: (fontId: string) => Promise<void>;
}

export const useFontStore = create<FontStore>((set, get) => ({
  systemFonts: [],
  uploadedFonts: [],
  isLoading: false,
  
  fetchFonts: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch system fonts (user_id IS NULL)
      const { data: systemFontsData, error: systemError } = await supabase
        .from('custom_fonts')
        .select('*')
        .is('user_id', null)
        .order('name', { ascending: true });

      if (systemError) throw systemError;

      // Fetch user's custom fonts
      let userFontsData = [];
      if (user) {
        const { data, error } = await supabase
          .from('custom_fonts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        userFontsData = data || [];
      }

      set({ 
        systemFonts: (systemFontsData || []).map(font => ({
          ...font,
          style: (font.style === 'italic' ? 'italic' : 'normal') as 'italic' | 'normal'
        })),
        uploadedFonts: userFontsData.map(font => ({
          ...font,
          style: (font.style === 'italic' ? 'italic' : 'normal') as 'italic' | 'normal'
        })),
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching fonts:', error);
      set({ systemFonts: [], uploadedFonts: [], isLoading: false });
    }
  },

  addFont: (font) => set((state) => ({
    uploadedFonts: [...state.uploadedFonts, font]
  })),

  removeFont: async (fontId) => {
    try {
      const fontToRemove = get().uploadedFonts.find(f => f.id === fontId);
      if (!fontToRemove) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('custom-fonts')
        .remove([fontToRemove.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('custom_fonts')
        .delete()
        .eq('id', fontId);

      if (dbError) throw dbError;

      // Update local state
      set((state) => ({
        uploadedFonts: state.uploadedFonts.filter(f => f.id !== fontId)
      }));
    } catch (error) {
      console.error('Error removing font:', error);
      throw error;
    }
  },
}));
