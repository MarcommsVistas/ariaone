/**
 * Template classification utilities for auto-detecting template types
 * and suggesting optimal layer mapping strategies
 */

export type TemplateType = '1-frame' | '3-frame' | '5-7-frame';

export interface LayerMappingSuggestion {
  category: string;
  contentType: string;
  description: string;
  recommendedLayers: number;
  example: string;
}

export interface TemplateClassification {
  type: TemplateType;
  frameCount: number;
  description: string;
  suggestedMappings: LayerMappingSuggestion[];
}

/**
 * Classify template based on slide count
 */
export function classifyTemplate(slideCount: number): TemplateClassification {
  if (slideCount === 1) {
    return {
      type: '1-frame',
      frameCount: slideCount,
      description: 'Single-frame template - All information in one slide',
      suggestedMappings: [
        {
          category: 'Header',
          contentType: 'headline',
          description: 'Job title',
          recommendedLayers: 1,
          example: 'Senior Software Engineer'
        },
        {
          category: 'Introduction',
          contentType: 'intro',
          description: 'Brief role overview',
          recommendedLayers: 1,
          example: 'Join our innovative team...'
        },
        {
          category: 'Key Skills',
          contentType: 'skills',
          description: 'Top 2-3 must-have skills',
          recommendedLayers: 2,
          example: 'React expertise, Team leadership'
        },
        {
          category: 'Qualifications',
          contentType: 'qualifications_combined',
          description: 'Combined education and experience',
          recommendedLayers: 1,
          example: 'Bachelor\'s degree + 5 years experience'
        },
        {
          category: 'Location & Type',
          contentType: 'location',
          description: 'Where and what type',
          recommendedLayers: 1,
          example: 'Remote - Full-time'
        }
      ]
    };
  }
  
  if (slideCount >= 2 && slideCount <= 4) {
    return {
      type: '3-frame',
      frameCount: slideCount,
      description: '3-frame template - Key information across multiple slides',
      suggestedMappings: [
        {
          category: 'Frame 1: Introduction',
          contentType: 'headline',
          description: 'Job title and introduction',
          recommendedLayers: 2,
          example: 'Title: Data Scientist | Intro: Transform data into insights'
        },
        {
          category: 'Frame 1: Location',
          contentType: 'location',
          description: 'Job location',
          recommendedLayers: 1,
          example: 'New York, NY'
        },
        {
          category: 'Frame 2: Requirements',
          contentType: 'qualifications_combined',
          description: 'Education and experience requirements',
          recommendedLayers: 1,
          example: 'Master\'s in CS + 3-5 years experience'
        },
        {
          category: 'Frame 2: Skills',
          contentType: 'skills',
          description: 'Key technical skills',
          recommendedLayers: 3,
          example: 'Python, Machine Learning, Data Visualization'
        },
        {
          category: 'Frame 3: Call to Action',
          contentType: 'cta',
          description: 'Application instruction',
          recommendedLayers: 1,
          example: 'Apply now to join our team!'
        },
        {
          category: 'Frame 3: Job Type',
          contentType: 'job_type',
          description: 'Contract details',
          recommendedLayers: 1,
          example: 'Full-time, Hybrid'
        }
      ]
    };
  }
  
  // 5-7 frame template
  return {
    type: '5-7-frame',
    frameCount: slideCount,
    description: '5-7 frame template - Detailed information with granular segmentation',
    suggestedMappings: [
      {
        category: 'Frame 1: Header',
        contentType: 'headline',
        description: 'Job title',
        recommendedLayers: 1,
        example: 'Bids & Proposals Specialist'
      },
      {
        category: 'Frame 1: Introduction',
        contentType: 'intro',
        description: 'Compelling role introduction',
        recommendedLayers: 1,
        example: 'VISTAS is seeking a qualified specialist...'
      },
      {
        category: 'Frame 1: Location',
        contentType: 'location',
        description: 'Job location',
        recommendedLayers: 1,
        example: 'Qatar'
      },
      {
        category: 'Frame 2: Education',
        contentType: 'qualifications_education',
        description: 'Educational requirements',
        recommendedLayers: 1,
        example: 'Bachelor\'s degree in Engineering'
      },
      {
        category: 'Frame 2: Experience',
        contentType: 'qualifications_experience',
        description: 'Years of experience required',
        recommendedLayers: 1,
        example: 'Minimum 5-8 years in bid writing'
      },
      {
        category: 'Frame 3: Must-Have Skills',
        contentType: 'skills',
        description: 'Core technical and soft skills',
        recommendedLayers: 3,
        example: 'Bid document preparation, MS Office, Bilingual (Arabic/English)'
      },
      {
        category: 'Frame 4: Domain Expertise',
        contentType: 'domain_expertise',
        description: 'Specialized knowledge areas',
        recommendedLayers: 3,
        example: 'PPP FRAMEWORKS, RISK ALLOCATION, LIFECYCLE COSTING'
      },
      {
        category: 'Frame 5: Job Details',
        contentType: 'job_type',
        description: 'Contract type and duration',
        recommendedLayers: 1,
        example: '3-month extendable contract'
      },
      {
        category: 'Frame 5: Application',
        contentType: 'email_subject',
        description: 'Email subject line',
        recommendedLayers: 1,
        example: 'Application: Bids and Proposals Specialist'
      }
    ]
  };
}

/**
 * Get recommended content types for a specific template type
 */
export function getRecommendedContentTypes(templateType: TemplateType): string[] {
  switch (templateType) {
    case '1-frame':
      return ['headline', 'intro', 'skills', 'qualifications_combined', 'location'];
    case '3-frame':
      return ['headline', 'intro', 'location', 'qualifications_combined', 'skills', 'cta', 'job_type'];
    case '5-7-frame':
      return [
        'headline',
        'intro',
        'location',
        'qualifications_education',
        'qualifications_experience',
        'skills',
        'domain_expertise',
        'job_type',
        'email_subject'
      ];
    default:
      return ['headline', 'intro', 'skills', 'location'];
  }
}

/**
 * Suggest optimal layer count for a content type based on template type
 */
export function getSuggestedLayerCount(
  contentType: string,
  templateType: TemplateType
): number {
  const suggestions: Record<TemplateType, Record<string, number>> = {
    '1-frame': {
      headline: 1,
      intro: 1,
      skills: 2,
      qualifications_combined: 1,
      location: 1,
      other: 1
    },
    '3-frame': {
      headline: 1,
      intro: 1,
      location: 1,
      qualifications_combined: 1,
      skills: 3,
      requirements: 2,
      cta: 1,
      job_type: 1,
      other: 1
    },
    '5-7-frame': {
      headline: 1,
      intro: 1,
      location: 1,
      qualifications_education: 1,
      qualifications_experience: 1,
      skills: 3,
      domain_expertise: 3,
      requirements: 2,
      responsibilities: 3,
      job_type: 1,
      email_subject: 1,
      other: 1
    }
  };

  return suggestions[templateType][contentType] || 1;
}

/**
 * Generate a template strategy report
 */
export function generateTemplateStrategy(
  slideCount: number,
  currentLayers: Array<{ ai_content_type: string | null; name: string }>
): {
  classification: TemplateClassification;
  currentSetup: Record<string, number>;
  recommendations: Array<{
    contentType: string;
    current: number;
    suggested: number;
    action: 'add' | 'remove' | 'optimal';
  }>;
} {
  const classification = classifyTemplate(slideCount);
  
  // Count current layers by content type
  const currentSetup: Record<string, number> = {};
  currentLayers.forEach(layer => {
    const type = layer.ai_content_type || 'other';
    currentSetup[type] = (currentSetup[type] || 0) + 1;
  });

  // Generate recommendations
  const recommendations = classification.suggestedMappings.map(mapping => {
    const current = currentSetup[mapping.contentType] || 0;
    const suggested = mapping.recommendedLayers;
    
    let action: 'add' | 'remove' | 'optimal' = 'optimal';
    if (current < suggested) {
      action = 'add';
    } else if (current > suggested) {
      action = 'remove';
    }

    return {
      contentType: mapping.contentType,
      current,
      suggested,
      action
    };
  });

  return {
    classification,
    currentSetup,
    recommendations
  };
}
