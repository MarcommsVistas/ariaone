import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserRole } from "@/store/useAuthStore";
import { Building2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestAccessDialog = ({ open, onOpenChange }: RequestAccessDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!email || !selectedRole) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: Implement email sending via edge function
    // For now, just show success message
    setTimeout(() => {
      toast({
        title: "Access Request Submitted!",
        description: "You'll receive credentials once your request is approved.",
      });
      setIsSubmitting(false);
      onOpenChange(false);
      // Reset form
      setStep(1);
      setSelectedRole(null);
      setEmail("");
    }, 1000);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Access</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Select the role you need access for"
              : "Enter your official email address"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleRoleSelect("marcomms")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Marcomms</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Marketing & Communications
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleRoleSelect("hr")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">HR</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Human Resources
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Official Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Requesting access for: <span className="font-medium capitalize">{selectedRole}</span>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!email || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
