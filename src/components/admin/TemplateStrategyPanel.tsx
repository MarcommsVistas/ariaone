import { useTemplateStore } from "@/store/useTemplateStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  classifyTemplate, 
  generateTemplateStrategy,
  type TemplateType 
} from "@/lib/templateClassification";
import { Layers, TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const TemplateStrategyPanel = () => {
  const { currentTemplate } = useTemplateStore();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const strategy = generateTemplateStrategy(
    slideCount, 
    allLayers.map(layer => ({
      ai_content_type: layer.aiContentType || 'other',
      name: layer.name
    }))
  );

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

  const getActionIcon = (action: 'add' | 'remove' | 'optimal') => {
    switch (action) {
      case 'add':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case 'remove':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'optimal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getActionText = (action: 'add' | 'remove' | 'optimal', current: number, suggested: number) => {
    switch (action) {
      case 'add':
        return `Add ${suggested - current} more`;
      case 'remove':
        return `Consider reducing by ${current - suggested}`;
      case 'optimal':
        return 'Optimal';
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
            Current Setup
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

        {/* Suggested Layer Mapping */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Suggested Layer Mapping
          </h4>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {strategy.recommendations.map((rec, index) => {
              const mapping = classification.suggestedMappings.find(
                m => m.contentType === rec.contentType
              );
              
              if (!mapping) return null;

              return (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border bg-muted/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {mapping.category}
                        </span>
                        {getActionIcon(rec.action)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mapping.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {mapping.contentType}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Current: <span className="font-medium text-foreground">{rec.current}</span> | 
                      Suggested: <span className="font-medium text-foreground">{rec.suggested}</span>
                    </span>
                    <span className={
                      rec.action === 'optimal' 
                        ? 'text-green-500' 
                        : rec.action === 'add'
                        ? 'text-amber-500'
                        : 'text-orange-500'
                    }>
                      {getActionText(rec.action, rec.current, rec.suggested)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      Example: "{mapping.example}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
