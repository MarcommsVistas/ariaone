import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
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
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
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
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/v2/admin/reviews")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Queue
            </Button>
          </div>

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
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {review?.status?.replace('_', ' ') || 'Pending'}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Slides Preview */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-semibold">Creative Preview</h2>
              {slides.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground">
                    No slides found
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {slides.map((slide, index) => (
                    <Card key={slide.id} className="overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Slide {index + 1}: {slide.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <SlideRenderer slide={slide} interactive={false} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Review Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                  <CardDescription>
                    Approve, request changes, or reject this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Review Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add feedback or notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleApprove}
                      disabled={!!actionLoading}
                      className="w-full gap-2"
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
                    >
                      <MessageSquare className="h-4 w-4" />
                      Request Changes
                    </Button>

                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      disabled={!!actionLoading}
                      variant="destructive"
                      className="w-full gap-2"
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
