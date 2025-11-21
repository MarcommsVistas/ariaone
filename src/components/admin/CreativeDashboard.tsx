import { useRef } from "react";
import { Plus, Upload, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePsdParser } from "@/hooks/usePsdParser";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useToast } from "@/hooks/use-toast";

export const CreativeDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parsePsdFile, parsePsdFiles, isLoading } = usePsdParser();
  const { addTemplate, templates, setCurrentTemplate } = useTemplateStore();
  const { toast } = useToast();
  
  // Only show saved templates
  const savedTemplates = templates.filter(t => t.saved);

  const handleImportPSD = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check file limit
    if (files.length > 7) {
      toast({
        title: "Too many files",
        description: "Please upload a maximum of 7 PSD files",
        variant: "destructive",
      });
      return;
    }

    // Validate all files are PSDs
    const allPsds = Array.from(files).every(file => 
      file.name.toLowerCase().endsWith('.psd')
    );

    if (!allPsds) {
      toast({
        title: "Invalid file type",
        description: "Please upload only .psd files",
        variant: "destructive",
      });
      return;
    }

    // Parse files
    let template;
    if (files.length === 1) {
      template = await parsePsdFile(files[0]);
    } else {
      template = await parsePsdFiles(Array.from(files));
    }
    
    if (template) {
      addTemplate(template);
      toast({
        title: "Template imported",
        description: `${template.name} with ${template.slides.length} slide${template.slides.length > 1 ? 's' : ''} has been successfully imported`,
      });
    } else {
      toast({
        title: "Import failed",
        description: "Failed to parse PSD files. Please try again.",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNewTemplate = () => {
    // TODO: Implement new template creation
    console.log("New Template clicked");
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-8 py-12">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Creative Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage smart templates and generate assets.
            </p>
          </div>
          <Button 
            onClick={handleNewTemplate}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Saved Template Cards */}
          {savedTemplates.map((template) => (
            <Card
              key={template.id}
              className="border border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => setCurrentTemplate(template.id)}
            >
              <div className="aspect-square flex items-center justify-center p-8 bg-muted/30">
                <div className="text-center">
                  <Layers className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">{template.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.slides.length} {template.slides.length === 1 ? 'slide' : 'slides'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Import PSD Card */}
          <Card 
            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group relative"
            onClick={handleImportPSD}
          >
            <div className="aspect-square flex flex-col items-center justify-center p-8">
              {isLoading ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                    <Upload className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                  <p className="text-primary font-medium">
                    Parsing PSD...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-muted/80 transition-colors flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Import PSD / New
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
