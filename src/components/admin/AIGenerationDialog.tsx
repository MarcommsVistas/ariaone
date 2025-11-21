import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTemplateStore } from '@/store/useTemplateStore';

export const AIGenerationDialog = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedLayer, updateLayer } = useTemplateStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedLayer) return;

    setIsGenerating(true);
    try {
      const context = `Generate content for a ${selectedLayer.type} layer named "${selectedLayer.name}". 
                      Keep it concise and appropriate for marketing materials.`;

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt, context }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message.includes('402')) {
          toast.error('AI usage limit reached. Please add credits to continue.');
        } else {
          toast.error('Failed to generate content');
        }
        return;
      }

      if (data?.text) {
        updateLayer(selectedLayer.id, { text: data.text });
        toast.success('Content generated successfully!');
        setOpen(false);
        setPrompt('');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedLayer || selectedLayer.type !== 'text') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Content with AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="prompt" className="text-sm font-medium">
              What would you like to generate?
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Describe the content you want for "{selectedLayer.name}"
            </p>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Write a catchy hiring headline for a tech company"
              className="min-h-[100px]"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
