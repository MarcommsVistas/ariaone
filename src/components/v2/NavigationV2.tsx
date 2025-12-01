import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter } from "./NotificationCenter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ariaOneLogo from "@/assets/aria-one-logo.png";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavigationV2 = () => {
  const { userRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={ariaOneLogo} alt="Aria-One" className="h-8 dark:brightness-0 dark:invert" />
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

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              className="data-[state=checked]:bg-primary"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>

          <NotificationCenter />

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
