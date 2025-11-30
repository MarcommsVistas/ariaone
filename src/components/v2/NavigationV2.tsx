import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "./NotificationBell";
import ariaOneLogo from "@/assets/aria-one-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavigationV2 = () => {
  const { userRole, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
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
          <img src={ariaOneLogo} alt="Aria-One" className="h-8" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered V2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userRole === 'marcomms' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  Admin
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/v2/admin")}>
                  Dashboard
                </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/v2/admin/templates")}>
                Templates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/v2/admin/archive")}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/v2/admin/brand-voice")}>
                Brand Voice
              </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/v2/admin/reviews")}>
                  Review Queue
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/v2/admin/categories")}>
                  Categories
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {userRole === 'marcomms' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchToV1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Switch to V1
            </Button>
          )}

          <NotificationBell />

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
