import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  History, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AuditLog {
  id: string;
  instance_id: string;
  instance_name: string;
  event_type: string;
  event_category: string;
  performed_by: string;
  performed_by_email: string;
  performed_at: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
}

export default function ProjectHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<string[]>([]);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, selectedProject, selectedCategory, selectedEventType, selectedUser, dateRange, searchQuery]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase.rpc('get_audit_logs_with_emails', {
        _start_date: startDate.toISOString(),
        _limit: 500
      });

      if (error) throw error;

      setLogs(data || []);
      
      // Extract unique projects and users for filters
      const uniqueProjects = Array.from(
        new Map(
          data
            ?.filter((log: AuditLog) => log.instance_id && log.instance_name)
            .map((log: AuditLog) => [log.instance_id, { id: log.instance_id, name: log.instance_name }])
        ).values()
      );
      setProjects(uniqueProjects as Array<{ id: string; name: string }>);
      
      const uniqueUsers = Array.from(new Set(data?.map((log: AuditLog) => log.performed_by_email).filter(Boolean)));
      setUsers(uniqueUsers as string[]);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load project history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (selectedProject !== "all") {
      filtered = filtered.filter(log => log.instance_id === selectedProject);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(log => log.event_category === selectedCategory);
    }

    if (selectedEventType !== "all") {
      filtered = filtered.filter(log => log.event_type === selectedEventType);
    }

    if (selectedUser !== "all") {
      filtered = filtered.filter(log => log.performed_by_email === selectedUser);
    }

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.instance_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performed_by_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const csv = [
      ['Timestamp', 'Event', 'Category', 'User Email', 'Project', 'Details'],
      ...filteredLogs.map(log => [
        format(new Date(log.performed_at), 'yyyy-MM-dd HH:mm:ss'),
        log.event_type,
        log.event_category,
        log.performed_by_email,
        log.instance_name,
        JSON.stringify(log.metadata || {})
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredLogs.length} records`,
    });
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('created')) return <Plus className="h-4 w-4" />;
    if (eventType.includes('updated') || eventType.includes('edit')) return <Edit className="h-4 w-4" />;
    if (eventType.includes('deleted')) return <Trash2 className="h-4 w-4" />;
    if (eventType.includes('approved')) return <CheckCircle className="h-4 w-4" />;
    if (eventType.includes('rejected')) return <XCircle className="h-4 w-4" />;
    if (eventType.includes('review')) return <MessageSquare className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getEventColor = (eventType: string, category: string) => {
    if (category === 'project') {
      if (eventType.includes('created')) return 'bg-green-500/20 text-green-700 dark:text-green-400';
      if (eventType.includes('deleted')) return 'bg-red-500/20 text-red-700 dark:text-red-400';
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    }
    if (category === 'review') {
      if (eventType.includes('approved')) return 'bg-green-500/20 text-green-700 dark:text-green-400';
      if (eventType.includes('rejected')) return 'bg-red-500/20 text-red-700 dark:text-red-400';
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
    }
    if (category === 'deletion') return 'bg-red-500/20 text-red-700 dark:text-red-400';
    if (category === 'content') return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationV2 />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Project History</h1>
                <p className="text-muted-foreground">Complete audit log of all project changes and activities</p>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="deletion">Deletion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="project_created">Created</SelectItem>
                    <SelectItem value="project_updated">Updated</SelectItem>
                    <SelectItem value="project_deleted">Deleted</SelectItem>
                    <SelectItem value="review_submitted">Review Submitted</SelectItem>
                    <SelectItem value="review_approved">Approved</SelectItem>
                    <SelectItem value="review_rejected">Rejected</SelectItem>
                    <SelectItem value="caption_updated">Caption Updated</SelectItem>
                    <SelectItem value="layer_updated">Layer Updated</SelectItem>
                    <SelectItem value="deletion_requested">Deletion Requested</SelectItem>
                    <SelectItem value="deletion_approved">Deletion Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="365">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading history...
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No events found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Collapsible key={log.id}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getEventColor(log.event_type, log.event_category)}`}>
                          {getEventIcon(log.event_type)}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{formatEventType(log.event_type)}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.event_category}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{format(new Date(log.performed_at), 'PPpp')}</div>
                            <div>by {log.performed_by_email}</div>
                            <div className="font-medium text-foreground">Project: {log.instance_name}</div>
                          </div>
                        </div>

                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="p-4 bg-muted/30">
                      <div className="space-y-3 text-sm">
                        {log.entity_type && (
                          <div>
                            <span className="font-medium">Entity Type:</span> {log.entity_type}
                          </div>
                        )}

                        {log.old_value && (
                          <div>
                            <span className="font-medium">Previous Value:</span>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.old_value, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.new_value && (
                          <div>
                            <span className="font-medium">New Value:</span>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.new_value, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div>
                            <span className="font-medium">Additional Details:</span>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        {/* Stats */}
        {!isLoading && filteredLogs.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} total events
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}