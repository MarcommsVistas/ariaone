import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Loader2, Minus, Plus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Slide {
  id: string;
  name: string;
  width: number;
  height: number;
  order_index: number;
  layers: any[];
}

export default function ReviewStudio() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [instance, setInstance] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [zoom, setZoom] = useState(80);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!instanceId) return;
    fetchData();
  }, [instanceId]);

  const fetchData = async () => {
    try {
      // Fetch instance
      const { data: instanceData, error: instanceError } = await supabase
        .from("template_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (instanceError) throw instanceError;
      setInstance(instanceData);

      // Fetch review
      const { data: reviewData, error: reviewError } = await supabase
        .from("creative_reviews")
        .select("*")
        .eq("instance_id", instanceId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reviewError) throw reviewError;
      setReview(reviewData);
      setReviewNotes(reviewData?.review_notes || "");

      // Fetch slides
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("*, layers(*)")
        .eq("instance_id", instanceId)
        .order("order_index", { ascending: true });

      if (slidesError) throw slidesError;

      // Map database properties to component interface
      const mappedSlides = slidesData?.map(slide => ({
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
          textTransform: layer.text_transform
        }))
      })) || [];

      setSlides(mappedSlides);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load submission data",
        variant: "destructive",
      });
      navigate("/v2/admin/reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLayerText = async (layerId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from("layers")
        .update({ text_content: newText })
        .eq("id", layerId);

      if (error) throw error;

      // Update local state
      setSlides(slides.map(slide => ({
        ...slide,
        layers: slide.layers.map(layer =>
          layer.id === layerId ? { ...layer, text: newText } : layer
        )
      })));

      toast({
        title: "Layer Updated",
        description: "Text content has been saved",
      });
    } catch (error) {
      console.error("Error updating layer:", error);
      toast({
        title: "Update Failed",
        description: "Could not save changes",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!review) return;
    setActionLoading("approve");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update review status
      const { error: reviewError } = await supabase
        .from("creative_reviews")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", review.id);

      if (reviewError) throw reviewError;

      // Mark instance as downloadable
      const { error: instanceError } = await supabase
        .from("template_instances")
        .update({ can_download: true })
        .eq("id", instanceId);

      if (instanceError) throw instanceError;

      // Notify HR user
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "review_approved",
          title: "Creative Approved!",
          message: `Your creative "${instance?.name}" has been approved and is ready for download`,
          data: { instanceId },
        });

      if (notifyError) console.error("Notification error:", notifyError);

      toast({
        title: "Creative Approved",
        description: "The HR team has been notified",
      });

      navigate("/v2/admin/reviews");
    } catch (error) {
      console.error("Error approving:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve creative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!review || !reviewNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide notes about what changes are needed",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("changes");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update review status
      const { error: reviewError } = await supabase
        .from("creative_reviews")
        .update({
          status: "changes_requested",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", review.id);

      if (reviewError) throw reviewError;

      // Notify HR user
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "changes_requested",
          title: "Changes Requested",
          message: `Changes have been requested for "${instance?.name}"`,
          data: { instanceId, notes: reviewNotes },
        });

      if (notifyError) console.error("Notification error:", notifyError);

      toast({
        title: "Changes Requested",
        description: "The HR team has been notified",
      });

      navigate("/v2/admin/reviews");
    } catch (error) {
      console.error("Error requesting changes:", error);
      toast({
        title: "Request Failed",
        description: "Failed to request changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setShowChangesDialog(false);
    }
  };

  const handleReject = async () => {
    if (!review || !reviewNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("reject");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update review status
      const { error: reviewError } = await supabase
        .from("creative_reviews")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", review.id);

      if (reviewError) throw reviewError;

      // Notify HR user
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "review_rejected",
          title: "Creative Rejected",
          message: `Your creative "${instance?.name}" has been rejected`,
          data: { instanceId, notes: reviewNotes },
        });

      if (notifyError) console.error("Notification error:", notifyError);

      toast({
        title: "Creative Rejected",
        description: "The HR team has been notified",
      });

      navigate("/v2/admin/reviews");
    } catch (error) {
      console.error("Error rejecting:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject creative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setShowRejectDialog(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 30));
  const handleZoomReset = () => setZoom(80);

  const currentSlide = slides[currentSlideIdx];
  const selectedLayer = currentSlide?.layers.find(l => l.id === selectedLayerId);
  const canGoPrevious = currentSlideIdx > 0;
  const canGoNext = currentSlideIdx < slides.length - 1;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading submission...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      
      {/* Top Toolbar */}
      <div className="border-b bg-panel">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/v2/admin/reviews")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Queue
            </Button>
            
            {instance && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{instance.name}</span>
                {instance.brand && (
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">
                    {instance.brand}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 30}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomReset}
              className="min-w-[70px]"
            >
              {zoom}%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-muted/30 overflow-auto flex items-center justify-center p-8">
            {currentSlide ? (
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                <SlideRenderer
                  slide={currentSlide}
                  interactive={true}
                  onLayerClick={(layerId) => setSelectedLayerId(layerId)}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No slides available
              </div>
            )}
          </div>

          {/* Slide Navigation Carousel */}
          {slides.length > 0 && (
            <div className="bg-panel border-t">
              <div className="flex items-center gap-3 px-4 py-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                  disabled={!canGoPrevious}
                  className="shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-2 min-w-min">
                    {slides.map((slide, index) => {
                      const isActive = index === currentSlideIdx;
                      const thumbnailScale = 60 / Math.max(slide.width, slide.height);

                      return (
                        <button
                          key={slide.id}
                          onClick={() => setCurrentSlideIdx(index)}
                          className={`
                            relative shrink-0 rounded-lg overflow-hidden transition-all cursor-pointer
                            ${isActive 
                              ? 'ring-2 ring-primary shadow-lg' 
                              : 'ring-1 ring-border hover:ring-primary/50'
                            }
                          `}
                          style={{
                            width: slide.width * thumbnailScale,
                            height: slide.height * thumbnailScale,
                          }}
                        >
                          <div 
                            className="absolute inset-0 bg-white"
                            style={{ transform: `scale(${thumbnailScale})`, transformOrigin: 'top left' }}
                          >
                            <SlideRenderer slide={slide} interactive={false} />
                          </div>
                          
                          <div className={`
                            absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                            ${isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background/80 text-foreground'
                            }
                          `}>
                            {index + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={!canGoNext}
                  className="shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <div className="text-xs text-muted-foreground shrink-0 min-w-[80px] text-right">
                  Slide {currentSlideIdx + 1} of {slides.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties & Review Actions */}
        <div className="w-80 border-l bg-panel overflow-auto">
          <div className="p-4 space-y-4">
            {/* Layer Properties */}
            {selectedLayer && selectedLayer.type === 'text' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Edit Text Layer</CardTitle>
                  <CardDescription className="text-xs">{selectedLayer.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="layer-text" className="text-xs">Text Content</Label>
                    <Textarea
                      id="layer-text"
                      value={selectedLayer.text || ''}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setSlides(slides.map(slide => ({
                          ...slide,
                          layers: slide.layers.map(layer =>
                            layer.id === selectedLayerId ? { ...layer, text: newText } : layer
                          )
                        })));
                      }}
                      onBlur={() => updateLayerText(selectedLayerId!, selectedLayer.text || '')}
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                  
                  <Button
                    onClick={() => setSelectedLayerId(null)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Done Editing
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Instance Info */}
            {instance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {instance.job_description && (
                    <>
                      <div>
                        <span className="font-medium">Job Title: </span>
                        <span className="text-muted-foreground">
                          {instance.job_description.title}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Location: </span>
                        <span className="text-muted-foreground">
                          {instance.job_description.location}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="font-medium">Status: </span>
                    <span className="text-muted-foreground capitalize">
                      {review?.status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Review Actions</CardTitle>
                <CardDescription className="text-xs">
                  Approve, request changes, or reject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs">Review Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add feedback or notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleApprove}
                    disabled={!!actionLoading}
                    className="w-full gap-2"
                    size="sm"
                  >
                    {actionLoading === "approve" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setShowChangesDialog(true)}
                    disabled={!!actionLoading}
                    variant="outline"
                    className="w-full gap-2"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request Changes
                  </Button>

                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={!!actionLoading}
                    variant="destructive"
                    className="w-full gap-2"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The HR team will be notified and can make revisions based on your feedback.
              {!reviewNotes.trim() && (
                <span className="block mt-2 text-destructive">
                  Please add notes explaining what changes are needed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestChanges}
              disabled={!reviewNotes.trim() || actionLoading === "changes"}
            >
              {actionLoading === "changes" ? "Requesting..." : "Request Changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will notify the HR team that their submission has been rejected.
              {!reviewNotes.trim() && (
                <span className="block mt-2 text-destructive">
                  Please add notes explaining the reason for rejection.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!reviewNotes.trim() || actionLoading === "reject"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === "reject" ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
