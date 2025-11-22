import { useGlobalFonts } from "@/hooks/useGlobalFonts";
import { useFontMigration } from "@/hooks/useFontMigration";
import { FontErrorBoundary } from "./FontErrorBoundary";
import { Loader2 } from "lucide-react";

export const FontManager = () => {
  useGlobalFonts();
  const { isMigrating } = useFontMigration();

  if (isMigrating) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <div>
            <h3 className="font-semibold text-sm mb-1">Migrating Fonts</h3>
            <p className="text-xs text-muted-foreground">
              Moving your custom fonts to cloud storage...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FontErrorBoundary>
      <div style={{ display: 'none' }} />
    </FontErrorBoundary>
  );
};
