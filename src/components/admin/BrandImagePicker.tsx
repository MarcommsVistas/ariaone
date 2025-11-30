import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrandImage {
  id: string;
  storage_path: string;
  file_name: string;
}

interface BrandImagePickerProps {
  brandName?: string;
  currentImageSrc?: string;
  onSelectImage: (imageUrl: string) => void;
}

export const BrandImagePicker = ({
  brandName,
  currentImageSrc,
  onSelectImage,
}: BrandImagePickerProps) => {
  const [images, setImages] = useState<BrandImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && brandName) {
      fetchBrandImages();
    }
  }, [open, brandName]);

  const fetchBrandImages = async () => {
    if (!brandName) return;

    setLoading(true);
    try {
      // First get the brand ID
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("id")
        .eq("name", brandName)
        .single();

      if (brandError) throw brandError;

      // Then get images for that brand
      const { data: imagesData, error: imagesError } = await supabase
        .from("brand_images")
        .select("id, storage_path, file_name")
        .eq("brand_id", brandData.id)
        .order("created_at", { ascending: false });

      if (imagesError) throw imagesError;

      setImages(imagesData || []);
    } catch (error) {
      console.error("Error fetching brand images:", error);
      toast({
        title: "Error",
        description: "Failed to load brand images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from("brand-images")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleSelectImage = (storagePath: string) => {
    const imageUrl = getImageUrl(storagePath);
    onSelectImage(imageUrl);
    setOpen(false);
    toast({
      title: "Success",
      description: "Brand image applied",
    });
  };

  if (!brandName) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ImageIcon className="h-4 w-4 mr-2" />
        No Brand Selected
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          Select from Brand Gallery
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Brand Image Gallery</h4>
          <p className="text-sm text-muted-foreground">
            Select an image from {brandName}'s gallery
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading images...
            </div>
          ) : images.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images available</p>
              <p className="text-xs mt-1">
                Upload images in the Brand Voice section
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-4">
              {images.map((image) => {
                const imageUrl = getImageUrl(image.storage_path);
                const isSelected = currentImageSrc === imageUrl;

                return (
                  <button
                    key={image.id}
                    onClick={() => handleSelectImage(image.storage_path)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
                      isSelected ? "border-primary ring-2 ring-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={image.file_name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-[10px] text-white truncate">
                      {image.file_name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
