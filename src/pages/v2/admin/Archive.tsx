import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useEffect, useState } from "react";
import { ArchivedTemplateCard } from "@/components/admin/ArchivedTemplateCard";
import { Archive as ArchiveIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const Archive = () => {
  const { userRole, isLoading } = useAuthStore();
  const { fetchArchivedTemplates, archivedTemplates } = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchArchivedTemplates();
  }, [fetchArchivedTemplates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (userRole !== 'marcomms') {
    return <Navigate to="/v2" replace />;
  }

  const filteredTemplates = archivedTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-3 mb-6">
            <ArchiveIcon className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold">Archived Templates</h1>
              <p className="text-muted-foreground mt-1">
                View, restore, or permanently delete archived templates
              </p>
            </div>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Search archived templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <ArchiveIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">
                {searchQuery ? "No archived templates match your search" : "No archived templates"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <ArchivedTemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Archive;
