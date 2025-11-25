import { useRef, useEffect, useState } from "react";
import { Plus, Upload, Layers, Search, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePsdParser } from "@/hooks/usePsdParser";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MarcommsTemplateCard } from "./MarcommsTemplateCard";

const PRESET_CATEGORIES = [
  "Social Media",
  "Email",
  "Print",
  "Presentation",
  "Web",
  "Video"
];

interface CreativeDashboardProps {
  onEditTemplate?: (templateId: string) => void;
}

export const CreativeDashboard = ({ onEditTemplate }: CreativeDashboardProps = {}) => {
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const isMarcomms = userRole === 'marcomms';
  
  // Fetch templates and categories on mount
  useEffect(() => {
    fetchTemplates();
    subscribeToChanges();
    
    // Fetch categories and brands from database
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (data) {
        setAvailableCategories(data.map(c => c.name));
      }
    };
    
    const fetchBrands = async () => {
      const { data } = await supabase
        .from('brands')
        .select('name')
        .order('name');
      
      if (data) {
        setAvailableBrands(data.map(b => b.name));
      }
    };
    
    fetchCategories();
    fetchBrands();
    
    return () => {
      unsubscribeFromChanges();
    };
  }, []);
  
  // Filter and sort templates
  const displayTemplates = templates
    .filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesBrand = template.brand?.toLowerCase().includes(query);
        const matchesCategory = template.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }
      
      // Category filter
      if (selectedCategory !== "all" && template.category !== selectedCategory) {
        return false;
      }
      
      // Brand filter
      if (selectedBrand !== "all" && template.brand !== selectedBrand) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return 0;
    });

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
    const category = (categoryName && categoryName !== "none") ? categoryName : undefined;

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
                <Select value={categoryName || "none"} onValueChange={setCategoryName}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Creative Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage smart templates and generate assets.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3x3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {availableBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          /* Templates Layout */
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {/* Template Cards */}
            {displayTemplates.map((template) => (
              <MarcommsTemplateCard
                key={template.id}
                template={template}
                onEditTemplate={onEditTemplate || setCurrentTemplate}
                viewMode={viewMode}
              />
            ))}
            
            {/* Import PSD Card - Only visible to Marcomms in grid view */}
            {isMarcomms && viewMode === "grid" && (
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
