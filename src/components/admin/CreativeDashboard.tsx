import { useRef, useEffect, useState } from "react";
import { Plus, Upload, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePsdParser } from "@/hooks/usePsdParser";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PRESET_CATEGORIES = [
  "Social Media",
  "Email",
  "Print",
  "Presentation",
  "Web",
  "Video"
];

export const CreativeDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parsePsdFile, parsePsdFiles, isLoading, progress, progressStatus } = usePsdParser();
  const { 
    addTemplate, 
    templates, 
    setCurrentTemplate, 
    fetchTemplates, 
    subscribeToChanges, 
    unsubscribeFromChanges,
    isLoading: isFetchingTemplates 
  } = useTemplateStore();
  const { userRole } = useAuthStore();
  const { toast } = useToast();
  
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(PRESET_CATEGORIES);
  
  const isMarcomms = userRole === 'marcomms';
  
  // Fetch templates and categories on mount
  useEffect(() => {
    fetchTemplates();
    subscribeToChanges();
    
    // Fetch categories from database
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (data) {
        setAvailableCategories(data.map(c => c.name));
      }
    };
    
    fetchCategories();
    
    return () => {
      unsubscribeFromChanges();
    };
  }, []);
  
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

    // Show metadata dialog
    setPendingFiles(files);
    setShowMetadataDialog(true);
  };

  const handleMetadataSubmit = async () => {
    if (!pendingFiles) return;

    setShowMetadataDialog(false);
    const brand = brandName.trim() || undefined;
    const category = categoryName || undefined;

    // Parse files
    let template;
    if (pendingFiles.length === 1) {
      template = await parsePsdFile(pendingFiles[0], brand, category);
    } else {
      template = await parsePsdFiles(Array.from(pendingFiles), brand, category);
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

    // Reset
    setBrandName("");
    setCategoryName("");
    setPendingFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        {/* Metadata Dialog */}
        <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Template Details</DialogTitle>
              <DialogDescription>
                Add metadata to help organize and filter this template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryName} onValueChange={setCategoryName}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand Name (Optional)</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Nike, Adidas, Apple"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleMetadataSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMetadataDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMetadataSubmit}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Creative Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage smart templates and generate assets.
          </p>
        </div>

        {/* Loading State */}
        {isFetchingTemplates && templates.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          </div>
        ) : (
          /* Templates Grid */
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
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {template.category && (
                        <span className="text-xs text-primary font-medium">{template.category}</span>
                      )}
                      {template.category && template.brand && (
                        <span className="text-xs text-muted-foreground">•</span>
                      )}
                      {template.brand && (
                        <span className="text-xs text-muted-foreground">{template.brand}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.slides.length} {template.slides.length === 1 ? 'slide' : 'slides'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Import PSD Card - Only visible to Marcomms */}
            {isMarcomms && (
              <Card 
                className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group relative"
                onClick={!isLoading ? handleImportPSD : undefined}
              >
                <div className="aspect-square flex flex-col items-center justify-center p-8">
                  {isLoading ? (
                    <div className="w-full space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                        <Upload className="h-8 w-8 text-primary animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="text-center space-y-1">
                          <p className="text-primary font-medium text-sm">
                            {progress}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {progressStatus}
                          </p>
                        </div>
                      </div>
                    </div>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
