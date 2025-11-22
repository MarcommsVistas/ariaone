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

  // Font loading is now handled globally by FontManager component

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

        // Parse weight from filename
        let weight = 400;
        const lowerName = fontName.toLowerCase();
        if (lowerName.includes('bold')) weight = 700;
        else if (lowerName.includes('light')) weight = 300;
        else if (lowerName.includes('medium')) weight = 500;
        else if (lowerName.includes('semibold')) weight = 600;
        else if (lowerName.includes('black')) weight = 900;

        // Parse style from filename
        const style = lowerName.includes('italic') ? 'italic' : 'normal';

        // Create a new font face
        const fontFace = new FontFace(
          fontFamily, 
          `url(${fontData})`,
          { weight: weight.toString(), style }
        );
        
        fontFace.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
          addFont({ 
            name: fontName, 
            family: fontFamily,
            dataUrl: fontData as string,
            weight,
            style
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
