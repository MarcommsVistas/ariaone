import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { Layers } from "lucide-react";

export const HRDashboard = () => {
  const { 
    templates, 
    setCurrentTemplate, 
    fetchTemplates, 
    subscribeToChanges, 
    unsubscribeFromChanges,
    isLoading 
  } = useTemplateStore();
  
  // Fetch templates and subscribe to changes on mount
  useEffect(() => {
    fetchTemplates();
    subscribeToChanges();
    
    return () => {
      unsubscribeFromChanges();
    };
  }, []);
  
  // Only show saved templates
  const savedTemplates = templates.filter(t => t.saved);

  const handleOpenStudio = (templateId: string) => {
    setCurrentTemplate(templateId);
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        {isLoading && templates.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {savedTemplates.map((template) => {
              const firstSlide = template.slides[0];
              
              return (
                <Card 
                  key={template.id}
                  className="overflow-hidden border border-border bg-card"
                >
                  {/* Template Preview */}
                  <div className="bg-muted/30 flex items-center justify-center p-8">
                    <div 
                      className="relative bg-white shadow-lg"
                      style={{
                        width: '420px',
                        height: firstSlide ? `${(firstSlide.height / firstSlide.width) * 420}px` : '420px',
                      }}
                    >
                      {firstSlide && (
                        <div style={{ transform: `scale(${420 / firstSlide.width})`, transformOrigin: 'top left' }}>
                          <SlideRenderer
                            slide={firstSlide}
                            scale={420 / firstSlide.width}
                            interactive={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        {template.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {template.slides.length} {template.slides.length === 1 ? 'Slide' : 'Slides'}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => handleOpenStudio(template.id)}
                    >
                      Open Studio
                    </Button>
                  </div>
                </Card>
              );
            })}

            {savedTemplates.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No templates available yet
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Contact your admin to create templates
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
