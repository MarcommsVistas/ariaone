import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTemplateStore } from "@/store/useTemplateStore";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Loader2, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { InteractionOverlay } from "@/components/editor/InteractionOverlay";
import { PropertyPanel } from "@/components/admin/PropertyPanel";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [zoom, setZoom] = useState(80);
  const [captionApproved, setCaptionApproved] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [isJdOpen, setIsJdOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { setSelectedLayer, selectedLayer, updateLayer, setCurrentSlide } = useTemplateStore();

  useEffect(() => {
    if (!instanceId) return;
    fetchData();
  }, [instanceId]);

  // Sync selected layer with store when slides or currentSlideIdx changes
  useEffect(() => {
    const currentSlide = slides[currentSlideIdx];
    if (currentSlide) {
      setCurrentSlide(currentSlide.id);
    }
  }, [currentSlideIdx, slides, setCurrentSlide]);

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
      setEditedCaption(instanceData.caption_copy || "");

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
          textTransform: layer.text_transform,
          aiEditable: layer.ai_editable,
          aiContentType: layer.ai_content_type,
          aiPromptTemplate: layer.ai_prompt_template,
          hrVisible: layer.hr_visible,
          hrEditable: layer.hr_editable,
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

  // Update layer property and save to database
  const updateLayerProperty = async (layerId: string, updates: any) => {
    try {
      // Map frontend properties to database columns
      const dbUpdates: any = {};
      if ('text' in updates) dbUpdates.text_content = updates.text;
      if ('x' in updates) dbUpdates.x = updates.x;
      if ('y' in updates) dbUpdates.y = updates.y;
      if ('width' in updates) dbUpdates.width = updates.width;
      if ('height' in updates) dbUpdates.height = updates.height;
      if ('rotation' in updates) dbUpdates.rotation = updates.rotation;
      if ('opacity' in updates) dbUpdates.opacity = updates.opacity;
      if ('fontFamily' in updates) dbUpdates.font_family = updates.fontFamily;
      if ('fontSize' in updates) dbUpdates.font_size = updates.fontSize;
      if ('fontWeight' in updates) dbUpdates.font_weight = updates.fontWeight;
      if ('color' in updates) dbUpdates.color = updates.color;
      if ('align' in updates) dbUpdates.text_align = updates.align;
      if ('lineHeight' in updates) dbUpdates.line_height = updates.lineHeight;
      if ('letterSpacing' in updates) dbUpdates.letter_spacing = updates.letterSpacing;
      if ('textTransform' in updates) dbUpdates.text_transform = updates.textTransform;

      const { error } = await supabase
        .from("layers")
        .update(dbUpdates)
        .eq("id", layerId);

      if (error) throw error;

      // Update local state
      setSlides(slides.map(slide => ({
        ...slide,
        layers: slide.layers.map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      })));
    } catch (error) {
      console.error("Error updating layer:", error);
      toast({
        title: "Update Failed",
        description: "Could not save changes",
        variant: "destructive",
      });
    }
  };

  // Override the store's updateLayer to use our function
  useEffect(() => {
    const originalUpdateLayer = updateLayer;
    (window as any).reviewStudioUpdateLayer = updateLayerProperty;
    return () => {
      delete (window as any).reviewStudioUpdateLayer;
    };
  }, [slides, updateLayerProperty]);

  const handleApprove = async () => {
    if (!review) return;
    if (!captionApproved) {
      toast({
        title: "Caption Not Approved",
        description: "Please review and approve the caption before approving the creative",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("approve");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update caption if edited
      if (editedCaption !== instance.caption_copy) {
        await supabase
          .from("template_instances")
          .update({ caption_copy: editedCaption })
          .eq("id", instanceId);
      }

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
      await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "review_approved",
          title: "Creative Approved!",
          message: `Your creative "${instance?.name}" has been approved and is ready for download`,
          data: { instanceId },
        });

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

      await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "changes_requested",
          title: "Changes Requested",
          message: `Changes have been requested for "${instance?.name}"`,
          data: { instanceId, notes: reviewNotes },
        });

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

      await supabase
        .from("notifications")
        .insert({
          user_id: review.submitted_by,
          type: "review_rejected",
          title: "Creative Rejected",
          message: `Your creative "${instance?.name}" has been rejected`,
          data: { instanceId, notes: reviewNotes },
        });

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

  const currentSlide = slides[currentSlideIdx];
  const jobDescription = instance?.job_description;

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
        <div className="px-6 py-3 flex items-center justify-between">
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
        {/* Left Sidebar - Job Description & Caption Review */}
        <div className="w-[400px] bg-panel border-r overflow-auto flex-shrink-0">
          <div className="p-6 space-y-6">
            {/* Job Description */}
            {jobDescription && (
              <Collapsible open={isJdOpen} onOpenChange={setIsJdOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Job Description</CardTitle>
                        {isJdOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm font-medium mt-1">{jobDescription.title}</p>
                      </div>
                      {jobDescription.location && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Location</Label>
                          <p className="text-sm mt-1">{jobDescription.location}</p>
                        </div>
                      )}
                      {jobDescription.description && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{jobDescription.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Caption Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generated Caption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Textarea
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="min-h-[100px] text-sm"
                    placeholder="No caption generated"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {editedCaption.length} characters
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="caption-approved"
                    checked={captionApproved}
                    onCheckedChange={(checked) => setCaptionApproved(checked as boolean)}
                  />
                  <Label htmlFor="caption-approved" className="text-sm font-medium cursor-pointer">
                    Caption Approved
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Review Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for the HR team..."
                  className="min-h-[100px] text-sm"
                />
              </CardContent>
            </Card>

            {/* Review Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleApprove}
                disabled={actionLoading !== null || !captionApproved}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading === "approve" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Creative
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowChangesDialog(true)}
                disabled={actionLoading !== null}
                variant="outline"
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Changes
              </Button>

              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading !== null}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slide Carousel */}
          {slides.length > 0 && (
            <div className="bg-panel border-b p-4">
              <div className="flex gap-3 overflow-x-auto">
                {slides.map((slide, index) => {
                  const isActive = index === currentSlideIdx;
                  const thumbnailScale = 80 / Math.max(slide.width, slide.height);

                  return (
                    <button
                      key={slide.id}
                      onClick={() => {
                        setCurrentSlideIdx(index);
                        setSelectedLayer(null);
                      }}
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
          )}

          {/* Interactive Canvas */}
          <div className="flex-1 bg-muted/30 overflow-auto flex items-center justify-center p-8">
            {currentSlide ? (
              <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                <div className="relative">
                  <SlideRenderer
                    slide={currentSlide}
                    interactive={false}
                  />
                  <InteractionOverlay 
                    slideWidth={currentSlide.width}
                    slideHeight={currentSlide.height}
                    scale={zoom / 100}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No slides available
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Property Panel */}
        <div className="w-[350px] flex-shrink-0">
          <PropertyPanel />
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request changes? The HR team will be notified with your review notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestChanges}>
              {actionLoading === "changes" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Requesting...
                </>
              ) : (
                "Request Changes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Creative</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this creative? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
              {actionLoading === "reject" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
