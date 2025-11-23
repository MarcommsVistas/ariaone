import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceId } = await req.json();
    
    if (!instanceId) {
      return new Response(JSON.stringify({ error: "instanceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch instance with job description
    const { data: instance, error: instanceError } = await supabase
      .from('template_instances')
      .select('*, templates!original_template_id(name, brand, category)')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error('Instance fetch error:', instanceError);
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jobDesc = instance.job_description as { title: string; description: string; location: string };
    if (!jobDesc) {
      return new Response(JSON.stringify({ error: "No job description found" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if slides already exist for this instance
    const { data: existingSlides } = await supabase
      .from('slides')
      .select('id')
      .eq('instance_id', instanceId)
      .limit(1);

    // If slides don't exist, copy template structure
    if (!existingSlides || existingSlides.length === 0) {
      console.log('Copying template structure to instance...');
      
      // Fetch template slides
      const { data: templateSlides, error: slidesError } = await supabase
        .from('slides')
        .select('*, layers(*)')
        .eq('template_id', instance.original_template_id)
        .order('order_index', { ascending: true });

      if (slidesError || !templateSlides) {
        console.error('Template slides fetch error:', slidesError);
        return new Response(JSON.stringify({ error: "Failed to fetch template slides" }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Copy slides and layers
      for (const slide of templateSlides) {
        const { data: newSlide, error: slideInsertError } = await supabase
          .from('slides')
          .insert({
            name: slide.name,
            width: slide.width,
            height: slide.height,
            order_index: slide.order_index,
            instance_id: instanceId,
            template_id: null,
          })
          .select()
          .single();

        if (slideInsertError || !newSlide) {
          console.error('Slide insert error:', slideInsertError);
          continue;
        }

        // Copy layers for this slide
        const layersToInsert = slide.layers.map((layer: any) => ({
          slide_id: newSlide.id,
          name: layer.name,
          type: layer.type,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          z_index: layer.z_index,
          opacity: layer.opacity,
          rotation: layer.rotation,
          visible: layer.visible,
          locked: layer.locked,
          text_content: layer.text_content,
          font_family: layer.font_family,
          font_size: layer.font_size,
          font_weight: layer.font_weight,
          color: layer.color,
          text_align: layer.text_align,
          text_transform: layer.text_transform,
          line_height: layer.line_height,
          letter_spacing: layer.letter_spacing,
          image_src: layer.image_src,
          max_length: layer.max_length,
          ai_editable: layer.ai_editable,
          ai_content_type: layer.ai_content_type,
          ai_prompt_template: layer.ai_prompt_template,
          hr_visible: layer.hr_visible,
          hr_editable: layer.hr_editable,
        }));

        const { error: layersInsertError } = await supabase
          .from('layers')
          .insert(layersToInsert);

        if (layersInsertError) {
          console.error('Layers insert error:', layersInsertError);
        }
      }
    }

    // Fetch all AI-editable layers for this instance
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*, layers!inner(*)')
      .eq('instance_id', instanceId)
      .eq('layers.ai_editable', true);

    if (slidesError) {
      console.error('Slides fetch error:', slidesError);
      return new Response(JSON.stringify({ error: "Failed to fetch slides" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI content for each editable layer
    const updatedLayers = [];
    
    for (const slide of slides || []) {
      for (const layer of slide.layers) {
        if (!layer.ai_editable) continue;

        // Build AI prompt based on content type and job description
        let prompt = '';
        const contentType = layer.ai_content_type || 'text';
        
        if (layer.ai_prompt_template) {
          prompt = layer.ai_prompt_template
            .replace('{title}', jobDesc.title)
            .replace('{description}', jobDesc.description)
            .replace('{location}', jobDesc.location);
        } else {
          // Default prompts based on content type
          switch (contentType) {
            case 'headline':
              prompt = `Create a compelling job advertisement headline for: ${jobDesc.title}. Keep it under 60 characters, punchy and attention-grabbing.`;
              break;
            case 'description':
              prompt = `Write a concise job description for ${jobDesc.title} in ${jobDesc.location}. Based on: ${jobDesc.description}. Keep it under 150 characters.`;
              break;
            case 'location':
              prompt = `Format this location professionally: ${jobDesc.location}`;
              break;
            case 'cta':
              prompt = `Create a call-to-action for a ${jobDesc.title} job posting. Keep it under 30 characters.`;
              break;
            default:
              prompt = `Generate professional text for a ${jobDesc.title} job posting in ${jobDesc.location}. Context: ${jobDesc.description}. Keep it concise.`;
          }
        }

        // Call Lovable AI
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'You are a professional copywriter creating job advertisement content. Be concise, compelling, and professional.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`AI API error for layer ${layer.id}:`, aiResponse.status, errorText);
            continue;
          }

          const aiData = await aiResponse.json();
          const generatedContent = aiData.choices?.[0]?.message?.content?.trim();

          if (generatedContent) {
            // Update layer with AI-generated content
            const { error: updateError } = await supabase
              .from('layers')
              .update({ text_content: generatedContent })
              .eq('id', layer.id);

            if (updateError) {
              console.error(`Error updating layer ${layer.id}:`, updateError);
            } else {
              updatedLayers.push({ layerId: layer.id, content: generatedContent });
            }
          }
        } catch (aiError) {
          console.error(`AI generation error for layer ${layer.id}:`, aiError);
        }
      }
    }

    // Mark instance as AI generated
    const { error: updateInstanceError } = await supabase
      .from('template_instances')
      .update({ ai_generated: true })
      .eq('id', instanceId);

    if (updateInstanceError) {
      console.error('Instance update error:', updateInstanceError);
    }

    console.log(`Successfully generated content for ${updatedLayers.length} layers`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedLayers: updatedLayers.length,
        message: `Generated content for ${updatedLayers.length} layers`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-creative function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
