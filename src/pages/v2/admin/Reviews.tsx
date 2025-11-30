import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { ReviewCard } from "@/components/v2/ReviewCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClipboardList, Trash2, Grid3x3, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  instance_id: string;
  submitted_by: string;
  submitted_by_email: string;
  submitted_at: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  deletion_requested: boolean | null;
  deletion_requested_at: string | null;
  deletion_request_notes: string | null;
  template_instances: {
    name: string;
    brand: string | null;
    category: string | null;
    job_description_parsed: any;
  } | null;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showDeletionOnly, setShowDeletionOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creative_reviews'
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.rpc('get_reviews_with_emails');

      if (error) throw error;
      
      // Map the response to match the Review interface
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        template_instances: item.template_instances as any
      }));
      
      setReviews(mappedData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const filteredReviews = reviews.filter(review => {
    if (showDeletionOnly) return review.deletion_requested;
    if (activeTab === "all") return true;
    return review.status === activeTab;
  });

  const deletionRequestCount = reviews.filter(r => r.deletion_requested).length;

  const reviewCounts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    changes_requested: reviews.filter(r => r.status === "changes_requested").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <NavigationV2 />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Review Queue</h1>
            </div>
            <p className="text-muted-foreground">
              Review and approve AI-generated creative submissions from the HR team
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v);
              setShowDeletionOnly(false);
            }} className="flex-1">
              <TabsList>
                <TabsTrigger value="all">
                  All ({reviewCounts.all})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({reviewCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({reviewCounts.approved})
                </TabsTrigger>
                <TabsTrigger value="changes_requested">
                  Changes Requested ({reviewCounts.changes_requested})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({reviewCounts.rejected})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3x3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              variant={showDeletionOnly ? "default" : deletionRequestCount > 0 ? "destructive" : "outline"}
              size="sm"
              onClick={() => setShowDeletionOnly(!showDeletionOnly)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletion Requests ({deletionRequestCount})
            </Button>
          </div>
          
          <Tabs value={activeTab}>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredReviews.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-3">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      {activeTab === "pending" 
                        ? "No pending reviews at the moment" 
                        : `No ${activeTab.replace('_', ' ')} reviews`}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                viewMode={viewMode}
                onReview={(instanceId) => navigate(`/v2/admin/review/${instanceId}`)}
              />
            ))}
          </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
