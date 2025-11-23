import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { instanceId } = await req.json();

    if (!instanceId) {
      return new Response(
        JSON.stringify({ error: "instanceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch instance data
    const { data: instance, error: instanceError } = await supabase
      .from("template_instances")
      .select("*, original_template_id")
      .eq("id", instanceId)
      .single();

    if (instanceError || !instance) {
      console.error("Error fetching instance:", instanceError);
      return new Response(
        JSON.stringify({ error: "Instance not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch slides and layers
    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select(`
        id,
        name,
        width,
        height,
        order_index,
        layers (*)
      `)
      .eq("instance_id", instanceId)
      .order("order_index");

    if (slidesError) {
      console.error("Error fetching slides:", slidesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch slides" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate export data
    const exportData = {
      instance: {
        name: instance.name,
        brand: instance.brand,
        category: instance.category,
        created_at: instance.created_at,
      },
      job_description: instance.job_description || {},
      caption: instance.caption_copy || "No caption generated",
      slides: slides?.map(slide => ({
        name: slide.name,
        width: slide.width,
        height: slide.height,
        layers: slide.layers,
      })) || [],
    };

    // Create caption.txt content
    const captionContent = instance.caption_copy || "No caption generated";

    // Create details.txt content
    const jobDesc = instance.job_description || {};
    const detailsContent = `Project: ${instance.name}
Brand: ${instance.brand || "N/A"}
Category: ${instance.category || "N/A"}
Created: ${new Date(instance.created_at).toLocaleDateString()}

Job Details:
${Object.entries(jobDesc).map(([key, value]) => `${key}: ${value}`).join("\n")}

Caption:
${instance.caption_copy || "No caption generated"}
`;

    return new Response(
      JSON.stringify({
        success: true,
        exportData,
        captionContent,
        detailsContent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in export-creative:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
