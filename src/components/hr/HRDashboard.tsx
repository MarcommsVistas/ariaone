import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplateStore } from "@/store/useTemplateStore";
import { TemplateCard } from "./TemplateCard";
import { Search, Layers, Filter, Tag } from "lucide-react";

export const HRDashboard = () => {
  const { 
    templates, 
    setCurrentTemplate, 
    fetchTemplates, 
    subscribeToChanges, 
    unsubscribeFromChanges,
    isLoading 
  } = useTemplateStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  
  // Fetch templates and subscribe to changes on mount
  useEffect(() => {
    fetchTemplates();
    subscribeToChanges();
    
    return () => {
      unsubscribeFromChanges();
    };
  }, []);
  
  // Only show saved templates
  const savedTemplates = templates.filter(t => t.saved);
  
  // Extract unique brands and categories
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

  const handleOpenStudio = (templateId: string) => {
    setCurrentTemplate(templateId);
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Templates
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse and customize templates for your brand
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4">
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
                onOpenStudio={handleOpenStudio}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
