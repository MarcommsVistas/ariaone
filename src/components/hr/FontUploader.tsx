import { useEffect } from "react";
import { Upload, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useFontStore } from "@/store/useFontStore";
import { toast } from "sonner";

export const FontUploader = () => {
  const { uploadedFonts, addFont, removeFont } = useFontStore();

  // Load all fonts on mount
  useEffect(() => {
    uploadedFonts.forEach((font) => {
      // Check if font is already loaded
      const fonts = Array.from(document.fonts);
      const isLoaded = fonts.some(f => f.family === font.family);
      
      if (!isLoaded && font.family) {
        // Font data is lost on page refresh, inform user to re-upload
        console.log(`Font "${font.name}" needs to be re-uploaded`);
      }
    });
  }, [uploadedFonts]);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
        toast.error("Please upload a valid font file (.ttf, .otf, .woff, .woff2)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fontData = event.target?.result;
        if (!fontData) return;

        // Extract font name from filename
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        const fontFamily = fontName.replace(/[^a-zA-Z0-9]/g, '');

        // Create a new font face
        const fontFace = new FontFace(fontFamily, `url(${fontData})`);
        
        fontFace.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
          addFont({ 
            name: fontName, 
            family: fontFamily,
            dataUrl: fontData as string 
          });
          toast.success(`Font "${fontName}" uploaded successfully`);
        }).catch(() => {
          toast.error(`Failed to load font "${fontName}"`);
        });
      };

      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  return (
    <Card className="p-4 bg-card border-border">
      <Label className="text-sm font-semibold mb-3 block">Custom Fonts</Label>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full relative"
          asChild
        >
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
        </Button>

        {uploadedFonts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Uploaded fonts:</p>
            {uploadedFonts.map((font, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 text-xs bg-secondary px-3 py-2 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate" style={{ fontFamily: font.family }}>{font.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => {
                    removeFont(font.family);
                    toast.success(`Font "${font.name}" removed`);
                  }}
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
