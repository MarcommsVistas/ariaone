import { useState } from "react";
import { Edit, Trash2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Template, useTemplateStore } from "@/store/useTemplateStore";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { classifyTemplate } from "@/lib/templateClassification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface MarcommsTemplateCardProps {
  template: Template;
  onEditTemplate: (templateId: string) => void;
  viewMode?: "grid" | "list";
}

export const MarcommsTemplateCard = ({ template, onEditTemplate, viewMode = "grid" }: MarcommsTemplateCardProps) => {
  const firstSlide = template.slides[0];
  const isPublished = template.saved;
  const { deleteTemplate } = useTemplateStore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Get template classification
  const classification = classifyTemplate(template.slides.length);
  
  const getTypeColor = () => {
    switch (classification.type) {
      case '1-frame':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case '3-frame':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case '5-7-frame':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate(template.id);
      toast({
        title: "Template deleted",
        description: `${template.name} has been permanently deleted`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Grid view
  if (viewMode === "grid") {
    return (
      <Card className="border border-border hover:border-primary/50 transition-colors overflow-hidden group">
        {/* Thumbnail Preview */}
        <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center overflow-hidden">
          {firstSlide ? (
            <div className="w-full h-full flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${Math.min(
                    250 / firstSlide.width,
                    250 / firstSlide.height
                  )})`,
                  transformOrigin: 'center',
                }}
              >
                <SlideRenderer slide={firstSlide} />
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No preview</div>
          )}
        </div>

        {/* Template Info */}
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2 min-h-[60px]">
              <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{template.name}</h3>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Badge 
                  variant="outline"
                  className={`${getTypeColor()} text-xs whitespace-nowrap`}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {classification.type}
                </Badge>
                <Badge 
                  variant={isPublished ? "default" : "secondary"}
                  className={`${isPublished ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"} text-xs whitespace-nowrap`}
                >
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {template.category && (
                <span className="text-primary font-medium">{template.category}</span>
              )}
              {template.category && template.brand && (
                <span>•</span>
              )}
              {template.brand && (
                <span>{template.brand}</span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {template.slides.length} {template.slides.length === 1 ? 'slide' : 'slides'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onEditTemplate(template.id)}
              className="flex-1"
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{template.name}"? This will permanently delete the template and all its slides and layers. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card className="border border-border hover:border-primary/50 transition-colors overflow-hidden group">
      <div className="flex gap-4 p-4">
        {/* Thumbnail Preview */}
        <div className="w-32 h-32 bg-muted/30 p-2 flex items-center justify-center overflow-hidden rounded-lg shrink-0">
          {firstSlide ? (
            <div
              style={{
                transform: `scale(${Math.min(
                  120 / firstSlide.width,
                  120 / firstSlide.height
                )})`,
                transformOrigin: 'center',
              }}
            >
              <SlideRenderer slide={firstSlide} />
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">No preview</div>
          )}
        </div>

        {/* Template Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate mb-1">{template.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {template.category && (
                    <span className="text-primary font-medium">{template.category}</span>
                  )}
                  {template.category && template.brand && (
                    <span>•</span>
                  )}
                  {template.brand && (
                    <span>{template.brand}</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1.5 shrink-0">
                <Badge 
                  variant="outline"
                  className={`${getTypeColor()} text-xs whitespace-nowrap`}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {classification.type}
                </Badge>
                <Badge 
                  variant={isPublished ? "default" : "secondary"}
                  className={`${isPublished ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"} text-xs whitespace-nowrap`}
                >
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {template.slides.length} {template.slides.length === 1 ? 'slide' : 'slides'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onEditTemplate(template.id)}
              variant="outline"
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{template.name}"? This will permanently delete the template and all its slides and layers. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Card>
  );
};
