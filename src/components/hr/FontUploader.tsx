import { useState } from "react";
import { Upload, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFontStore } from "@/store/useFontStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const FontUploader = () => {
  const { uploadedFonts, addFont, removeFont } = useFontStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to upload fonts");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
          toast.error(`Invalid file type: ${file.name}`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large: ${file.name} (max 5MB)`);
          continue;
        }

        // Parse font metadata from filename
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        const fontFamily = fontName.replace(/[^a-zA-Z0-9]/g, '');

        // Parse weight
        let weight = 400;
        const lowerName = fontName.toLowerCase();
        if (lowerName.includes('bold')) weight = 700;
        else if (lowerName.includes('light')) weight = 300;
        else if (lowerName.includes('medium')) weight = 500;
        else if (lowerName.includes('semibold')) weight = 600;
        else if (lowerName.includes('black')) weight = 900;

        // Parse style
        const style = lowerName.includes('italic') ? 'italic' : 'normal';

        // Upload to Supabase Storage
        const storagePath = `${user.id}/${fontFamily}_${Date.now()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('custom-fonts')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          toast.error(`Failed to upload ${fontName}: ${uploadError.message}`);
          continue;
        }

        // Save metadata to database
        const { data: fontData, error: dbError } = await supabase
          .from('custom_fonts')
          .insert({
            user_id: user.id,
            name: fontName,
            family: fontFamily,
            weight,
            style,
            file_name: file.name,
            storage_path: storagePath,
            file_size: file.size
          })
          .select()
          .single();

        if (dbError) {
          // Cleanup storage if DB insert fails
          await supabase.storage.from('custom-fonts').remove([storagePath]);
          toast.error(`Failed to save font metadata: ${dbError.message}`);
          continue;
        }

        if (!fontData) continue;

        // Cast style property for type safety
        const typedFontData = {
          ...fontData,
          style: (fontData.style === 'italic' ? 'italic' : 'normal') as 'italic' | 'normal'
        };

        // Add to local state
        addFont(typedFontData);
        toast.success(`Font "${fontName}" uploaded successfully`);
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemoveFont = async (fontId: string, fontName: string) => {
    try {
      await removeFont(fontId);
      toast.success(`Font "${fontName}" removed`);
    } catch (error) {
      toast.error(`Failed to remove font "${fontName}"`);
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <Label className="text-sm font-semibold mb-3 block">Custom Fonts</Label>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full relative"
          disabled={uploading}
          asChild={!uploading}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Font File
              <Input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                onChange={handleFontUpload}
                className="hidden"
              />
            </label>
          )}
        </Button>

        {uploading && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="h-2" />
        )}

        {uploadedFonts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Uploaded fonts:</p>
            {uploadedFonts.map((font) => (
              <div
                key={font.id}
                className="flex items-center justify-between gap-2 text-xs bg-secondary px-3 py-2 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate" style={{ fontFamily: font.family }}>
                    {font.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => handleRemoveFont(font.id, font.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
