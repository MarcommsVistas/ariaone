import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'shape';
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  
  // Positioning
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Style
  opacity: number;
  rotation: number;
  
  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  maxLength?: number;
  
  // Image specific
  src?: string;
}

export interface Slide {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
}

export interface Template {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  slides: Slide[];
  saved?: boolean; // Whether template is published for HR use
  created_at?: string;
  updated_at?: string;
}

interface TemplateStore {
  templates: Template[];
  currentTemplate: Template | null;
  currentSlide: Slide | null;
  currentSlideIndex: number;
  selectedLayer: Layer | null;
  mode: 'admin' | 'hr';
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;
  
  setMode: (mode: 'admin' | 'hr') => void;
  fetchTemplates: () => Promise<void>;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
  addTemplate: (template: Template) => void;
  addSlide: (slide: Slide) => void;
  setCurrentTemplate: (templateId: string) => void;
  setCurrentSlide: (slideId: string) => void;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  reorderSlides: (newOrder: Slide[]) => Promise<void>;
  setSelectedLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => Promise<void>;
  deleteLayer: (layerId: string) => Promise<void>;
  reorderLayers: (slideId: string, newOrder: Layer[]) => Promise<void>;
  updateTemplateName: (name: string) => void;
  updateTemplateBrand: (brand: string) => void;
  updateTemplateCategory: (category: string) => void;
  saveTemplate: () => Promise<void>;
  publishTemplate: () => Promise<void>;
  unpublishTemplate: () => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  clearCurrentTemplate: () => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => {
  // Helper function to mark template as unpublished when edited
  const markTemplateAsUnpublished = async (templateId: string) => {
    const state = get();
    const template = state.templates.find(t => t.id === templateId);
    if (!template?.saved) return; // Already unpublished
    
    // Update local state
    set((state) => {
      const updatedTemplates = state.templates.map(t =>
        t.id === templateId ? { ...t, saved: false } : t
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === templateId);
      
      return {
        templates: updatedTemplates,
        currentTemplate: state.currentTemplate?.id === templateId 
          ? updatedTemplate || null 
          : state.currentTemplate,
      };
    });

    // Sync to database
    try {
      await supabase
        .from('templates')
        .update({ is_published: false })
        .eq('id', templateId);
    } catch (error) {
      console.error('Error unpublishing template:', error);
    }
  };

  return {
    templates: [],
    currentTemplate: null,
    currentSlide: null,
    currentSlideIndex: 0,
    selectedLayer: null,
    mode: 'admin',
    isLoading: false,
    realtimeChannel: null,
    
    setMode: (mode) => set({ mode }),
  
  fetchTemplates: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user authenticated');
        set({ templates: [], isLoading: false });
        return;
      }

      // Check user role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isMarcomms = userRoles?.some(r => r.role === 'marcomms');
      const isHR = userRoles?.some(r => r.role === 'hr');

      // Fetch templates based on role
      let query = supabase
        .from('templates')
        .select(`
          id,
          name,
          brand,
          category,
          is_published,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // HR users only see published templates
      if (isHR && !isMarcomms) {
        query = query.eq('is_published', true);
      }

      const { data: templatesData, error: templatesError } = await query;

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        set({ isLoading: false });
        return;
      }

      // Fetch slides and layers for each template
      const templates: Template[] = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: slidesData } = await supabase
            .from('slides')
            .select('*')
            .eq('template_id', template.id)
            .order('order_index', { ascending: true });

          const slides: Slide[] = await Promise.all(
            (slidesData || []).map(async (slide) => {
              const { data: layersData } = await supabase
                .from('layers')
                .select('*')
                .eq('slide_id', slide.id)
                .order('z_index', { ascending: true });

              const layers: Layer[] = (layersData || []).map(dbLayer => ({
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
                  fontWeight: 400,
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

              return {
                id: slide.id,
                name: slide.name,
                width: slide.width,
                height: slide.height,
                layers
              };
            })
          );

          return {
            id: template.id,
            name: template.name,
            brand: template.brand || undefined,
            category: template.category || undefined,
            slides,
            saved: template.is_published,
            created_at: template.created_at,
            updated_at: template.updated_at
          };
        })
      );

      set({ templates, isLoading: false });
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
      set({ isLoading: false });
    }
  },

  subscribeToChanges: () => {
    const channel = supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates'
        },
        () => {
          console.log('Templates changed, refetching...');
          get().fetchTemplates();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'layers'
        },
        () => {
          console.log('Layers changed, refetching...');
          get().fetchTemplates();
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromChanges: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },
  
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, template],
    currentTemplate: template,
    currentSlide: template.slides[0] || null,
    currentSlideIndex: 0,
  })),
  
  addSlide: (slide) => set((state) => {
    if (!state.currentTemplate) return state;
    
    const updatedTemplate = {
      ...state.currentTemplate,
      slides: [...state.currentTemplate.slides, slide]
    };
    
    return {
      templates: state.templates.map(t => 
        t.id === state.currentTemplate?.id ? updatedTemplate : t
      ),
      currentTemplate: updatedTemplate,
    };
  }),
  
  setCurrentTemplate: (templateId) => set((state) => {
    const template = state.templates.find(t => t.id === templateId);
    return {
      currentTemplate: template || null,
      currentSlide: template?.slides[0] || null,
      currentSlideIndex: 0,
      selectedLayer: null,
    };
  }),
  
  setCurrentSlide: (slideId) => set((state) => {
    const slide = state.currentTemplate?.slides.find(s => s.id === slideId);
    const slideIndex = state.currentTemplate?.slides.findIndex(s => s.id === slideId) ?? 0;
    return {
      currentSlide: slide || null,
      currentSlideIndex: slideIndex,
      selectedLayer: null,
    };
  }),
  
  setCurrentSlideIndex: (index) => set((state) => {
    const slide = state.currentTemplate?.slides[index];
    return {
      currentSlideIndex: index,
      currentSlide: slide || null,
      selectedLayer: null,
    };
  }),
  
  nextSlide: () => set((state) => {
    if (!state.currentTemplate) return state;
    const nextIndex = Math.min(state.currentSlideIndex + 1, state.currentTemplate.slides.length - 1);
    return {
      currentSlideIndex: nextIndex,
      currentSlide: state.currentTemplate.slides[nextIndex],
      selectedLayer: null,
    };
  }),
  
  previousSlide: () => set((state) => {
    if (!state.currentTemplate) return state;
    const prevIndex = Math.max(state.currentSlideIndex - 1, 0);
    return {
      currentSlideIndex: prevIndex,
      currentSlide: state.currentTemplate.slides[prevIndex],
      selectedLayer: null,
    };
  }),

  reorderSlides: async (newOrder) => {
    const state = get();
    if (!state.currentTemplate) return;

    const currentSlideId = state.currentSlide?.id;
    const newIndex = newOrder.findIndex(s => s.id === currentSlideId);

    // Update local state first for immediate UI feedback
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, slides: newOrder }
          : template
      );

      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);

      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
        currentSlide: newOrder[newIndex] || newOrder[0],
        currentSlideIndex: newIndex >= 0 ? newIndex : 0,
      };
    });

    // Sync order_index to database
    try {
      const updates = newOrder.map((slide, index) => 
        supabase
          .from('slides')
          .update({ order_index: index })
          .eq('id', slide.id)
      );

      await Promise.all(updates);
      
      // Mark template as unpublished after reordering slides
      await markTemplateAsUnpublished(state.currentTemplate.id);
    } catch (error) {
      console.error('Error syncing slide order to database:', error);
    }
  },
  
  setSelectedLayer: (layerId) => set((state) => {
    const layer = state.currentSlide?.layers.find(l => l.id === layerId);
    return { selectedLayer: layer || null };
  }),
  
  updateLayer: async (layerId, updates) => {
    const state = get();
    if (!state.currentTemplate || !state.currentSlide) return;
    
    // Update local state first for immediate UI feedback
    set((state) => {
      const updatedTemplates = state.templates.map(template => {
        if (template.id !== state.currentTemplate?.id) return template;
        
        return {
          ...template,
          slides: template.slides.map(slide => {
            if (slide.id !== state.currentSlide?.id) return slide;
            
            return {
              ...slide,
              layers: slide.layers.map(layer => 
                layer.id === layerId ? { ...layer, ...updates } : layer
              ),
            };
          }),
        };
      });
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      const updatedSlide = updatedTemplate?.slides.find(s => s.id === state.currentSlide?.id);
      const updatedLayer = updatedSlide?.layers.find(l => l.id === layerId);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
        currentSlide: updatedSlide || null,
        selectedLayer: updatedLayer || null,
      };
    });

    // Sync to database
    try {
      const dbUpdates: any = {
        visible: updates.visible,
        locked: updates.locked,
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
        opacity: updates.opacity,
        rotation: updates.rotation,
      };

      // Add name update
      if (updates.name !== undefined) dbUpdates.name = updates.name;

      // Add z-index update
      if (updates.zIndex !== undefined) dbUpdates.z_index = updates.zIndex;

      // Add text-specific updates
      if (updates.text !== undefined) dbUpdates.text_content = updates.text;
      if (updates.fontFamily !== undefined) dbUpdates.font_family = updates.fontFamily;
      if (updates.fontSize !== undefined) dbUpdates.font_size = updates.fontSize;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.align !== undefined) dbUpdates.text_align = updates.align;
      if (updates.lineHeight !== undefined) dbUpdates.line_height = updates.lineHeight;
      if (updates.letterSpacing !== undefined) dbUpdates.letter_spacing = updates.letterSpacing;
      if (updates.textTransform !== undefined) dbUpdates.text_transform = updates.textTransform;
      if (updates.maxLength !== undefined) dbUpdates.max_length = updates.maxLength;

      // Add image-specific updates
      if (updates.src !== undefined) dbUpdates.image_src = updates.src;

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { error } = await supabase
        .from('layers')
        .update(dbUpdates)
        .eq('id', layerId);

      if (error) {
        console.error('Error updating layer in database:', error);
      } else {
        // Mark template as unpublished after updating layer
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error syncing layer update:', error);
    }
  },
  
  deleteLayer: async (layerId) => {
    const state = get();
    if (!state.currentTemplate || !state.currentSlide) return;
    
    // Update local state first
    set((state) => {
      if (!state.currentTemplate || !state.currentSlide) return state;
      
      const updatedTemplates = state.templates.map(template => {
        if (template.id !== state.currentTemplate?.id) return template;
        
        return {
          ...template,
          slides: template.slides.map(slide => {
            if (slide.id !== state.currentSlide?.id) return slide;
            
            return {
              ...slide,
              layers: slide.layers.filter(layer => layer.id !== layerId),
            };
          }),
        };
      });
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplates.find(t => t.id === state.currentTemplate?.id) || null,
        selectedLayer: null,
      };
    });

    // Delete from database
    try {
      const { error } = await supabase
        .from('layers')
        .delete()
        .eq('id', layerId);

      if (error) {
        console.error('Error deleting layer from database:', error);
      } else {
        // Mark template as unpublished after successful deletion
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error deleting layer:', error);
    }
  },
  
  reorderLayers: async (slideId, newOrder) => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state first for immediate UI feedback
    set((state) => {
      const updatedTemplates = state.templates.map(template => {
        if (template.id !== state.currentTemplate?.id) return template;
        
        return {
          ...template,
          slides: template.slides.map(slide => 
            slide.id === slideId ? { ...slide, layers: newOrder } : slide
          ),
        };
      });

      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      const updatedSlide = updatedTemplate?.slides.find(s => s.id === slideId);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
        currentSlide: updatedSlide || null,
      };
    });

    // Sync z-index changes to database
    try {
      const updatePromises = newOrder.map(layer => 
        supabase
          .from('layers')
          .update({ z_index: layer.zIndex })
          .eq('id', layer.id)
      );
      
      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Error updating layer z-indexes in database:', errors);
      } else {
        // Mark template as unpublished after reordering layers
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error syncing layer reorder:', error);
    }
  },
  
  updateTemplateName: async (name) => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state first
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, name }
          : template
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
      };
    });

    // Sync to database
    try {
      const { error } = await supabase
        .from('templates')
        .update({ name })
        .eq('id', state.currentTemplate.id);

      if (error) {
        console.error('Error updating template name in database:', error);
      } else {
        // Mark template as unpublished after updating name
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error syncing template name update:', error);
    }
  },

  updateTemplateBrand: async (brand) => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state first
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, brand }
          : template
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
      };
    });

    // Sync to database
    try {
      const { error } = await supabase
        .from('templates')
        .update({ brand })
        .eq('id', state.currentTemplate.id);

      if (error) {
        console.error('Error updating template brand in database:', error);
      } else {
        // Mark template as unpublished after updating brand
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error syncing template brand update:', error);
    }
  },

  updateTemplateCategory: async (category) => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state first
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, category }
          : template
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
      };
    });

    // Sync to database
    try {
      const { error } = await supabase
        .from('templates')
        .update({ category })
        .eq('id', state.currentTemplate.id);

      if (error) {
        console.error('Error updating template category in database:', error);
      } else {
        // Mark template as unpublished after updating category
        await markTemplateAsUnpublished(state.currentTemplate.id);
      }
    } catch (error) {
      console.error('Error syncing template category update:', error);
    }
  },
  
  saveTemplate: async () => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Sync slide order to database
    try {
      const updates = state.currentTemplate.slides.map((slide, index) => 
        supabase
          .from('slides')
          .update({ order_index: index })
          .eq('id', slide.id)
      );

      await Promise.all(updates);
      
      // Note: saveTemplate only saves changes, it does NOT publish
      // Use publishTemplate() to make visible to HR
      console.log('Template saved (including slide order)');
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  publishTemplate: async () => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, saved: true }
          : template
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
      };
    });

    // Publish to database
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_published: true })
        .eq('id', state.currentTemplate.id);

      if (error) {
        console.error('Error publishing template:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error publishing template:', error);
      throw error;
    }
  },

  unpublishTemplate: async () => {
    const state = get();
    if (!state.currentTemplate) return;
    
    // Update local state
    set((state) => {
      const updatedTemplates = state.templates.map(template =>
        template.id === state.currentTemplate?.id
          ? { ...template, saved: false }
          : template
      );
      
      const updatedTemplate = updatedTemplates.find(t => t.id === state.currentTemplate?.id);
      
      return {
        templates: updatedTemplates,
        currentTemplate: updatedTemplate || null,
      };
    });

    // Unpublish in database
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_published: false })
        .eq('id', state.currentTemplate.id);

      if (error) {
        console.error('Error unpublishing template:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error unpublishing template:', error);
      throw error;
    }
  },

  deleteTemplate: async (templateId: string) => {
    const state = get();
    
    try {
      // Delete from database (cascades to slides, layers, psd_uploads)
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('Error deleting template:', error);
        throw error;
      }

      // Update local state
      set((state) => {
        const updatedTemplates = state.templates.filter(t => t.id !== templateId);
        
        // If we deleted the current template, clear it
        const shouldClearCurrent = state.currentTemplate?.id === templateId;
        
        return {
          templates: updatedTemplates,
          currentTemplate: shouldClearCurrent ? null : state.currentTemplate,
          currentSlide: shouldClearCurrent ? null : state.currentSlide,
          currentSlideIndex: shouldClearCurrent ? 0 : state.currentSlideIndex,
          selectedLayer: shouldClearCurrent ? null : state.selectedLayer,
        };
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },
  
  clearCurrentTemplate: () => set({
    currentTemplate: null,
    currentSlide: null,
    currentSlideIndex: 0,
    selectedLayer: null,
  }),
  };
});
