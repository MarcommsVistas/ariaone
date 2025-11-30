import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { JobDescriptionForm } from "@/components/v2/JobDescriptionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
}

export default function Generate() {
  const { templateId } = useParams<{ templateId: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!templateId) return;

    const fetchTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("id, name, brand, category")
          .eq("id", templateId)
          .eq("is_published", true)
          .single();

        if (error) throw error;
        if (!data) {
          toast({
            title: "Template not found",
            description: "The template you're looking for doesn't exist or is not published.",
            variant: "destructive",
          });
          navigate("/v2");
          return;
        }

        setTemplate(data);
      } catch (error) {
        console.error("Error fetching template:", error);
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
        navigate("/v2");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/v2")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </div>

          {/* Template Info Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {template.brand && (
                      <span className="px-3 py-1 rounded-full bg-background border border-border text-sm">
                        {template.brand}
                      </span>
                    )}
                    {template.category && (
                      <span className="px-3 py-1 rounded-full bg-background border border-border text-sm">
                        {template.category}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">AI-Powered Generation</p>
                  <p className="text-sm text-muted-foreground">
                    Fill in the job details below and our AI will automatically generate 
                    professional creative content tailored to your requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description Form */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Enter the job information. All fields are required for AI generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobDescriptionForm 
                templateId={template.id} 
                templateName={template.name}
                brand={template.brand}
                category={template.category}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
