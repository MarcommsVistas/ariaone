import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTemplateStore } from "@/store/useTemplateStore";
import { TemplateCard } from "./TemplateCard";
import { MyProjectsCard } from "./MyProjectsCard";
import { Search, Layers, Filter, Tag, FolderOpen, Grid3x3, List } from "lucide-react";
import { toast } from "sonner";

export const HRDashboard = () => {
  const { 
    templates,
    instances,
    createInstanceFromTemplate,
    setCurrentInstance,
    deleteInstance,
    updateInstanceName,
    fetchTemplates,
    fetchUserInstances,
    subscribeToChanges, 
    unsubscribeFromChanges,
    isLoading 
  } = useTemplateStore();
  
  // Browse Templates tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // My Projects tab state
  const [projectSearch, setProjectSearch] = useState("");
  const [projectBrand, setProjectBrand] = useState<string>("all");
  const [projectCategory, setProjectCategory] = useState<string>("all");
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "list">("grid");
  
  // Fetch templates and subscribe to changes on mount
  useEffect(() => {
    fetchTemplates();
    fetchUserInstances();
    subscribeToChanges();
    
    return () => {
      unsubscribeFromChanges();
    };
  }, []);
  
  // Only show saved templates
  const savedTemplates = templates.filter(t => t.saved);

  // Map templates to their most recent instances
  const templateInstanceMap = useMemo(() => {
    const map = new Map<string, typeof instances[0]>();
    instances.forEach(instance => {
      const existing = map.get(instance.originalTemplateId);
      if (!existing || (instance.updated_at || '') > (existing.updated_at || '')) {
        map.set(instance.originalTemplateId, instance);
      }
    });
    return map;
  }, [instances]);

  // Create a map of templates by ID for quick lookup
  const templateMap = useMemo(() => {
    const map = new Map<string, typeof templates[0]>();
    templates.forEach(template => {
      map.set(template.id, template);
    });
    return map;
  }, [templates]);
  
  // Extract unique brands and categories for templates
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    savedTemplates.forEach(template => {
      if (template.brand) {
        brandSet.add(template.brand);
      }
    });
    return Array.from(brandSet).sort();
  }, [savedTemplates]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    savedTemplates.forEach(template => {
      if (template.category) {
        categorySet.add(template.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [savedTemplates]);

  // Extract unique brands and categories for projects
  const projectBrands = useMemo(() => {
    const brandSet = new Set<string>();
    instances.forEach(instance => {
      if (instance.brand) {
        brandSet.add(instance.brand);
      }
    });
    return Array.from(brandSet).sort();
  }, [instances]);

  const projectCategories = useMemo(() => {
    const categorySet = new Set<string>();
    instances.forEach(instance => {
      if (instance.category) {
        categorySet.add(instance.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [instances]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = savedTemplates;

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
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "brand") {
      filtered.sort((a, b) => {
        const brandA = a.brand || "";
        const brandB = b.brand || "";
        return brandA.localeCompare(brandB);
      });
    } else if (sortBy === "category") {
      filtered.sort((a, b) => {
        const catA = a.category || "";
        const catB = b.category || "";
        return catA.localeCompare(catB);
      });
    }
    // "recent" is already sorted by created_at from the database

    return filtered;
  }, [savedTemplates, searchQuery, selectedBrand, selectedCategory, sortBy]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = instances;

    // Filter by search query
    if (projectSearch.trim()) {
      const query = projectSearch.toLowerCase();
      filtered = filtered.filter(instance => 
        instance.name.toLowerCase().includes(query) ||
        instance.brand?.toLowerCase().includes(query) ||
        instance.category?.toLowerCase().includes(query)
      );
    }

    // Filter by brand
    if (projectBrand !== "all") {
      filtered = filtered.filter(instance => instance.brand === projectBrand);
    }

    // Filter by category
    if (projectCategory !== "all") {
      filtered = filtered.filter(instance => instance.category === projectCategory);
    }

    return filtered;
  }, [instances, projectSearch, projectBrand, projectCategory]);

  const handleCreateCopy = async (templateId: string) => {
    try {
      toast.loading("Creating your copy...");
      const instanceId = await createInstanceFromTemplate(templateId);
      await fetchUserInstances();
      toast.dismiss();
      toast.success("Copy created! Click 'Open Studio' to start editing.");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to create copy");
      console.error(error);
    }
  };

  const handleOpenStudio = async (instanceId: string) => {
    try {
      setCurrentInstance(instanceId);
      toast.success("Opening your workspace...");
    } catch (error) {
      toast.error("Failed to open studio");
      console.error(error);
    }
  };

  const handleDeleteProject = async (instanceId: string) => {
    try {
      toast.loading("Deleting project...");
      await deleteInstance(instanceId);
      await fetchUserInstances();
      toast.dismiss();
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  const handleRenameProject = async (instanceId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    
    try {
      await updateInstanceName(instanceId, newName);
      toast.success("Project renamed successfully");
    } catch (error) {
      toast.error("Failed to rename project");
      console.error(error);
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            HR Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse templates and manage your projects
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="templates" className="gap-2">
              <Layers className="w-4 h-4" />
              Browse Templates
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

          {/* Browse Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
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

            {/* Content */}
            {isLoading && templates.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse mx-auto">
                    <Layers className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Loading templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  {searchQuery || selectedBrand !== "all" || selectedCategory !== "all"
                    ? "No templates match your filters"
                    : "No templates available yet"
                  }
                </p>
                {!searchQuery && selectedBrand === "all" && selectedCategory === "all" && (
                  <p className="text-muted-foreground text-sm mt-2">
                    Contact your admin to create templates
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    existingInstance={templateInstanceMap.get(template.id)}
                    onCreateCopy={handleCreateCopy}
                    onOpenStudio={handleOpenStudio}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row with View Toggle */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Category Filter */}
                  <Select value={projectCategory} onValueChange={setProjectCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {projectCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Brand Filter */}
                  <Select value={projectBrand} onValueChange={setProjectBrand}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {projectBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <ToggleGroup type="single" value={projectViewMode} onValueChange={(value) => value && setProjectViewMode(value as "grid" | "list")}>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid3x3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Content */}
            {instances.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">
                  You haven't created any projects yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Browse templates to get started
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No projects match your filters
                </p>
              </div>
            ) : projectViewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((instance) => (
                  <MyProjectsCard
                    key={instance.id}
                    instance={instance}
                    originalTemplate={templateMap.get(instance.originalTemplateId)}
                    onOpenStudio={handleOpenStudio}
                    onDelete={handleDeleteProject}
                    onRename={handleRenameProject}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((instance) => (
                  <MyProjectsCard
                    key={instance.id}
                    instance={instance}
                    originalTemplate={templateMap.get(instance.originalTemplateId)}
                    onOpenStudio={handleOpenStudio}
                    onDelete={handleDeleteProject}
                    onRename={handleRenameProject}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
