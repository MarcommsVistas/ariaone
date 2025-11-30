import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting comprehensive backup...');

    // Fetch all critical tables
    const tables = [
      'templates',
      'template_instances',
      'brands',
      'categories',
      'creative_reviews',
      'custom_fonts',
      'user_roles',
      'audit_logs',
      'notifications'
    ];

    const backupData: Record<string, any> = {};
    let totalRecords = 0;

    // Fetch each table's data
    for (const table of tables) {
      console.log(`Fetching ${table}...`);
      
      if (table === 'templates') {
        const { data, error } = await supabase
          .from('templates')
          .select(`
            *,
            slides (
              *,
              layers (*)
            )
          `)
          .is('deleted_at', null);
        
        if (error) throw error;
        backupData[table] = data || [];
        totalRecords += data?.length || 0;
      } else if (table === 'template_instances') {
        const { data, error } = await supabase
          .from('template_instances')
          .select(`
            *,
            slides (
              *,
              layers (*)
            )
          `)
          .is('deleted_at', null);
        
        if (error) throw error;
        backupData[table] = data || [];
        totalRecords += data?.length || 0;
      } else {
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) throw error;
        backupData[table] = data || [];
        totalRecords += data?.length || 0;
      }
    }

    // List storage files for reference
    const storageBuckets = ['psd-files', 'custom-fonts'];
    const storageFiles: Record<string, any> = {};
    
    for (const bucket of storageBuckets) {
      const { data: files } = await supabase.storage.from(bucket).list();
      storageFiles[bucket] = files || [];
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `backup-${timestamp}-${Date.now()}.json`;

    // Prepare comprehensive backup
    const completeBackup = {
      backup_date: new Date().toISOString(),
      total_records: totalRecords,
      tables: backupData,
      storage_references: storageFiles,
      metadata: {
        version: '3.0',
        backup_type: 'comprehensive',
        tables_included: tables,
      }
    };

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('template-backups')
      .upload(filename, JSON.stringify(completeBackup, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) throw uploadError;

    console.log(`✅ Backup created: ${filename} (${totalRecords} total records)`);

    // Clean up old backups (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldFiles } = await supabase.storage
      .from('template-backups')
      .list();

    const filesToDelete = oldFiles?.filter(file => {
      const fileDate = new Date(file.created_at);
      return fileDate < thirtyDaysAgo;
    }).map(f => f.name) || [];

    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('template-backups')
        .remove(filesToDelete);
      console.log(`🗑️ Deleted ${filesToDelete.length} old backup(s)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup_file: filename,
        total_records: totalRecords,
        tables_backed_up: tables.length,
        deleted_old_backups: filesToDelete.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Backup failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
