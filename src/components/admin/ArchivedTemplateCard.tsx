import { Template } from "@/store/useTemplateStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { RotateCcw, Trash2, Calendar } from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { toast } from "sonner";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArchivedTemplateCardProps {
  template: Template;
}

export const ArchivedTemplateCard = ({ template }: ArchivedTemplateCardProps) => {
  const { restoreTemplate, permanentlyDeleteTemplate, archivedTemplates } = useTemplateStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const templateSlides = template.slides || [];
  const firstSlide = templateSlides[0];

  const slideCount = templateSlides.length;
  const layerCount = templateSlides.reduce((acc, slide) => 
    acc + slide.layers.length, 0
  );

  const handleRestore = async () => {
    try {
      await restoreTemplate(template.id);
      toast.success("Template restored successfully");
    } catch (error) {
      console.error("Failed to restore template:", error);
      toast.error("Failed to restore template");
    }
  };

  const handlePermanentDelete = async () => {
    if (confirmName !== template.name) {
      toast.error("Template name doesn't match");
      return;
    }

    try {
      await permanentlyDeleteTemplate(template.id);
      toast.success("Template permanently deleted");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  const deletedDate = template.deleted_at
    ? new Date(template.deleted_at).toLocaleDateString()
    : "Unknown";

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {firstSlide ? (
          <div className="w-full h-full flex items-center justify-center p-4 scale-[0.2] origin-top-left">
            <SlideRenderer slide={firstSlide} />
          </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No preview</p>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              Archived
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg truncate">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Deleted {deletedDate}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.category && (
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
            )}
            {template.brand && (
              <Badge variant="outline" className="text-xs">
                {template.brand}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {slideCount} slide{slideCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleRestore}
            >
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently Delete Template?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{slideCount} slide{slideCount !== 1 ? "s" : ""}</li>
                <li>{layerCount} layer{layerCount !== 1 ? "s" : ""}</li>
                <li>All version history</li>
                <li>All associated data</li>
              </ul>
              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-name">
                  Type <strong>{template.name}</strong> to confirm:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Template name"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmName("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={confirmName !== template.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
