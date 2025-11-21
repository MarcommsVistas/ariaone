import { useState } from "react";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const FontUploader = () => {
  const [uploadedFonts, setUploadedFonts] = useState<{ name: string; family: string }[]>([]);

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
          setUploadedFonts(prev => [...prev, { name: fontName, family: fontFamily }]);
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
                className="flex items-center gap-2 text-xs bg-primary-light px-3 py-2 rounded-md"
              >
                <Check className="w-3 h-3 text-primary" />
                <span style={{ fontFamily: font.family }}>{font.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
