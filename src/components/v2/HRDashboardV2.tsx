import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, Plus, FileText, Clock, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { InstanceThumbnail } from "./InstanceThumbnail";
import { TemplateThumbnail } from "./TemplateThumbnail";

interface Template {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  created_at: string;
}

interface TemplateInstance {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  created_at: string;
  job_description: any;
  ai_generated: boolean;
  can_download: boolean;
}

interface Review {
  status: string;
  review_notes: string | null;
}

export const HRDashboardV2 = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<TemplateInstance[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch published templates for V2
      const { data: templatesData, error: templatesError } = await supabase
        .from("templates")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch user's V2 instances
      const { data: instancesData, error: instancesError } = await supabase
        .from("template_instances")
        .select("*")
        .eq("workflow_version", "v2")
        .order("updated_at", { ascending: false });

      if (instancesError) throw instancesError;

      // Fetch reviews for instances
      if (instancesData && instancesData.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("creative_reviews")
          .select("instance_id, status, review_notes")
          .in("instance_id", instancesData.map(i => i.id));

        if (reviewsError) throw reviewsError;

        const reviewsMap: Record<string, Review> = {};
        reviewsData?.forEach(review => {
          reviewsMap[review.instance_id] = {
            status: review.status,
            review_notes: review.review_notes
          };
        });
        setReviews(reviewsMap);
      }

      setTemplates(templatesData || []);
      setInstances(instancesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "changes_requested":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "changes_requested":
        return "Changes Requested";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Under Review";
      default:
        return "Draft";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI-Powered Creative Studio</h1>
          </div>
          {userRole === "marcomms" && (
            <Button variant="outline" onClick={() => navigate("/v2/admin/brand-voice")}>
              <Settings className="h-4 w-4 mr-2" />
              Brand Voice Manager
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Generate job advertisements in seconds with AI assistance
        </p>
      </div>

      {/* My Projects Section */}
      {instances.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">My Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => {
              const review = reviews[instance.id];
              return (
                <Card key={instance.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <InstanceThumbnail instanceId={instance.id} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{instance.name}</CardTitle>
                      {getStatusIcon(review?.status)}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      {instance.brand && (
                        <span className="px-2 py-1 rounded-full bg-muted text-xs">
                          {instance.brand}
                        </span>
                      )}
                      {instance.category && (
                        <span className="px-2 py-1 rounded-full bg-muted text-xs">
                          {instance.category}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{getStatusText(review?.status)}</span>
                    </div>
                    {review?.review_notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.review_notes}
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/v2/preview/${instance.id}`)}
                    >
                      View Project
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Templates Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Available Templates</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                {searchQuery ? "No templates found" : "No templates available yet"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <TemplateThumbnail templateId={template.id} />
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {template.brand && (
                      <span className="px-2 py-1 rounded-full bg-muted text-xs">
                        {template.brand}
                      </span>
                    )}
                    {template.category && (
                      <span className="px-2 py-1 rounded-full bg-muted text-xs">
                        {template.category}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gap-2" onClick={() => navigate(`/v2/generate/${template.id}`)}>
                    <Plus className="h-4 w-4" />
                    Generate Creative
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
