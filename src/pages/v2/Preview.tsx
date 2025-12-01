import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { useExport } from "@/hooks/useExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, DownloadCloud, Send, Copy, Sparkles, Minus, Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { GenerationProgress } from "@/components/v2/GenerationProgress";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Slide {
  id: string;
  name: string;
  width: number;
  height: number;
  order_index: number;
  layers: any[];
}

export default function Preview() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exportAsImage, exportAllSlides, isExporting } = useExport();
  
  const [instance, setInstance] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(80);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{
    phase: 'structure' | 'parsing' | 'population' | 'complete';
    message: string;
    percentage: number;
    details?: string;
  } | null>(null);

  useEffect(() => {
    if (instanceId) {
      fetchInstanceData();
    }
  }, [instanceId]);

  // Subscribe to realtime updates for generation progress
  useEffect(() => {
    if (!instanceId || !isGenerating) return;

    let channel: RealtimeChannel | null = null;

    const subscribeToProgress = async () => {
      channel = supabase
        .channel(`instance-progress-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'template_instances',
            filter: `id=eq.${instanceId}`,
          },
          (payload) => {
            const progress = payload.new.generation_progress;
            if (progress) {
              console.log('[Preview] Progress update:', progress);
              setGenerationProgress(progress);
              
              // If generation is complete, fetch slides
              if (progress.phase === 'complete') {
                setTimeout(() => {
                  fetchSlides().then(slidesData => {
                    setSlides(slidesData);
                    setIsGenerating(false);
                    setGenerationProgress(null);
                  });
                }, 1000);
              }
            }
          }
        )
        .subscribe();
    };

    subscribeToProgress();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [instanceId, isGenerating]);

  const fetchInstanceData = async () => {
    try {
      setLoading(true);

      const { data: instanceData, error: instanceError } = await supabase
        .from("template_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (instanceError) throw instanceError;

      setInstance(instanceData);

      // Fetch review status
      const { data: reviewData } = await supabase
        .from("creative_reviews")
        .select("status")
        .eq("instance_id", instanceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (reviewData) {
        setReviewStatus(reviewData.status);
      }

      // Check if AI generation already happened
      if (instanceData.ai_generated) {
        const slidesData = await fetchSlides();
        setSlides(slidesData);
      } else {
        // Start AI generation
        await generateContent();
      }
    } catch (error: any) {
      console.error("Error fetching instance:", error);
      toast({
        title: "Error",
        description: "Failed to load creative preview",
        variant: "destructive",
      });
      setGenerationError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlides = async (): Promise<Slide[]> => {
    const { data: slidesData, error } = await supabase
      .from("slides")
      .select("*, layers(*)")
      .eq("instance_id", instanceId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return slidesData?.map(slide => ({
      ...slide,
      layers: slide.layers.map((layer: any) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        text: layer.text_content,
        src: layer.image_src,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        opacity: layer.opacity,
        rotation: layer.rotation,
        visible: layer.visible,
        locked: layer.locked,
        zIndex: layer.z_index,
        fontFamily: layer.font_family,
        fontSize: layer.font_size,
        fontWeight: layer.font_weight,
        color: layer.color,
        align: layer.text_align,
        lineHeight: layer.line_height,
        letterSpacing: layer.letter_spacing,
        textTransform: layer.text_transform,
      }))
    })) || [];
  };

  const generateContent = async (retryCount = 0) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log(`[Preview] Starting AI generation (attempt ${retryCount + 1})...`);
      
      // Add timeout wrapper for edge function call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Generation timeout - please try again')), 120000); // 2 min timeout
      });

      const invocationPromise = supabase.functions.invoke("generate-creative", {
        body: { instanceId },
      });

      const { data, error } = await Promise.race([
        invocationPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('[Preview] Edge function error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('[Preview] Generation error:', data.error);
        throw new Error(data.error);
      }

      console.log('[Preview] AI generation successful:', data);

      toast({
        title: "AI Generation Complete",
        description: `Generated content for ${data.updated_layers || 0} layers`,
      });

      const slidesData = await fetchSlides();
      setSlides(slidesData);
    } catch (error: any) {
      console.error("[Preview] Error generating content:", error);
      
      // Check if it's a timeout or database error
      const isTimeout = error.message?.includes('timeout');
      const isDbError = error.message?.includes('database') || error.message?.includes('statement timeout');
      
      let errorMessage = error.message || "Failed to generate AI content";
      
      if (isTimeout || isDbError) {
        errorMessage = "Generation is taking longer than expected. This may be due to database load. Please try again.";
        
        // Auto-retry once for timeouts
        if (retryCount < 1) {
          console.log('[Preview] Auto-retrying after timeout...');
          setTimeout(() => generateContent(retryCount + 1), 2000);
          return;
        }
      }
      
      setGenerationError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCurrent = () => {
    if (slides.length === 0) return;
    exportAsImage('preview-canvas', slides[currentSlideIdx].name, 'jpeg', 0.95);
  };

  const handleExportAll = async () => {
    if (!instance || slides.length === 0) return;

    await exportAllSlides(
      slides.map(s => ({ id: s.id, name: s.name })),
      async (slideId) => {
        const slideIndex = slides.findIndex(s => s.id === slideId);
        setCurrentSlideIdx(slideIndex);
      },
      'preview-canvas',
      instance.name,
      'jpeg',
      0.95
    );
  };

  const handleSubmitForReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit for review",
          variant: "destructive",
        });
        return;
      }

      const { data: review, error: reviewError } = await supabase
        .from("creative_reviews")
        .insert({
          instance_id: instanceId!,
          submitted_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      const { data: marcommsUsers, error: usersError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "marcomms");

      if (!usersError && marcommsUsers) {
        const notifications = marcommsUsers.map((user) => ({
          user_id: user.user_id,
          type: "review_submission",
          title: "New Creative Review",
          message: `${instance?.name || "A new creative"} has been submitted for review`,
          data: { reviewId: review.id, instanceId: instanceId },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({
        title: "Submitted for Review",
        description: "Your creative has been sent to the marcomms team",
      });

      navigate("/v2");
    } catch (error: any) {
      console.error("Error submitting for review:", error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyCaption = () => {
    if (instance?.caption_copy) {
      navigator.clipboard.writeText(instance.caption_copy);
      toast({
        title: "Copied",
        description: "Caption copied to clipboard",
      });
    }
  };

  const currentSlide = slides[currentSlideIdx];

  // Calculate scale
  const containerPadding = 80;
  const availableWidth = window.innerWidth - 400 - containerPadding;
  const availableHeight = window.innerHeight - 64 - containerPadding;
  const baseScale = currentSlide
    ? Math.min(availableWidth / currentSlide.width, availableHeight / currentSlide.height, 1)
    : 0.5;

  const minZoom = 25;
  const maxZoom = 200;
  const effectiveScale = baseScale * (zoom / 100);

  const handleZoomIn = () => setZoom((z) => Math.min(maxZoom, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(minZoom, z - 10));
  const handleZoomReset = () => setZoom(100);

  const jobDesc = instance?.job_description as any;

  // Loading state during initial load or generation
  if (loading || isGenerating) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center p-4">
          {isGenerating ? (
            <GenerationProgress progress={generationProgress} />
          ) : (
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <CardTitle>Loading Creative...</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Fetching creative data...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (generationError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
                  <p className="text-sm text-muted-foreground">{generationError}</p>
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

  // No slides available
  if (!instance || slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Preview Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This creative doesn't have any slides yet.
              </p>
              <Button onClick={() => navigate("/v2")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Hidden export container - renders at 1:1 scale for accurate export */}
        {currentSlide && (
          <div 
            id="preview-canvas"
            className="absolute opacity-0 pointer-events-none"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: currentSlide.width,
              height: currentSlide.height,
            }}
          >
            <SlideRenderer slide={currentSlide} interactive={false} />
          </div>
        )}

      {/* Left Sidebar */}
      <div className="w-[400px] bg-panel border-r border-border overflow-y-auto flex-shrink-0">
          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm border-b border-border">
            <div className="h-14 flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{instance.name}</h3>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Caption - Moved above Job Details */}
            {instance.caption_copy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Social Caption
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCaption}
                      className="h-8 px-2"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {instance.caption_copy}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Job Details */}
            {jobDesc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Position</p>
                    <p className="font-medium">{jobDesc.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Location</p>
                    <p>{jobDesc.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Description</p>
                    <p className="text-muted-foreground">{jobDesc.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Toolbar */}
          <div className="h-14 border-b border-border flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/v2")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {slides.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isExporting}>
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCurrent}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Current Slide
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportAll}>
                      <DownloadCloud className="w-4 h-4 mr-2" />
                      Export All Slides (ZIP)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCurrent}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              )}

              {reviewStatus === 'approved' ? (
                <Button 
                  size="sm" 
                  onClick={handleExportCurrent}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              ) : reviewStatus === 'pending' ? (
                <Button size="sm" variant="outline" disabled>
                  Under Review
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmitForReview}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              )}
            </div>
          </div>

          {/* Slide Navigation Carousel */}
          {slides.length > 1 && (
            <div className="border-b bg-panel p-4">
              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentSlideIdx((i) => Math.max(0, i - 1))}
                  disabled={currentSlideIdx === 0}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex gap-2 overflow-x-auto max-w-3xl">
                  {slides.map((slide, idx) => {
                    const thumbnailScale = 0.08;
                    const isActive = idx === currentSlideIdx;
                    
                    return (
                      <button
                        key={slide.id}
                        onClick={() => setCurrentSlideIdx(idx)}
                        className={`
                          relative shrink-0 rounded-lg overflow-hidden transition-all
                          ${isActive 
                            ? 'ring-2 ring-primary shadow-lg' 
                            : 'ring-1 ring-border hover:ring-primary/50'}
                        `}
                        style={{
                          width: slide.width * thumbnailScale,
                          height: slide.height * thumbnailScale,
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            transform: `scale(${thumbnailScale})`,
                            transformOrigin: 'top left',
                            width: slide.width,
                            height: slide.height,
                          }}
                        >
                          <SlideRenderer slide={slide} interactive={false} />
                        </div>
                        {/* Slide number overlay */}
                        <div 
                          className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                            ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'}
                          `}
                        >
                          {idx + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                  disabled={currentSlideIdx === slides.length - 1}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        {/* Canvas */}
        <div className="flex-1 bg-canvas flex items-center justify-center overflow-auto px-8 pb-8 pt-4 relative">
            {currentSlide && (
              <>
                {/* Hidden export container - renders at 1:1 scale for accurate export */}
                <div 
                  id="preview-canvas"
                  className="absolute opacity-0 pointer-events-none"
                  style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: 0,
                    width: currentSlide.width,
                    height: currentSlide.height,
                  }}
                >
                  <SlideRenderer slide={currentSlide} interactive={false} />
                </div>

                {/* Visible canvas with zoom */}
                <div
                  className="relative"
                  style={{
                    width: currentSlide.width * baseScale,
                    height: currentSlide.height * baseScale,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <SlideRenderer slide={currentSlide} interactive={false} />
                  </div>
                </div>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-panel/95 border border-border rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm z-50">
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex items-center justify-center h-7 w-7 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="text-xs font-medium text-muted-foreground min-w-[52px] text-center hover:text-foreground transition-colors"
              >
                {Math.round(zoom)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex items-center justify-center h-7 w-7 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
