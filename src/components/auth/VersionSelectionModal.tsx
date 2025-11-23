import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VersionSelectionModalProps {
  open: boolean;
  onVersionSelected: (version: 'v1' | 'v2') => void;
}

export const VersionSelectionModal = ({ open, onVersionSelected }: VersionSelectionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleVersionSelect = async (version: 'v1' | 'v2') => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_roles')
        .update({ preferred_version: version })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Switched to ${version === 'v1' ? 'Classic' : 'AI-Powered'} Workflow`);
      onVersionSelected(version);
    } catch (error) {
      console.error('Error updating version:', error);
      toast.error('Failed to update version preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome! Choose Your Workflow</DialogTitle>
          <DialogDescription>
            Select how you'd like to work. You can change this anytime in settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => !isLoading && handleVersionSelect('v1')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Edit3 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">V1: Classic Workflow</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manual editing with full control. Create, edit, and export templates directly.
                  </p>
                  <ul className="text-xs text-left space-y-1 text-muted-foreground">
                    <li>• Direct template editing</li>
                    <li>• Immediate downloads</li>
                    <li>• Full creative control</li>
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVersionSelect('v1');
                  }}
                >
                  Choose Classic
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors border-primary/50"
              onClick={() => !isLoading && handleVersionSelect('v2')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                    V2: AI-Powered Workflow
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">NEW</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-assisted content generation with review & approval workflow.
                  </p>
                  <ul className="text-xs text-left space-y-1 text-muted-foreground">
                    <li>• AI-powered content generation</li>
                    <li>• Submit for Marcomms review</li>
                    <li>• Brand voice consistency</li>
                    <li>• Collaborative workflow</li>
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVersionSelect('v2');
                  }}
                >
                  Choose AI-Powered
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
