import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import ariaOneLogo from '@/assets/aria-one-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const openModal = (role: UserRole) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleAuth = async () => {
    if (!email || !password || !selectedRole) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) throw signUpError;

        const user = authData.user;

        if (user) {
          // Ensure user has a role
          const { data: existingRoles, error: fetchRoleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (fetchRoleError) throw fetchRoleError;

          if (!existingRoles || existingRoles.length === 0) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: user.id, role: selectedRole });

            if (roleError) throw roleError;
          }

          toast({
            title: "Success",
            description: "Account created successfully!",
          });
          navigate('/');
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const user = signInData.user;

        if (user) {
          const { data: existingRoles, error: fetchRoleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (fetchRoleError) throw fetchRoleError;

          if (!existingRoles || existingRoles.length === 0) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: user.id, role: selectedRole });

            if (roleError) throw roleError;
          }
        }

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        setIsModalOpen(false);
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={ariaOneLogo} alt="Aria-One" className="h-16" />
          </div>
          <p className="text-muted-foreground text-lg">
            Comms Automation | Version 1.1
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Marcomms</CardTitle>
                <CardDescription className="text-base">
                  Full access to Admin Studio and HR Interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Create and edit templates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Access Admin Studio
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    View HR Interface
                  </li>
                </ul>
                <Button
                  onClick={() => openModal('marcomms')}
                  className="w-full"
                  size="lg"
                >
                  Sign in as Marcomms
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/70 transition-colors">
                  <Users className="w-8 h-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl">HR</CardTitle>
                <CardDescription className="text-base">
                  Access HR Interface to use templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Browse templates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Edit content
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Export final designs
                  </li>
                </ul>
                <Button
                  onClick={() => openModal('hr')}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  Sign in as HR
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Request Account"}
          </Button>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSignUp ? 'Create your account' : 'Sign in'} as {selectedRole === 'marcomms' ? 'Marcomms' : 'HR'}
            </DialogTitle>
            <DialogDescription>
              {isSignUp ? 'Enter your details to create an account' : 'Enter your credentials to sign in'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
            <Button
              onClick={handleAuth}
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Sign in')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
