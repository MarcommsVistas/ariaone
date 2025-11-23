import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const NavigationV2 = () => {
  const { userRole, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSwitchToV1 = async () => {
    try {
      // Update preferred version in database
      const { error } = await supabase
        .from('user_roles')
        .update({ preferred_version: 'v1' })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update state and navigate
      await useAuthStore.getState().setPreferredVersion('v1');
      navigate('/');
    } catch (error) {
      console.error("Error switching version:", error);
      toast({
        title: "Error",
        description: "Failed to switch version",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ARIA ONE</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered V2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchToV1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Switch to V1
          </Button>

          {userRole && (
            <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium capitalize">
              {userRole}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};
