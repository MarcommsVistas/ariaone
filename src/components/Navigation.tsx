import { Layers, Users } from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const { mode, setMode } = useTemplateStore();

  return (
    <nav className="h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-6">
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
    </nav>
  );
};
