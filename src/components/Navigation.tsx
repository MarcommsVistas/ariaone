import { NavLink } from "@/components/NavLink";
import { Layers, Users, FileUp } from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { usePsdParser } from "@/hooks/usePsdParser";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { toast } from "sonner";

export const Navigation = () => {
  const { mode, setMode, addTemplate } = useTemplateStore();
  const { parsePsdFile, isLoading } = usePsdParser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.psd')) {
      toast.error('Please upload a .psd file');
      return;
    }

    toast.loading('Parsing PSD file...');
    const template = await parsePsdFile(file);
    toast.dismiss();

    if (template) {
      addTemplate(template);
      toast.success(`Loaded ${template.name} with ${template.slides[0].layers.length} layers`);
      setMode('admin');
    } else {
      toast.error('Failed to parse PSD file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <nav className="h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-sidebar-foreground font-semibold text-lg">Aria-One</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'admin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('admin')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Admin Studio
          </Button>
          <Button
            variant={mode === 'hr' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('hr')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            HR Interface
          </Button>
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd"
          onChange={handleFileUpload}
          className="hidden"
          id="psd-upload"
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <FileUp className="w-4 h-4" />
          {isLoading ? 'Parsing...' : 'Upload PSD'}
        </Button>
      </div>
    </nav>
  );
};
