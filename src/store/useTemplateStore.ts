import { create } from 'zustand';

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
  slides: Slide[];
  saved?: boolean; // Whether template is published for HR use
}

interface TemplateStore {
  templates: Template[];
  currentTemplate: Template | null;
  currentSlide: Slide | null;
  currentSlideIndex: number;
  selectedLayer: Layer | null;
  mode: 'admin' | 'hr';
  
  setMode: (mode: 'admin' | 'hr') => void;
  addTemplate: (template: Template) => void;
  setCurrentTemplate: (templateId: string) => void;
  setCurrentSlide: (slideId: string) => void;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  reorderSlides: (newOrder: Slide[]) => void;
  setSelectedLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayers: (slideId: string, newOrder: Layer[]) => void;
  updateTemplateName: (name: string) => void;
  saveTemplate: () => void;
  clearCurrentTemplate: () => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  currentTemplate: null,
  currentSlide: null,
  currentSlideIndex: 0,
  selectedLayer: null,
  mode: 'admin',
  
  setMode: (mode) => set({ mode }),
  
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, template],
    currentTemplate: template,
    currentSlide: template.slides[0] || null,
    currentSlideIndex: 0,
  })),
  
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

  reorderSlides: (newOrder) => set((state) => {
    if (!state.currentTemplate) return state;

    const currentSlideId = state.currentSlide?.id;
    const newIndex = newOrder.findIndex(s => s.id === currentSlideId);

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
  }),
  
  setSelectedLayer: (layerId) => set((state) => {
    const layer = state.currentSlide?.layers.find(l => l.id === layerId);
    return { selectedLayer: layer || null };
  }),
  
  updateLayer: (layerId, updates) => set((state) => {
    if (!state.currentTemplate || !state.currentSlide) return state;
    
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
  }),
  
  deleteLayer: (layerId) => set((state) => {
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
  }),
  
  reorderLayers: (slideId, newOrder) => set((state) => {
    if (!state.currentTemplate) return state;
    
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
  }),
  
  updateTemplateName: (name) => set((state) => {
    if (!state.currentTemplate) return state;
    
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
  }),
  
  saveTemplate: () => set((state) => {
    if (!state.currentTemplate) return state;
    
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
  }),
  
  clearCurrentTemplate: () => set({
    currentTemplate: null,
    currentSlide: null,
    currentSlideIndex: 0,
    selectedLayer: null,
  }),
}));
