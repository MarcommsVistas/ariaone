import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Send, Loader2, CheckCircle, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SlideRenderer } from "@/components/editor/SlideRenderer";

interface Slide {
  id: string;
  name: string;
  width: number;
  height: number;
  order_index: number;
  layers: any[];
}

export default function Preview() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [instance, setInstance] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoadingInstance, setIsLoadingInstance] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!instanceId) return;
    fetchInstanceData();
  }, [instanceId]);

  const fetchInstanceData = async () => {
    try {
      console.log("Fetching instance data for:", instanceId);
      
      const { data: instanceData, error: instanceError } = await supabase
        .from("template_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (instanceError) {
        console.error("Instance fetch error:", instanceError);
        throw instanceError;
      }

      if (!instanceData) {
        throw new Error("Instance not found");
      }

      console.log("Instance data loaded:", instanceData);
      setInstance(instanceData);
      setCaption(instanceData.caption_copy || "");

      // Check if AI generation already happened
      if (instanceData.ai_generated) {
        console.log("AI already generated, loading slides...");
        setGenerationComplete(true);
        await fetchSlides();
      } else {
        console.log("AI not generated yet, triggering generation...");
        // Start AI generation
        await generateContent();
      }
    } catch (error) {
      console.error("Error fetching instance:", error);
      
      let errorMessage = "Failed to load creative data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setGenerationError(errorMessage);
    } finally {
      setIsLoadingInstance(false);
    }
  };

  const fetchSlides = async () => {
    try {
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("*, layers(*)")
        .eq("instance_id", instanceId)
        .order("order_index", { ascending: true });

      if (slidesError) throw slidesError;
      setSlides(slidesData || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
    }
  };

  const generateContent = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log("Invoking generate-creative function for instance:", instanceId);
      
      const { data, error } = await supabase.functions.invoke("generate-creative", {
        body: { instanceId },
      });

      console.log("Generate-creative response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Edge function call failed");
      }

      if (data?.error) {
        console.error("Edge function returned error:", data.error);
        throw new Error(data.error);
      }

      console.log("AI generation completed successfully");
      
      toast({
        title: "AI Generation Complete",
        description: `Generated content for ${data.updatedLayers || 0} layers`,
      });

      setCaption(data.caption || "");
      setGenerationComplete(true);
      await fetchSlides();
    } catch (error) {
      console.error("Error generating content:", error);
      
      let errorMessage = "Failed to generate AI content. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const anyError = error as any;
        if (anyError.message) {
          errorMessage = anyError.message;
        }
      }
      
      setGenerationError(errorMessage);
      
      toast({
        title: "AI Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create review entry
      const { error: reviewError } = await supabase
        .from("creative_reviews")
        .insert({
          instance_id: instanceId,
          submitted_by: user.id,
          status: "pending",
        });

      if (reviewError) throw reviewError;

      // Create notification for marcomms team
      const { data: marcommsUsers, error: marcommsError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "marcomms");

      if (!marcommsError && marcommsUsers) {
        const notifications = marcommsUsers.map(u => ({
          user_id: u.user_id,
          type: "review_submitted",
          title: "New Creative Submitted",
          message: `${instance?.name || 'A new creative'} has been submitted for review`,
          data: { instanceId },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({
        title: "Submitted for Review",
        description: "Your creative has been sent to the admin team for review",
      });

      navigate("/v2");
    } catch (error) {
      console.error("Error submitting for review:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit for review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({ title: "Success", description: "Caption copied to clipboard" });
  };

  // Show loading state while loading instance or generating
  if (isLoadingInstance || (isGenerating && !generationError) || (!generationComplete && !generationError && !instance?.ai_generated)) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <CardTitle>
                  {isLoadingInstance ? "Loading Creative..." : "Generating Creative Content"}
                </CardTitle>
              </div>
              <CardDescription>
                {isLoadingInstance 
                  ? "Please wait while we load your creative data..."
                  : "Our AI is crafting professional content based on your job description..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Analyzing job description</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Generating headlines</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Creating descriptions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Finalizing content</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This usually takes 10-20 seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state if generation failed
  if (generationError) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">{generationError}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate("/v2")}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => {
                    setGenerationError(null);
                    generateContent();
                  }}>
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/v2")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <Button
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="gap-2"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>

          {/* Success Banner */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">AI Generation Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    Review the generated content below. When you're satisfied, submit it for admin approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instance Info */}
          {instance && (
            <Card>
              <CardHeader>
                <CardTitle>{instance.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {instance.brand && (
                    <span className="px-3 py-1 rounded-full bg-muted text-sm">
                      {instance.brand}
                    </span>
                  )}
                  {instance.category && (
                    <span className="px-3 py-1 rounded-full bg-muted text-sm">
                      {instance.category}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              {instance.job_description && (
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Job Title</p>
                    <p className="text-sm text-muted-foreground">
                      {instance.job_description.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {instance.job_description.location}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Caption */}
          {caption && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Caption</CardTitle>
                <CardDescription>AI-generated caption for your creative</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">{caption}</p>
                <Button variant="outline" size="sm" onClick={handleCopyCaption}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Caption
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Slides Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Generated Creative</h2>
            {slides.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  No slides found
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {slides.map((slide, index) => (
                  <Card key={slide.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Slide {index + 1}: {slide.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <SlideRenderer
                          slide={slide}
                          interactive={false}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
