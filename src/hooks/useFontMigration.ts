import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OldCustomFont {
  name: string;
  family: string;
  dataUrl: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

export const useFontMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const migrateFromLocalStorage = async () => {
      // Check if migration already done
      const migrationDone = localStorage.getItem('font-migration-complete');
      if (migrationDone === 'true') {
        setMigrationComplete(true);
        return;
      }

      // Check for old fonts in localStorage
      const oldFontsJson = localStorage.getItem('font-storage');
      if (!oldFontsJson) {
        localStorage.setItem('font-migration-complete', 'true');
        setMigrationComplete(true);
        return;
      }

      try {
        const oldStorage = JSON.parse(oldFontsJson);
        const oldFonts: OldCustomFont[] = oldStorage?.state?.uploadedFonts || [];

        if (oldFonts.length === 0) {
          localStorage.removeItem('font-storage');
          localStorage.setItem('font-migration-complete', 'true');
          setMigrationComplete(true);
          return;
        }

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // User not logged in, skip migration for now
          return;
        }

        setIsMigrating(true);
        toast.info(`Migrating ${oldFonts.length} font(s) to cloud storage...`);

        let migratedCount = 0;
        let failedCount = 0;

        for (const oldFont of oldFonts) {
          try {
            // Convert data URL to blob
            const response = await fetch(oldFont.dataUrl);
            const blob = await response.blob();

            // Determine file extension
            const ext = oldFont.dataUrl.includes('font/woff2') ? 'woff2' :
                        oldFont.dataUrl.includes('font/woff') ? 'woff' :
                        oldFont.dataUrl.includes('font/ttf') ? 'ttf' :
                        oldFont.dataUrl.includes('font/otf') ? 'otf' : 'woff2';

            // Upload to Supabase Storage
            const storagePath = `${user.id}/${oldFont.family}_migrated.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from('custom-fonts')
              .upload(storagePath, blob, {
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) throw uploadError;

            // Save metadata to database
            const { error: dbError } = await supabase
              .from('custom_fonts')
              .insert({
                user_id: user.id,
                name: oldFont.name,
                family: oldFont.family,
                weight: oldFont.weight || 400,
                style: oldFont.style || 'normal',
                file_name: `${oldFont.name}.${ext}`,
                storage_path: storagePath,
                file_size: blob.size
              });

            if (dbError && !dbError.message.includes('duplicate')) {
              throw dbError;
            }

            migratedCount++;
          } catch (error) {
            console.error(`Failed to migrate font ${oldFont.name}:`, error);
            failedCount++;
          }
        }

        // Clean up localStorage
        localStorage.removeItem('font-storage');
        localStorage.setItem('font-migration-complete', 'true');

        if (migratedCount > 0) {
          toast.success(`Successfully migrated ${migratedCount} font(s) to cloud storage`);
        }
        if (failedCount > 0) {
          toast.warning(`Failed to migrate ${failedCount} font(s)`);
        }

        setMigrationComplete(true);
      } catch (error) {
        console.error('Migration error:', error);
        toast.error('Failed to migrate fonts from local storage');
      } finally {
        setIsMigrating(false);
      }
    };

    migrateFromLocalStorage();
  }, []);

  return { isMigrating, migrationComplete };
};
