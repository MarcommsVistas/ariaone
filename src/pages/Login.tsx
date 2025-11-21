import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';

const Login = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = (role: 'marcomms' | 'hr') => {
    const displayName = name.trim() || (role === 'marcomms' ? 'Marcomms User' : 'HR User');
    login(role, displayName);
    navigate('/');
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
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Layers className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Aria-One</h1>
          </div>
          <p className="text-muted-foreground text-lg">Sign in to continue</p>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Enter your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-md mx-auto"
          />
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
                  onClick={() => handleLogin('marcomms')}
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
                  onClick={() => handleLogin('hr')}
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
      </motion.div>
    </div>
  );
};

export default Login;
