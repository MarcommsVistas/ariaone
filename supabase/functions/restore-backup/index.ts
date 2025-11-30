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

    const { backup_file } = await req.json();

    if (!backup_file) {
      throw new Error('backup_file is required');
    }

    console.log(`🔄 Starting restore from: ${backup_file}`);

    // Download backup file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('template-backups')
      .download(backup_file);

    if (downloadError) throw downloadError;

    const backupContent = await fileData.text();
    const backup = JSON.parse(backupContent);

    console.log(`📦 Backup version: ${backup.metadata?.version || 'unknown'}`);
    console.log(`📅 Backup date: ${backup.backup_date}`);

    let restoredCount = 0;
    const results: Record<string, any> = {};

    // Restore each table
    for (const [tableName, records] of Object.entries(backup.tables || {})) {
      if (!Array.isArray(records) || records.length === 0) {
        results[tableName] = { skipped: true, reason: 'No data' };
        continue;
      }

      try {
        // For templates and instances with nested data, handle specially
        if (tableName === 'templates' || tableName === 'template_instances') {
          console.log(`Restoring ${tableName}...`);
          
          for (const record of records) {
            const { slides, ...recordData } = record;
            
            // Upsert main record
            const { error: upsertError } = await supabase
              .from(tableName)
              .upsert(recordData, { onConflict: 'id' });
            
            if (upsertError) throw upsertError;

            // Restore slides and layers if present
            if (slides && Array.isArray(slides)) {
              for (const slide of slides) {
                const { layers, ...slideData } = slide;
                
                const { error: slideError } = await supabase
                  .from('slides')
                  .upsert(slideData, { onConflict: 'id' });
                
                if (slideError) throw slideError;

                if (layers && Array.isArray(layers)) {
                  for (const layer of layers) {
                    const { error: layerError } = await supabase
                      .from('layers')
                      .upsert(layer, { onConflict: 'id' });
                    
                    if (layerError) throw layerError;
                  }
                }
              }
            }
          }
          
          restoredCount += records.length;
          results[tableName] = { restored: records.length };
        } else {
          // Simple table restore
          console.log(`Restoring ${tableName}...`);
          
          const { error: upsertError } = await supabase
            .from(tableName)
            .upsert(records, { onConflict: 'id' });
          
          if (upsertError) throw upsertError;
          
          restoredCount += records.length;
          results[tableName] = { restored: records.length };
        }
      } catch (error) {
        console.error(`Error restoring ${tableName}:`, error);
        results[tableName] = { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    console.log(`✅ Restore completed: ${restoredCount} records restored`);

    return new Response(
      JSON.stringify({
        success: true,
        backup_file,
        backup_date: backup.backup_date,
        total_restored: restoredCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Restore failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
