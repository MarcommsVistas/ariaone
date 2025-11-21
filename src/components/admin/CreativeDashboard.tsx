import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const CreativeDashboard = () => {
  const handleImportPSD = () => {
    // TODO: Implement PSD import functionality
    console.log("Import PSD clicked");
  };

  const handleNewTemplate = () => {
    // TODO: Implement new template creation
    console.log("New Template clicked");
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Creative Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage smart templates and generate assets.
            </p>
          </div>
          <Button 
            onClick={handleNewTemplate}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Import PSD Card */}
          <Card 
            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={handleImportPSD}
          >
            <div className="aspect-square flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-muted/80 transition-colors flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Import PSD / New
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
