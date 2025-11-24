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
    const { job_description, extraction_requirements, brand_guidelines } = await req.json();
    
    console.log('Parsing job description with requirements:', extraction_requirements);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build dynamic AI prompt based on extraction requirements
    let prompt = `You are a job description parser that extracts structured data for creative templates. Extract information with professional tone while maintaining the original intent.

Job Title: ${job_description.title}
Location: ${job_description.location || 'Not specified'}
Full Job Description:
${job_description.description}

Extract the following categories from the job description above:\n\n`;

    // Dynamically add extraction requirements
    for (const [category, config] of Object.entries(extraction_requirements)) {
      const count = typeof config === 'object' && config !== null && 'count' in config ? config.count : config;
      const maxChars = typeof config === 'object' && config !== null && 'max_chars_per_item' in config ? config.max_chars_per_item : null;
      
      prompt += `${category.toUpperCase()}:\n`;
      prompt += `- Extract exactly ${count} item(s)\n`;
      if (maxChars) {
        prompt += `- Maximum ${maxChars} characters per item\n`;
      }
      
      // Add category-specific instructions
      switch (category) {
        case 'skills':
          prompt += `- Focus on must-have technical and soft skills\n`;
          prompt += `- Format as concise, actionable bullet points\n`;
          break;
        case 'domain_expertise':
          prompt += `- Extract core domain knowledge areas in ALL CAPS\n`;
          prompt += `- Focus on specialized expertise and frameworks\n`;
          break;
        case 'qualifications_education':
          prompt += `- Summarize educational requirements\n`;
          break;
        case 'qualifications_experience':
          prompt += `- Summarize years and type of experience required\n`;
          break;
        case 'qualifications_combined':
          prompt += `- Combine education and experience requirements\n`;
          break;
        case 'requirements':
          prompt += `- Extract key job requirements and must-haves\n`;
          break;
        case 'responsibilities':
          prompt += `- Extract main job responsibilities and duties\n`;
          break;
        case 'intro':
          prompt += `- Write a compelling 1-2 sentence introduction about the role\n`;
          break;
        case 'job_type':
          prompt += `- Extract contract type, duration, or employment type\n`;
          break;
        case 'email_subject':
          prompt += `- Generate a professional email subject line for applications\n`;
          break;
      }
      prompt += `\n`;
    }

    // Add brand voice context if provided
    if (brand_guidelines?.tov) {
      prompt += `\nBrand Voice Guidelines:\n`;
      prompt += `Tone: ${brand_guidelines.tov}\n`;
      if (brand_guidelines.focus_areas?.length) {
        prompt += `Focus Areas: ${brand_guidelines.focus_areas.join(', ')}\n`;
      }
    }

    prompt += `\nIMPORTANT: Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "job_title": "${job_description.title}",
  "location": "${job_description.location || 'Not specified'}",`;
    
    // Add expected keys based on extraction requirements
    for (const category of Object.keys(extraction_requirements)) {
      const count = typeof extraction_requirements[category] === 'object' 
        ? extraction_requirements[category].count 
        : extraction_requirements[category];
      
      if (count > 1) {
        prompt += `\n  "${category}": ["item1", "item2", ...],`;
      } else {
        prompt += `\n  "${category}": "single item",`;
      }
    }
    
    prompt += `\n}`;

    console.log('Calling Lovable AI for JD parsing...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a job description parser. Return valid JSON only, no markdown formatting, no code blocks.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('Received AI response');

    let parsedData;
    try {
      const content = aiData.choices[0].message.content;
      // Clean up any markdown code blocks that might be present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedData = JSON.parse(cleanContent);
      console.log('Successfully parsed AI response:', Object.keys(parsedData));
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', aiData.choices[0].message.content);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify({ parsed_data: parsedData }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in parse-job-description:', error);
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
