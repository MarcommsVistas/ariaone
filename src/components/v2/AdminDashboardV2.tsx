import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  FileImage, 
  MessageSquare, 
  FolderTree, 
  Sparkles,
  Activity,
  History
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AdminDashboardV2 = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    totalTemplates: 0,
    totalBrands: 0,
    totalCategories: 0,
    recentLogs: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [reviewsRes, templatesRes, brandsRes, categoriesRes, logsRes] = await Promise.all([
        supabase.from('creative_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('templates').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('performed_at', yesterday.toISOString()),
      ]);

      setStats({
        pendingReviews: reviewsRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        totalBrands: brandsRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        recentLogs: logsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const cards = [
    {
      title: "Review Queue",
      description: "Review and approve creative submissions",
      icon: MessageSquare,
      count: stats.pendingReviews,
      countLabel: "pending reviews",
      action: () => navigate("/v2/admin/reviews"),
      gradient: "from-orange-500/20 to-red-500/20",
    },
    {
      title: "Creative Templates",
      description: "Manage PSD templates and layers",
      icon: FileImage,
      count: stats.totalTemplates,
      countLabel: "templates",
      action: () => navigate("/v2/admin/templates"),
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "Brand Voice",
      description: "Configure TOV and AI settings",
      icon: Sparkles,
      count: stats.totalBrands,
      countLabel: "brands",
      action: () => navigate("/v2/admin/brand-voice"),
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Categories",
      description: "Manage template categories",
      icon: FolderTree,
      count: stats.totalCategories,
      countLabel: "categories",
      action: () => navigate("/v2/admin/categories"),
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: "Project History",
      description: "View audit logs and project changes",
      icon: History,
      count: stats.recentLogs,
      countLabel: "recent events",
      action: () => navigate("/v2/admin/project-history"),
      gradient: "from-slate-500/20 to-gray-500/20",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage templates, reviews, brands, and categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((card) => (
          <Card 
            key={card.title}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={card.action}
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}>
              <card.icon className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {card.description}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{card.count}</span>
              <span className="text-sm text-muted-foreground">{card.countLabel}</span>
            </div>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                card.action();
              }}
            >
              Manage
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
