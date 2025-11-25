import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  onRename: (instanceId: string, newName: string) => void;
  viewMode?: "grid" | "list";
}

export const MyProjectsCard = ({ 
  instance, 
  originalTemplate,
  onOpenStudio, 
  onDelete,
  onRename,
  viewMode = "grid"
}: MyProjectsCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(instance.name);
  const firstSlide = instance.slides[0];
  const maxThumbnailSizeGrid = 280;
  const maxThumbnailSizeList = 120;
  const scaleGrid = firstSlide ? maxThumbnailSizeGrid / Math.max(firstSlide.width, firstSlide.height) : 1;
  const scaleList = firstSlide ? maxThumbnailSizeList / Math.max(firstSlide.width, firstSlide.height) : 1;

  const handleDelete = () => {
    onDelete(instance.id);
    setShowDeleteDialog(false);
  };

  // List view rendering
  if (viewMode === "list") {
    return (
      <>
        <Card className="overflow-hidden hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 p-4">
            {/* Thumbnail */}
            <div className="w-32 h-24 bg-muted/30 p-2 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0">
              {firstSlide ? (
                <div 
                  className="relative bg-white shadow-sm rounded-sm overflow-hidden" 
                  style={{
                    width: '100%',
                    maxWidth: `${maxThumbnailSizeList}px`,
                    aspectRatio: `${firstSlide.width} / ${firstSlide.height}`
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      transform: `scale(${scaleList})`,
                      transformOrigin: 'top left',
                      width: firstSlide.width,
                      height: firstSlide.height
                    }}
                  >
                    <SlideRenderer
                      slide={firstSlide}
                      interactive={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(instance.id, editedName);
                      setIsEditing(false);
                    } else if (e.key === 'Escape') {
                      setEditedName(instance.name);
                      setIsEditing(false);
                    }
                  }}
                  onBlur={() => {
                    if (editedName !== instance.name && editedName.trim()) {
                      onRename(instance.id, editedName);
                    } else {
                      setEditedName(instance.name);
                    }
                    setIsEditing(false);
                  }}
                  className="h-8 font-semibold"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h3 className="font-semibold text-foreground truncate flex-1">
                    {instance.name}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                    aria-label="Rename project"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {originalTemplate && (
                  <span>From: {originalTemplate.name}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Edited {formatDistanceToNow(new Date(instance.updated_at || instance.created_at || Date.now()), { addSuffix: true })}
                </span>
              </div>

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
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                onClick={() => onOpenStudio(instance.id)} 
                className="gap-2"
                size="sm"
              >
                <Pencil className="w-3.5 h-3.5" />
                Open
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
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
  }

  // Grid view rendering
  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <CardContent className="p-0">
          {/* Preview */}
          <div className="aspect-[4/3] bg-muted/30 overflow-hidden border-b border-border">
            {firstSlide ? (
              <div className="h-full flex items-center justify-center p-4">
                <div
                  className="relative bg-white shadow-md rounded-sm overflow-hidden"
                  style={{
                    width: '100%',
                    maxWidth: `${maxThumbnailSizeGrid}px`,
                    aspectRatio: `${firstSlide.width} / ${firstSlide.height}`
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `scale(${scaleGrid})`,
                      transformOrigin: "top left",
                      width: firstSlide.width,
                      height: firstSlide.height,
                    }}
                  >
                    <SlideRenderer
                      slide={firstSlide}
                      interactive={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Layers className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(instance.id, editedName);
                      setIsEditing(false);
                    } else if (e.key === 'Escape') {
                      setEditedName(instance.name);
                      setIsEditing(false);
                    }
                  }}
                  onBlur={() => {
                    if (editedName !== instance.name && editedName.trim()) {
                      onRename(instance.id, editedName);
                    } else {
                      setEditedName(instance.name);
                    }
                    setIsEditing(false);
                  }}
                  className="h-8 font-semibold mb-1"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 group/name mb-1">
                  <h3 className="font-semibold text-foreground line-clamp-1 flex-1">
                    {instance.name}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                    aria-label="Rename project"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
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
