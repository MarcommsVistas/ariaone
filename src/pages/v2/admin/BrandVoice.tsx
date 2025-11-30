import { useState, useEffect } from "react";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Save, X, ChevronDown } from "lucide-react";
import { BrandImageGallery } from "@/components/admin/BrandImageGallery";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Brand {
  id: string;
  name: string;
  tov_guidelines: string | null;
  tov_document_url: string | null;
  custom_prompt: string | null;
  ai_enabled: boolean | null;
  ai_instructions: any;
}

interface BrandImage {
  id: string;
  brand_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export default function BrandVoice() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brandImages, setBrandImages] = useState<Record<string, BrandImage[]>>({});
  const { toast } = useToast();

  const emptyBrand: Partial<Brand> = {
    name: "",
    tov_guidelines: "",
    tov_document_url: "",
    custom_prompt: "",
    ai_enabled: true,
    ai_instructions: {},
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");

      if (error) throw error;
      setBrands(data || []);
      
      // Fetch images for each brand
      if (data) {
        const imagesMap: Record<string, BrandImage[]> = {};
        for (const brand of data) {
          const { data: images } = await supabase
            .from("brand_images")
            .select("*")
            .eq("brand_id", brand.id)
            .order("created_at", { ascending: false });
          
          imagesMap[brand.id] = images || [];
        }
        setBrandImages(imagesMap);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandImages = async (brandId: string) => {
    const { data } = await supabase
      .from("brand_images")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    
    setBrandImages(prev => ({
      ...prev,
      [brandId]: data || []
    }));
  };

  const handleSave = async () => {
    if (!editingBrand) return;

    try {
      if (!editingBrand.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Brand name is required",
          variant: "destructive",
        });
        return;
      }

      if (editingBrand.id) {
        const { error } = await supabase
          .from("brands")
          .update({
            name: editingBrand.name,
            tov_guidelines: editingBrand.tov_guidelines,
            tov_document_url: editingBrand.tov_document_url,
            custom_prompt: editingBrand.custom_prompt,
            ai_enabled: editingBrand.ai_enabled,
            ai_instructions: editingBrand.ai_instructions,
          })
          .eq("id", editingBrand.id);

        if (error) throw error;
        toast({ title: "Success", description: "Brand updated successfully" });
      } else {
        const { error } = await supabase.from("brands").insert({
          name: editingBrand.name,
          tov_guidelines: editingBrand.tov_guidelines,
          tov_document_url: editingBrand.tov_document_url,
          custom_prompt: editingBrand.custom_prompt,
          ai_enabled: editingBrand.ai_enabled,
          ai_instructions: editingBrand.ai_instructions,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Brand created successfully" });
      }

      setEditingBrand(null);
      setIsCreating(false);
      fetchBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      toast({
        title: "Error",
        description: "Failed to save brand",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Brand deleted successfully" });
      fetchBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Brand Voice Manager</h1>
              <p className="text-muted-foreground">Manage brand tone of voice and AI instructions</p>
            </div>
            {!isCreating && !editingBrand && (
              <Button onClick={() => { setIsCreating(true); setEditingBrand(emptyBrand as Brand); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Brand
              </Button>
            )}
          </div>

          {(isCreating || editingBrand) && (
            <Card>
              <CardHeader>
                <CardTitle>{editingBrand?.id ? "Edit Brand" : "Create Brand"}</CardTitle>
                <CardDescription>Configure brand voice and AI settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={editingBrand?.name || ""}
                    onChange={(e) => setEditingBrand(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g., Tech Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tov">Tone of Voice Guidelines</Label>
                  <Textarea
                    id="tov"
                    value={editingBrand?.tov_guidelines || ""}
                    onChange={(e) => setEditingBrand(prev => prev ? { ...prev, tov_guidelines: e.target.value } : null)}
                    placeholder="Describe the brand's tone of voice..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc_url">TOV Document URL (optional)</Label>
                  <Input
                    id="doc_url"
                    value={editingBrand?.tov_document_url || ""}
                    onChange={(e) => setEditingBrand(prev => prev ? { ...prev, tov_document_url: e.target.value } : null)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_prompt">Custom AI Prompt (HIGHEST PRIORITY)</Label>
                  <Textarea
                    id="custom_prompt"
                    value={editingBrand?.custom_prompt || ""}
                    onChange={(e) => setEditingBrand(prev => prev ? { ...prev, custom_prompt: e.target.value } : null)}
                    placeholder="Add specific AI instructions like character limits, formatting rules, etc. This will be treated as the highest priority directive."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingBrand?.custom_prompt?.length || 0} characters
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ai_enabled"
                    checked={editingBrand?.ai_enabled || false}
                    onCheckedChange={(checked) => setEditingBrand(prev => prev ? { ...prev, ai_enabled: checked } : null)}
                  />
                  <Label htmlFor="ai_enabled">Enable AI Generation</Label>
                </div>

                {editingBrand?.id && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                      <ChevronDown className="h-4 w-4" />
                      Image Gallery
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <BrandImageGallery
                        brandId={editingBrand.id}
                        images={brandImages[editingBrand.id] || []}
                        onImagesChange={() => fetchBrandImages(editingBrand.id)}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Brand
                  </Button>
                  <Button variant="outline" onClick={() => { setEditingBrand(null); setIsCreating(false); }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {brands.map((brand) => (
              <Card key={brand.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{brand.name}</CardTitle>
                      <CardDescription>
                        {brand.ai_enabled ? "AI Enabled" : "AI Disabled"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBrand(brand)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {brand.tov_guidelines && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {brand.tov_guidelines}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {brands.length === 0 && !isCreating && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No brands created yet</p>
                <Button onClick={() => { setIsCreating(true); setEditingBrand(emptyBrand as Brand); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Brand
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
