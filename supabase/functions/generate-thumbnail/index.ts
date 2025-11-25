import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { instanceId } = await req.json();

    if (!instanceId) {
      throw new Error('instanceId is required');
    }

    console.log(`Generating thumbnail for instance: ${instanceId}`);

    // Fetch the first slide with layers
    const { data: slides, error: slidesError } = await supabaseClient
      .from('slides')
      .select('*, layers(*)')
      .eq('instance_id', instanceId)
      .order('order_index', { ascending: true })
      .limit(1);

    if (slidesError) throw slidesError;
    if (!slides || slides.length === 0) {
      throw new Error('No slides found for this instance');
    }

    const firstSlide = slides[0];

    // Generate HTML for the slide
    const html = generateSlideHTML(firstSlide);

    // Use Puppeteer or similar to render HTML to image
    // For now, we'll use a simplified approach with html-to-image via a separate service
    // In production, you'd use Puppeteer or a headless browser service
    
    // For MVP, we'll store the slide data and generate client-side
    // This is a placeholder - actual implementation would need a rendering service
    
    const thumbnailData = {
      instanceId,
      slideWidth: firstSlide.width,
      slideHeight: firstSlide.height,
      layers: firstSlide.layers.map((layer: any) => ({
        id: layer.id,
        type: layer.type,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        text: layer.text_content,
        color: layer.color,
        fontSize: layer.font_size,
        fontFamily: layer.font_family,
        fontWeight: layer.font_weight,
        textAlign: layer.text_align,
        opacity: layer.opacity,
        rotation: layer.rotation,
        visible: layer.visible,
        zIndex: layer.z_index,
      })),
    };

    // For now, we'll return a data URL that can be generated client-side
    // In a full implementation, this would be rendered server-side
    const dataUrl = `data:application/json;base64,${btoa(JSON.stringify(thumbnailData))}`;

    // Store the thumbnail reference
    const { error: insertError } = await supabaseClient
      .from('instance_thumbnails')
      .upsert({
        instance_id: instanceId,
        thumbnail_url: dataUrl,
        generated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, thumbnailUrl: dataUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSlideHTML(slide: any): string {
  const layers = slide.layers
    .sort((a: any, b: any) => a.z_index - b.z_index)
    .map((layer: any) => {
      if (!layer.visible) return '';
      
      const style = `
        position: absolute;
        left: ${layer.x}px;
        top: ${layer.y}px;
        width: ${layer.width}px;
        height: ${layer.height}px;
        opacity: ${layer.opacity};
        transform: rotate(${layer.rotation}deg);
        z-index: ${layer.z_index};
      `;

      if (layer.type === 'text') {
        const textStyle = `
          ${style}
          color: ${layer.color || '#000000'};
          font-size: ${layer.font_size}px;
          font-family: ${layer.font_family || 'Arial'};
          font-weight: ${layer.font_weight || 400};
          text-align: ${layer.text_align || 'left'};
        `;
        return `<div style="${textStyle}">${layer.text_content || ''}</div>`;
      }

      return '';
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
          .slide { position: relative; width: ${slide.width}px; height: ${slide.height}px; background: white; }
        </style>
      </head>
      <body>
        <div class="slide">${layers}</div>
      </body>
    </html>
  `;
}
