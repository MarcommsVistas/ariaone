import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { UserRole, useAuthStore } from "@/store/useAuthStore";
import ariaOneLogo from "@/assets/aria-one-logo.png";
import { RequestAccessDialog } from "@/components/auth/RequestAccessDialog";
import { SignInDialog } from "@/components/auth/SignInDialog";

const Login = () => {
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignInClick = (role: UserRole) => {
    setSelectedRole(role);
    setSignInDialogOpen(true);
  };

  return (
    <>
      <RequestAccessDialog 
        open={requestAccessOpen} 
        onOpenChange={setRequestAccessOpen} 
      />
      
      {selectedRole && (
        <SignInDialog 
          open={signInDialogOpen} 
          onOpenChange={setSignInDialogOpen}
          role={selectedRole}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-8">
            <img src={ariaOneLogo} alt="Aria One Logo" className="h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-6">Welcome to Aria One</h1>
            
            <Button 
              size="lg"
              onClick={() => setRequestAccessOpen(true)}
              className="mb-6"
            >
              Request Access
            </Button>
            
            <div className="flex items-center gap-4 justify-center mb-6">
              <div className="h-px bg-border flex-1 max-w-xs" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px bg-border flex-1 max-w-xs" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="cursor-pointer transition-all hover:scale-105 hover:shadow-xl border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Marcomms</CardTitle>
                  <CardDescription>
                    Marketing & Communications Portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access marketing tools, brand assets, and creative resources.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleSignInClick('marcomms')}
                  >
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="cursor-pointer transition-all hover:scale-105 hover:shadow-xl border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <CardTitle>HR</CardTitle>
                  <CardDescription>
                    Human Resources Portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage templates, customize content, and download materials.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleSignInClick('hr')}
                  >
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
