import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Plus, FileText, Clock, CheckCircle, AlertCircle, Settings, Layers, FolderOpen, Grid3x3, List, Trash2, XCircle, Eye, Filter, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { InstanceThumbnail } from "./InstanceThumbnail";
import { TemplateThumbnail } from "./TemplateThumbnail";
import { format } from "date-fns";

interface Template {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
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
  deletion_requested: boolean;
}

export const HRDashboardV2 = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<TemplateInstance[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time subscription for review updates
  useEffect(() => {
    const channel = supabase
      .channel('review-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creative_reviews'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch published templates for V2
      const { data: templatesData, error: templatesError } = await supabase
        .from("templates")
        .select("*")
        .eq("is_published", true)
        .order("updated_at", { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch user's V2 instances
      const { data: instancesData, error: instancesError } = await supabase
        .from("template_instances")
        .select("*")
        .eq("workflow_version", "v2")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (instancesError) throw instancesError;

      // Fetch reviews for instances - get only the most recent review per instance
      if (instancesData && instancesData.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("creative_reviews")
          .select("instance_id, status, review_notes, deletion_requested")
          .in("instance_id", instancesData.map(i => i.id))
          .order("submitted_at", { ascending: false });

        if (reviewsError) throw reviewsError;

        const reviewsMap: Record<string, Review> = {};
        reviewsData?.forEach(review => {
          // Only add if this instance doesn't already have a review (ensures we keep the most recent)
          if (!reviewsMap[review.instance_id]) {
            reviewsMap[review.instance_id] = {
              status: review.status,
              review_notes: review.review_notes,
              deletion_requested: review.deletion_requested || false
            };
          }
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

  // Extract unique brands from templates
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    templates.forEach(template => {
      if (template.brand) brandSet.add(template.brand);
    });
    return Array.from(brandSet).sort();
  }, [templates]);

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    templates.forEach(template => {
      if (template.category) categorySet.add(template.category);
    });
    return Array.from(categorySet).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.brand?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter(t => t.brand === selectedBrand);
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Sort templates
    if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "brand") {
      filtered = [...filtered].sort((a, b) => (a.brand || "").localeCompare(b.brand || ""));
    } else if (sortBy === "category") {
      filtered = [...filtered].sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }
    // "recent" is already sorted by updated_at from the database
    
    return filtered;
  }, [templates, searchQuery, selectedBrand, selectedCategory, sortBy]);

  const handleDeleteInstance = async (instanceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const review = reviews[instanceId];
    
    setDeletingInstanceId(instanceId);
    
    try {
      if (!review || review.status !== 'approved') {
        // Direct deletion
        const { error } = await supabase
          .from('template_instances')
          .delete()
          .eq('id', instanceId);

        if (error) throw error;

        toast({
          title: "Project Deleted",
          description: "Your project has been deleted successfully",
        });
        
        fetchData();
      } else {
        // Request deletion
        const { error } = await supabase
          .from('creative_reviews')
          .update({
            deletion_requested: true,
            deletion_requested_at: new Date().toISOString(),
          })
          .eq('instance_id', instanceId);

        if (error) throw error;

        // Log audit event
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_audit_event', {
            _instance_id: instanceId,
            _event_type: 'deletion_requested',
            _event_category: 'deletion',
            _performed_by: user.id,
            _metadata: { reason: 'Requested by HR user' }
          });
        }

        // Notify marcomms
        const { data: marcommsUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'marcomms');

        if (marcommsUsers) {
          const notifications = marcommsUsers.map(u => ({
            user_id: u.user_id,
            type: 'deletion_request',
            title: 'Deletion Request',
            message: `HR user requested deletion of project "${instances.find(i => i.id === instanceId)?.name}"`,
            data: { instanceId },
          }));

          await supabase.from('notifications').insert(notifications);
        }

        toast({
          title: "Deletion Requested",
          description: "Your deletion request has been sent for approval",
        });
        
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeletingInstanceId(null);
    }
  };

  const getDeleteButton = (instance: TemplateInstance, review?: Review) => {
    const isDeleting = deletingInstanceId === instance.id;
    
    if (!review || review.status !== 'approved') {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => handleDeleteInstance(instance.id, e)}
          disabled={isDeleting}
          className="gap-1"
        >
          <Trash2 className="h-3 w-3" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      );
    } else if (review.deletion_requested) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-1 opacity-60"
        >
          <AlertCircle className="h-3 w-3" />
          Pending Deletion
        </Button>
      );
    } else {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => handleDeleteInstance(instance.id, e)}
          disabled={isDeleting}
          className="gap-1"
        >
          <Trash2 className="h-3 w-3" />
          {isDeleting ? "Submitting..." : "Request Deletion"}
        </Button>
      );
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "changes_requested":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
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
            <div>
              <h1 className="text-3xl font-bold">AI-Powered Creative Studio</h1>
              <p className="text-muted-foreground">
                Generate job advertisements in seconds with AI assistance
              </p>
            </div>
          </div>
          {userRole === "marcomms" && (
            <Button variant="outline" onClick={() => navigate("/v2/admin/brand-voice")}>
              <Settings className="h-4 w-4 mr-2" />
              Brand Voice Manager
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="templates" className="gap-2">
            <Layers className="w-4 h-4" />
            Available Templates
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            My Projects
            {instances.length > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {instances.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Available Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Browse Templates</h2>
          
          {/* Filters */}
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Brand Filter */}
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedBrand !== "all" || selectedCategory !== "all"
                    ? "No templates match your filters"
                    : "No templates available yet"}
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
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-2">
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
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Updated {format(new Date(template.updated_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
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
        </TabsContent>

        {/* My Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Projects</h2>
            {instances.length > 0 && (
              <ToggleGroup 
                type="single" 
                value={projectViewMode} 
                onValueChange={(value) => value && setProjectViewMode(value as "grid" | "list")}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <Grid3x3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          
          {instances.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-3">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-lg mb-2">
                  You haven't created any projects yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Browse templates to get started
                </p>
              </div>
            </Card>
          ) : projectViewMode === "grid" ? (
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
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/v2/preview/${instance.id}`);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {getDeleteButton(instance, review)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => {
                const review = reviews[instance.id];
                return (
                  <Card 
                    key={instance.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/v2/preview/${instance.id}`)}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-32 h-20 flex-shrink-0">
                        <InstanceThumbnail instanceId={instance.id} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg truncate">{instance.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {instance.brand && (
                                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                                  {instance.brand}
                                </span>
                              )}
                              {instance.category && (
                                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                                  {instance.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusIcon(review?.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{getStatusText(review?.status)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(instance.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {review?.review_notes && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
                            {review.review_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/v2/preview/${instance.id}`)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {getDeleteButton(instance, review)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
