import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

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
    console.log('🚀 Starting dynamic content generation for instance:', instanceId);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the instance and template details
    const { data: instance, error: instanceError } = await supabase
      .from('template_instances')
      .select('*, original_template_id')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instance not found');
    }

    console.log('✅ Found instance:', instance.name);

    // PHASE 1: TEMPLATE STRUCTURE ANALYSIS
    console.log('📊 Phase 1: Analyzing template structure...');

    // Check if slides exist for this instance, if not copy from template
    const { data: existingSlides } = await supabase
      .from('slides')
      .select('id')
      .eq('instance_id', instanceId);

    // If no slides exist, copy structure from template
    if (!existingSlides || existingSlides.length === 0) {
      console.log('No slides found for instance, copying from template...');
      
      // Get template slides
      const { data: templateSlides } = await supabase
        .from('slides')
        .select('*')
        .eq('template_id', instance.original_template_id)
        .order('order_index', { ascending: true });

      if (templateSlides && templateSlides.length > 0) {
        // Create slides for instance
        for (const templateSlide of templateSlides) {
          const { data: newSlide, error: slideError } = await supabase
            .from('slides')
            .insert({
              name: templateSlide.name,
              width: templateSlide.width,
              height: templateSlide.height,
              order_index: templateSlide.order_index,
              instance_id: instanceId,
            })
            .select()
            .single();

          if (slideError) {
            console.error('Error creating slide:', slideError);
            continue;
          }

          // Get layers from template slide
          const { data: templateLayers } = await supabase
            .from('layers')
            .select('*')
            .eq('slide_id', templateSlide.id);

          if (templateLayers && templateLayers.length > 0) {
            // Copy layers to new slide
            const newLayers = templateLayers.map(layer => ({
              slide_id: newSlide.id,
              type: layer.type,
              name: layer.name,
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
              line_height: layer.line_height,
              letter_spacing: layer.letter_spacing,
              text_transform: layer.text_transform,
              image_src: layer.image_src,
              max_length: layer.max_length,
              ai_editable: layer.ai_editable,
              ai_content_type: layer.ai_content_type,
              ai_prompt_template: layer.ai_prompt_template,
              hr_editable: layer.hr_editable,
              hr_visible: layer.hr_visible,
            }));

            const { error: layersError } = await supabase
              .from('layers')
              .insert(newLayers);

            if (layersError) {
              console.error('Error copying layers:', layersError);
            }
          }
        }
        
        console.log('Successfully copied template structure to instance');
      }
    }

    // Get all AI-editable layers for this instance
    const { data: slides } = await supabase
      .from('slides')
      .select(`
        id,
        name,
        order_index,
        layers!inner(
          id,
          name,
          type,
          ai_content_type,
          ai_editable,
          max_length,
          width,
          height
        )
      `)
      .eq('instance_id', instanceId)
      .eq('layers.ai_editable', true)
      .order('order_index', { ascending: true });

    if (!slides || slides.length === 0) {
      console.log('⚠️ No AI-editable layers found');
      return new Response(
        JSON.stringify({ 
          message: 'No AI-editable layers found',
          updated_layers: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group layers by ai_content_type and count them
    const layersByCategory: Record<string, any[]> = {};
    const extractionRequirements: Record<string, { count: number; max_chars_per_item?: number }> = {};

    for (const slide of slides) {
      for (const layer of slide.layers) {
        const category = layer.ai_content_type || 'other';
        
        if (!layersByCategory[category]) {
          layersByCategory[category] = [];
        }
        layersByCategory[category].push({ ...layer, slide_name: slide.name });
      }
    }

    // Calculate extraction requirements based on layer counts
    for (const [category, layers] of Object.entries(layersByCategory)) {
      const count = layers.length;
      const maxChars = layers[0]?.max_length || null;
      
      extractionRequirements[category] = {
        count,
        ...(maxChars && { max_chars_per_item: maxChars })
      };
    }

    console.log('📋 Extraction requirements:', JSON.stringify(extractionRequirements, null, 2));

    // PHASE 2: INTELLIGENT JD PARSING
    console.log('🧠 Phase 2: Parsing job description...');

    // Fetch brand context
    const { data: template } = await supabase
      .from('templates')
      .select('brand')
      .eq('id', instance.original_template_id)
      .single();

    let brandGuidelines = {
      tov: 'Professional and aspirational',
      focus_areas: [] as string[]
    };

    if (template?.brand) {
      console.log('Loading brand context for:', template.brand);
      const { data: brandData } = await supabase
        .from('brands')
        .select('tov_guidelines, ai_instructions')
        .eq('name', template.brand)
        .single();

      if (brandData) {
        brandGuidelines.tov = brandData.tov_guidelines || brandGuidelines.tov;
        if (brandData.ai_instructions) {
          try {
            const instructions = typeof brandData.ai_instructions === 'string' 
              ? JSON.parse(brandData.ai_instructions)
              : brandData.ai_instructions;
            brandGuidelines.focus_areas = instructions.focus_areas || [];
          } catch (e) {
            console.error('Failed to parse AI instructions:', e);
          }
        }
        console.log('✅ Loaded brand context');
      }
    }

    // Prepare job description for parsing
    const jobDescription = instance.job_description || {};
    const jobDescText = typeof jobDescription === 'string' 
      ? jobDescription 
      : (jobDescription.description || jobDescription.text || '');

    if (!jobDescText) {
      throw new Error('No job description found in instance');
    }

    // Call parse-job-description function
    console.log('Calling parse-job-description function...');
    
    const parseResponse = await fetch(`${SUPABASE_URL}/functions/v1/parse-job-description`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description: {
          title: instance.name || 'Job Position',
          location: jobDescription.location || instance.brand || '',
          description: jobDescText
        },
        extraction_requirements: extractionRequirements,
        brand_guidelines: brandGuidelines
      })
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('Parse function error:', parseResponse.status, errorText);
      
      if (parseResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Failed to parse job description: ${errorText}`);
    }

    const { parsed_data } = await parseResponse.json();
    console.log('✅ Received parsed data with categories:', Object.keys(parsed_data));

    // Store parsed data in instance
    await supabase
      .from('template_instances')
      .update({ 
        job_description_parsed: parsed_data,
        ai_generated: true 
      })
      .eq('id', instanceId);

    console.log('💾 Stored parsed data in instance');

    // PHASE 3: SMART LAYER POPULATION
    console.log('🎨 Phase 3: Populating layers with extracted content...');

    let updatedLayersCount = 0;

    // Iterate through each category and populate layers
    for (const [category, layers] of Object.entries(layersByCategory)) {
      const extractedItems = parsed_data[category];
      
      console.log(`Processing category "${category}": ${layers.length} layers, ${Array.isArray(extractedItems) ? extractedItems.length : 1} items`);

      if (!extractedItems) {
        console.warn(`No extracted data for category: ${category}`);
        continue;
      }

      if (Array.isArray(extractedItems)) {
        // Multi-item category (skills, domain_expertise, requirements, etc.)
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          const content = extractedItems[i] || ''; // Use item or empty string if not enough items
          
          if (content) {
            const { error: updateError } = await supabase
              .from('layers')
              .update({ text_content: content })
              .eq('id', layer.id);

            if (!updateError) {
              updatedLayersCount++;
              console.log(`  ✓ Updated "${layer.name}": "${content.substring(0, 50)}..."`);
            } else {
              console.error(`  ✗ Failed to update "${layer.name}":`, updateError);
            }
          } else {
            console.warn(`  ⚠ No content available for layer ${i + 1} of ${layers.length}`);
          }
        }
      } else {
        // Single-item category (intro, location, job_type, etc.)
        // Use the same content for all layers with this content type
        for (const layer of layers) {
          const { error: updateError } = await supabase
            .from('layers')
            .update({ text_content: extractedItems })
            .eq('id', layer.id);

          if (!updateError) {
            updatedLayersCount++;
            console.log(`  ✓ Updated "${layer.name}": "${extractedItems.substring(0, 50)}..."`);
          } else {
            console.error(`  ✗ Failed to update "${layer.name}":`, updateError);
          }
        }
      }
    }

    // Generate social media caption using parsed data
    console.log('📝 Generating social media caption...');
    
    const captionItems = [];
    if (parsed_data.intro) captionItems.push(parsed_data.intro);
    if (parsed_data.location) captionItems.push(`📍 ${parsed_data.location}`);
    if (parsed_data.job_type) captionItems.push(`💼 ${parsed_data.job_type}`);
    
    const captionCopy = `${captionItems.join(' | ')}

Apply now and join our team! 🚀

#Hiring #JobOpportunity #${instance.name?.replace(/\s+/g, '')} #CareerGrowth`;

    // Update instance with caption
    await supabase
      .from('template_instances')
      .update({ caption_copy: captionCopy })
      .eq('id', instanceId);
    
    console.log('✅ Caption generated and saved');

    console.log(`\n🎉 Content generation completed!`);
    console.log(`   - Updated ${updatedLayersCount} layers across ${Object.keys(layersByCategory).length} categories`);
    console.log(`   - Generated social media caption`);

    return new Response(
      JSON.stringify({ 
        message: 'Dynamic content generation completed successfully',
        updated_layers: updatedLayersCount,
        categories_processed: Object.keys(layersByCategory).length,
        parsed_data_stored: true,
        caption_generated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-creative:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
