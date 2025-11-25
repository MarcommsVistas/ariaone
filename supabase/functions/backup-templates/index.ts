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

    console.log('🔄 Starting template backup...');

    // Fetch all active templates with full data
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select(`
        *,
        slides (
          *,
          layers (*)
        )
      `)
      .is('deleted_at', null);

    if (templatesError) throw templatesError;

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `backup-${timestamp}-${Date.now()}.json`;

    // Prepare backup data
    const backupData = {
      backup_date: new Date().toISOString(),
      template_count: templates?.length || 0,
      templates: templates || [],
      metadata: {
        version: '2.0',
        backup_type: 'automated_daily',
      }
    };

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('template-backups')
      .upload(filename, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) throw uploadError;

    console.log(`✅ Backup created: ${filename} (${templates?.length || 0} templates)`);

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
        template_count: templates?.length || 0,
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
