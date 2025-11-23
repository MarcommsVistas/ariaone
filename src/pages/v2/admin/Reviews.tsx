import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { InstanceThumbnail } from "@/components/v2/InstanceThumbnail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  instance_id: string;
  submitted_by: string;
  submitted_at: string;
  status: string;
  review_notes: string | null;
  template_instances: {
    name: string;
    brand: string | null;
    category: string | null;
    job_description: any;
  };
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
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
      const { data, error } = await supabase
        .from("creative_reviews")
        .select(`
          *,
          template_instances (
            name,
            brand,
            category,
            job_description
          )
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "changes_requested":
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Changes Requested</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (activeTab === "all") return true;
    return review.status === activeTab;
  });

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <InstanceThumbnail instanceId={review.instance_id} />
                <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {review.template_instances?.name || "Untitled"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {review.template_instances?.brand && (
                                <span className="px-2 py-1 rounded-full bg-muted text-xs">
                                  {review.template_instances.brand}
                                </span>
                              )}
                              {review.template_instances?.category && (
                                <span className="px-2 py-1 rounded-full bg-muted text-xs">
                                  {review.template_instances.category}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          {getStatusBadge(review.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {review.template_instances?.job_description && (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Job Title: </span>
                              <span className="text-muted-foreground">
                                {review.template_instances.job_description.title}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Location: </span>
                              <span className="text-muted-foreground">
                                {review.template_instances.job_description.location}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Submitted {new Date(review.submitted_at).toLocaleDateString()} at{" "}
                          {new Date(review.submitted_at).toLocaleTimeString()}
                        </div>

                        {review.review_notes && (
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Review Notes:</p>
                            <p className="text-muted-foreground">{review.review_notes}</p>
                          </div>
                        )}

                        <Button
                          onClick={() => navigate(`/v2/admin/review/${review.instance_id}`)}
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review Submission
                        </Button>
                      </CardContent>
                    </Card>
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
