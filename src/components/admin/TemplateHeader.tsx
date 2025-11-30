import { useState, useEffect } from "react";
import { Layers, Save, Tag, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTemplateStore } from "@/store/useTemplateStore";
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

interface TemplateHeaderProps {
  enableAI?: boolean;
}

export const TemplateHeader = ({ enableAI = false }: TemplateHeaderProps) => {
  const { currentTemplate, updateTemplateName, updateTemplateBrand, updateTemplateCategory, saveTemplate, publishTemplate, unpublishTemplate } = useTemplateStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [tempName, setTempName] = useState(currentTemplate?.name || "Untitled Template");
  const [tempBrand, setTempBrand] = useState(currentTemplate?.brand || "");
  const [tempCategory, setTempCategory] = useState(currentTemplate?.category || "");
  const [availableCategories, setAvailableCategories] = useState<string[]>(PRESET_CATEGORIES);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const { toast } = useToast();

  // Fetch categories and brands from database
  useEffect(() => {
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
  }, []);

  if (!currentTemplate) return null;

  const handleNameClick = () => {
    setIsEditingName(true);
    setTempName(currentTemplate.name);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      updateTemplateName(tempName.trim());
    } else {
      setTempName(currentTemplate.name);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setTempName(currentTemplate.name);
    }
  };

  const handleBrandSave = () => {
    const brandToSave = (tempBrand && tempBrand !== "none") ? tempBrand : "";
    updateTemplateBrand(brandToSave);
    setIsEditingBrand(false);
  };

  const handleCategorySave = () => {
    const categoryToSave = (tempCategory && tempCategory !== "none") ? tempCategory : "";
    updateTemplateCategory(categoryToSave);
    setIsEditingCategory(false);
  };

  const handleSave = async () => {
    try {
      await saveTemplate();
      setHasBeenSaved(true);
      toast({
        title: "Template saved",
        description: "All changes have been saved",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    try {
      await publishTemplate();
      toast({
        title: "Template published",
        description: `${currentTemplate.name} is now visible to HR`,
      });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: "Failed to publish template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishTemplate();
      setHasBeenSaved(false);
      toast({
        title: "Template unpublished",
        description: `${currentTemplate.name} is now hidden from HR`,
      });
    } catch (error) {
      toast({
        title: "Unpublish failed",
        description: "Failed to unpublish template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-primary" />
        {isEditingName ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="h-8 w-64 text-lg font-semibold"
            autoFocus
          />
        ) : (
          <h2
            className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={handleNameClick}
          >
            {currentTemplate.name}
          </h2>
        )}
        
        {/* Category Badge with Edit */}
        <Popover open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              {currentTemplate.category ? (
                <Badge variant="default" className="cursor-pointer hover:bg-primary/80">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {currentTemplate.category}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  Add category
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={tempCategory || "none"} onValueChange={setTempCategory}>
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingCategory(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCategorySave}>
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Brand Badge with Edit */}
        <Popover open={isEditingBrand} onOpenChange={setIsEditingBrand}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              {currentTemplate.brand ? (
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  <Tag className="h-3 w-3 mr-1" />
                  {currentTemplate.brand}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Add brand
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select value={tempBrand || "none"} onValueChange={setTempBrand}>
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBrand(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleBrandSave}>
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-3">
        {!hasBeenSaved && (
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        )}
        
        {hasBeenSaved && (
          currentTemplate.saved ? (
            <Button
              onClick={handleUnpublish}
              className="bg-gray-700 hover:bg-gray-800 text-white"
            >
              Unpublish
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Publish to HR
            </Button>
          )
        )}
      </div>
    </div>
  );
};
