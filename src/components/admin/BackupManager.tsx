import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const BackupManager = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFiles, setBackupFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-templates', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Backup created successfully! ${data.total_records} records backed up.`);
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const loadBackupFiles = async () => {
    setLoadingFiles(true);
    try {
      const { data: files, error } = await supabase.storage
        .from('template-backups')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      setBackupFiles(files || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Failed to load backup files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('template-backups')
        .download(filename);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download backup');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm('⚠️ This will restore data from the backup and may overwrite existing data. Continue?')) {
      return;
    }

    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('restore-backup', {
        body: { backup_file: filename }
      });

      if (error) throw error;

      toast.success(`Restore completed! ${data.total_restored} records restored.`);
      window.location.reload();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Manage database backups and restore from previous versions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Automated backups run daily at 2 AM UTC and are retained for 30 days.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={handleBackupNow} 
            disabled={isBackingUp}
            variant="default"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Backup Now
              </>
            )}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={loadBackupFiles}>
                <Download className="mr-2 h-4 w-4" />
                View Backups
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Available Backups</DialogTitle>
                <DialogDescription>
                  Download or restore from previous backups
                </DialogDescription>
              </DialogHeader>
              
              {loadingFiles ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading backups...
                </div>
              ) : backupFiles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No backups available
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {backupFiles.map((file) => (
                    <div 
                      key={file.name} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadBackup(file.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRestoreBackup(file.name)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? 'Restoring...' : 'Restore'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
