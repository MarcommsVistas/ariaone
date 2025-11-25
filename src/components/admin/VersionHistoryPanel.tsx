import { useTemplateStore } from "@/store/useTemplateStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Clock, User } from "lucide-react";
import { toast } from "sonner";
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

interface TemplateVersion {
  id: string;
  version_number: number;
  version_label: string | null;
  created_at: string;
  change_type: string;
  change_description: string | null;
  slide_count: number;
  layer_count: number;
  template_data: any;
}

export const VersionHistoryPanel = () => {
  const { currentTemplate, fetchVersionHistory, restoreVersion } = useTemplateStore();
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    if (currentTemplate?.id) {
      loadVersionHistory();
    }
  }, [currentTemplate?.id]);

  const loadVersionHistory = async () => {
    if (!currentTemplate?.id) return;
    
    setLoading(true);
    try {
      const history = await fetchVersionHistory(currentTemplate.id);
      setVersions(history);
    } catch (error) {
      console.error("Failed to load version history:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion || !currentTemplate?.id) return;

    try {
      await restoreVersion(currentTemplate.id, selectedVersion.id);
      toast.success(`Restored to version ${selectedVersion.version_number}`);
      setShowRestoreDialog(false);
      setSelectedVersion(null);
      loadVersionHistory();
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version");
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'publish':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'manual_save':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'metadata_change':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'layer_update':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatChangeType = (changeType: string) => {
    return changeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!currentTemplate) {
    return null;
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-5 w-5" />
            <h3 className="font-semibold">Version History</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No version history yet
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          v{version.version_number}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getChangeTypeColor(version.change_type)}`}
                        >
                          {formatChangeType(version.change_type)}
                        </Badge>
                      </div>
                      {version.version_label && (
                        <p className="text-sm font-medium truncate">
                          {version.version_label}
                        </p>
                      )}
                      {version.change_description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {version.change_description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(version.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{version.slide_count} slides</span>
                    <span>•</span>
                    <span>{version.layer_count} layers</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowRestoreDialog(true);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You're about to restore to <strong>version {selectedVersion?.version_number}</strong>
              </p>
              {selectedVersion?.version_label && (
                <p className="text-sm">{selectedVersion.version_label}</p>
              )}
              <p className="text-sm text-muted-foreground pt-2">
                This will replace the current template state. Your current work will be saved as a new version before restoring.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
