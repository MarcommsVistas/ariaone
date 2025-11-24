import { useState, useMemo } from 'react';
import { useTemplateStore } from '@/store/useTemplateStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Settings2, Type, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AI_CONTENT_TYPES = [
  { value: 'headline', label: 'Headline' },
  { value: 'intro', label: 'Introduction' },
  { value: 'skills', label: 'Skills' },
  { value: 'domain_expertise', label: 'Domain Expertise' },
  { value: 'qualifications_education', label: 'Qualifications & Education' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'application', label: 'Application Instructions' },
  { value: 'image', label: 'Image' },
  { value: 'other', label: 'Other' },
];

export const BulkLayerConfigurationDialog = () => {
  const { currentTemplate } = useTemplateStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [bulkAiEditable, setBulkAiEditable] = useState<boolean | null>(null);
  const [bulkContentType, setBulkContentType] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  // Get all text layers from all slides
  const allTextLayers = useMemo(() => {
    if (!currentTemplate) return [];
    
    return currentTemplate.slides.flatMap((slide, slideIndex) =>
      slide.layers
        .filter(layer => layer.type === 'text')
        .map(layer => ({
          ...layer,
          slideIndex,
          slideName: slide.name,
        }))
    );
  }, [currentTemplate]);

  const toggleLayer = (layerId: string) => {
    setSelectedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedLayers(new Set(allTextLayers.map(l => l.id)));
  };

  const deselectAll = () => {
    setSelectedLayers(new Set());
  };

  const handleApply = async () => {
    if (selectedLayers.size === 0) {
      toast({
        title: "No layers selected",
        description: "Please select at least one layer to update.",
        variant: "destructive",
      });
      return;
    }

    if (bulkAiEditable === null && !bulkContentType) {
      toast({
        title: "No changes specified",
        description: "Please specify AI-editable status or content type to apply.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      const updates = Array.from(selectedLayers).map(async (layerId) => {
        const updateData: any = {};
        
        if (bulkAiEditable !== null) {
          updateData.ai_editable = bulkAiEditable;
        }
        
        if (bulkContentType) {
          updateData.ai_content_type = bulkContentType;
        }

        const { error } = await supabase
          .from('layers')
          .update(updateData)
          .eq('id', layerId);

        if (error) throw error;
      });

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `Updated ${selectedLayers.size} layer(s) successfully.`,
      });

      // Refresh templates to show changes
      await useTemplateStore.getState().fetchTemplates();
      
      // Reset and close
      setSelectedLayers(new Set());
      setBulkAiEditable(null);
      setBulkContentType('');
      setOpen(false);
    } catch (error: any) {
      console.error('Error updating layers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update layers",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getPreviewSummary = () => {
    if (selectedLayers.size === 0) return null;

    const changes = [];
    if (bulkAiEditable !== null) {
      changes.push(`Set AI-editable to ${bulkAiEditable ? 'enabled' : 'disabled'}`);
    }
    if (bulkContentType) {
      const contentTypeLabel = AI_CONTENT_TYPES.find(ct => ct.value === bulkContentType)?.label;
      changes.push(`Set content type to "${contentTypeLabel}"`);
    }

    if (changes.length === 0) return null;

    return (
      <div className="p-3 bg-muted/50 rounded-md border border-border">
        <p className="text-sm font-medium mb-1">Preview of changes:</p>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Updating {selectedLayers.size} layer(s)</li>
          {changes.map((change, i) => (
            <li key={i}>• {change}</li>
          ))}
        </ul>
      </div>
    );
  };

  if (!currentTemplate) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Bulk Configure Layers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Layer Configuration</DialogTitle>
          <DialogDescription>
            Configure multiple text layers at once for AI-powered generation
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Controls */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={allTextLayers.length === 0}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={selectedLayers.size === 0}
              >
                Deselect All
              </Button>
              <Badge variant="secondary">
                {selectedLayers.size} of {allTextLayers.length} selected
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI-Editable Status</label>
                <Select
                  value={bulkAiEditable === null ? '' : bulkAiEditable.toString()}
                  onValueChange={(value) => setBulkAiEditable(value === '' ? null : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    <SelectItem value="true">Enable AI-editable</SelectItem>
                    <SelectItem value="false">Disable AI-editable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <Select value={bulkContentType} onValueChange={setBulkContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    {AI_CONTENT_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {getPreviewSummary()}
          </div>

          {/* Layer List */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-4 space-y-2">
              {allTextLayers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No text layers found in this template
                </p>
              ) : (
                allTextLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-md border transition-colors
                      ${selectedLayers.has(layer.id) 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-background border-border hover:bg-muted/50'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedLayers.has(layer.id)}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                    
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Type className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{layer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Slide {layer.slideIndex + 1}: {layer.slideName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {layer.aiEditable ? (
                        <Badge variant="default" className="text-xs">
                          AI-editable
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not AI-editable
                        </Badge>
                      )}
                      
                      {layer.aiContentType && (
                        <Badge variant="secondary" className="text-xs">
                          {AI_CONTENT_TYPES.find(ct => ct.value === layer.aiContentType)?.label || layer.aiContentType}
                        </Badge>
                      )}

                      {layer.visible ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isApplying || selectedLayers.size === 0}
            >
              {isApplying ? 'Applying...' : `Apply to ${selectedLayers.size} Layer(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
