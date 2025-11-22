import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { Pencil, Trash2, Calendar, Layers } from "lucide-react";
import { TemplateInstance, Template } from "@/store/useTemplateStore";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyProjectsCardProps {
  instance: TemplateInstance;
  originalTemplate?: Template;
  onOpenStudio: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
}

export const MyProjectsCard = ({ 
  instance, 
  originalTemplate,
  onOpenStudio, 
  onDelete 
}: MyProjectsCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const firstSlide = instance.slides[0];

  const handleDelete = () => {
    onDelete(instance.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <CardContent className="p-0">
          {/* Preview */}
          <div className="relative aspect-[16/10] bg-canvas overflow-hidden border-b border-border">
            {firstSlide ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div 
                  style={{ 
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SlideRenderer 
                    slide={firstSlide}
                    scale={0.2}
                    interactive={false}
                  />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                {instance.name}
              </h3>
              {originalTemplate && (
                <p className="text-xs text-muted-foreground">
                  From: {originalTemplate.name}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              {instance.category && (
                <Badge variant="secondary" className="text-xs">
                  {instance.category}
                </Badge>
              )}
              {instance.brand && (
                <Badge variant="outline" className="text-xs">
                  {instance.brand}
                </Badge>
              )}
              {instance.slides.length > 1 && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Layers className="w-3 h-3" />
                  {instance.slides.length} slides
                </Badge>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                Edited {formatDistanceToNow(new Date(instance.updated_at || instance.created_at || Date.now()), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button 
            onClick={() => onOpenStudio(instance.id)} 
            className="flex-1 gap-2"
            size="sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            Open Studio
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{instance.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
