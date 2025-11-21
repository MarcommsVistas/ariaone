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
}

interface TemplateStore {
  templates: Template[];
  currentTemplate: Template | null;
  currentSlide: Slide | null;
  selectedLayer: Layer | null;
  mode: 'admin' | 'hr';
  
  setMode: (mode: 'admin' | 'hr') => void;
  addTemplate: (template: Template) => void;
  setCurrentTemplate: (templateId: string) => void;
  setCurrentSlide: (slideId: string) => void;
  setSelectedLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayers: (slideId: string, newOrder: Layer[]) => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  currentTemplate: null,
  currentSlide: null,
  selectedLayer: null,
  mode: 'admin',
  
  setMode: (mode) => set({ mode }),
  
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, template],
    currentTemplate: template,
    currentSlide: template.slides[0] || null,
  })),
  
  setCurrentTemplate: (templateId) => set((state) => {
    const template = state.templates.find(t => t.id === templateId);
    return {
      currentTemplate: template || null,
      currentSlide: template?.slides[0] || null,
      selectedLayer: null,
    };
  }),
  
  setCurrentSlide: (slideId) => set((state) => {
    const slide = state.currentTemplate?.slides.find(s => s.id === slideId);
    return {
      currentSlide: slide || null,
      selectedLayer: null,
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
    
    return {
      templates: updatedTemplates,
      currentTemplate: updatedTemplates.find(t => t.id === state.currentTemplate?.id) || null,
    };
  }),
}));
