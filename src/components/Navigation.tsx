import { Layers, Users, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ariaOneLogo from "@/assets/aria-one-logo.png";

export const Navigation = () => {
  const { mode, setMode } = useTemplateStore();
  const { userRole, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <img src={ariaOneLogo} alt="Aria-One" className="h-8" />
      </div>

      <div className="flex items-center gap-3">
        {/* Mode Switching Buttons - Conditional based on role */}
        {userRole === 'marcomms' && (
          <>
            <Button
              variant={mode === 'admin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('admin')}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              Admin Studio
            </Button>
            <Button
              variant={mode === 'hr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('hr')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              HR Interface
            </Button>
          </>
        )}
        
        {userRole === 'hr' && (
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            HR Interface
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.email}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
