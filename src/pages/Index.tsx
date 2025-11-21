import { useEffect } from "react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { Navigation } from "@/components/Navigation";
import { AdminStudio } from "@/components/admin/AdminStudio";
import { HRInterface } from "@/components/hr/HRInterface";

const Index = () => {
  const { mode, addTemplate, templates } = useTemplateStore();

  // Demo template for testing
  useEffect(() => {
    if (templates.length === 0) {
      addTemplate({
        id: 'demo-1',
        name: 'Demo Template',
        slides: [
          {
            id: 'slide-1',
            name: 'Hiring Poster',
            width: 1080,
            height: 1080,
            layers: [
              {
                id: 'bg-1',
                type: 'shape',
                name: 'Background',
                visible: true,
                locked: false,
                zIndex: 0,
                x: 0,
                y: 0,
                width: 1080,
                height: 1080,
                opacity: 1,
                rotation: 0,
                color: '#0891b2',
              },
              {
                id: 'text-1',
                type: 'text',
                name: 'Main Headline',
                visible: true,
                locked: false,
                zIndex: 1,
                x: 60,
                y: 400,
                width: 960,
                height: 160,
                opacity: 1,
                rotation: 0,
                text: 'NOW HIRING',
                fontFamily: 'DM Sans',
                fontSize: 96,
                color: '#ffffff',
                align: 'center',
                lineHeight: 1.1,
                letterSpacing: -2,
                textTransform: 'uppercase',
                maxLength: 50,
              },
              {
                id: 'text-2',
                type: 'text',
                name: 'Subtitle',
                visible: true,
                locked: false,
                zIndex: 2,
                x: 60,
                y: 580,
                width: 960,
                height: 80,
                opacity: 1,
                rotation: 0,
                text: 'Join our amazing team',
                fontFamily: 'DM Sans',
                fontSize: 32,
                color: '#e0f2fe',
                align: 'center',
                lineHeight: 1.3,
                letterSpacing: 0,
                textTransform: 'none',
                maxLength: 100,
              },
            ],
          },
        ],
      });
    }
  }, [addTemplate, templates.length]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      {mode === 'admin' ? <AdminStudio /> : <HRInterface />}
    </div>
  );
};

export default Index;
