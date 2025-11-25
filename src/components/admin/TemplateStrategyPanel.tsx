import { useTemplateStore } from "@/store/useTemplateStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { classifyTemplate, type TemplateType } from "@/lib/templateClassification";
import { Layers, Info, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const TemplateStrategyPanel = () => {
  const { currentTemplate } = useTemplateStore();

  if (!currentTemplate) {
    return null;
  }

  const slides = currentTemplate.slides || [];
  const slideCount = slides.length;
  const classification = classifyTemplate(slideCount);
  
  // Get all AI-editable layers
  const allLayers = slides.flatMap(slide => 
    slide.layers.filter(layer => layer.aiEditable)
  );

  // Group layers by content type
  const contentTypeCounts = allLayers.reduce((acc, layer) => {
    const type = layer.aiContentType || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Auto-update template classification when slides change
  useEffect(() => {
    if (currentTemplate && slides.length > 0) {
      updateTemplateClassification();
    }
  }, [slideCount, currentTemplate?.id]);

  const updateTemplateClassification = async () => {
    if (!currentTemplate) return;

    try {
      const { error } = await supabase
        .from('templates')
        .update({
          frame_count: slideCount,
          template_type: classification.type
        })
        .eq('id', currentTemplate.id);

      if (error) {
        console.error('Failed to update template classification:', error);
      }
    } catch (error) {
      console.error('Error updating classification:', error);
    }
  };

  const getTypeColor = (type: TemplateType) => {
    switch (type) {
      case '1-frame':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case '3-frame':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case '5-7-frame':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Template Strategy</CardTitle>
          </div>
          <Badge className={getTypeColor(classification.type)}>
            {classification.type}
          </Badge>
        </div>
        <CardDescription>
          {classification.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Setup Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4" />
            Your AI Configuration
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Slides:</span>
              <span className="font-medium">{slideCount}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">AI Layers:</span>
              <span className="font-medium">{allLayers.length}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Types Configured */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Content Types Configured
          </h4>
          
          {Object.keys(contentTypeCounts).length > 0 ? (
            <div className="space-y-1.5">
              {Object.entries(contentTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                  >
                    <span className="text-foreground">• {type}</span>
                    <Badge variant="outline" className="text-xs">
                      {count} {count === 1 ? 'layer' : 'layers'}
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No AI-editable layers configured yet
            </p>
          )}
        </div>

        <Separator />

        {/* Tips */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Pro Tip:</strong> For {classification.type} templates, focus on 
            {classification.type === '1-frame' && ' consolidating all key information with 2-3 skills max.'}
            {classification.type === '3-frame' && ' balanced information distribution across frames.'}
            {classification.type === '5-7-frame' && ' granular segmentation with dedicated frames for each category.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
