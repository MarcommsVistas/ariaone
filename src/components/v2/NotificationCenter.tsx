import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileCheck, 
  ShieldX 
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  data: any;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "review_completed":
    case "review_approved":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "changes_requested":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case "review_rejected":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "review_submission":
      return <FileCheck className="h-5 w-5 text-blue-500" />;
    case "deletion_approved":
      return <Trash2 className="h-5 w-5 text-muted-foreground" />;
    case "deletion_rejected":
      return <ShieldX className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (isYesterday(date)) {
    return `Yesterday at ${date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit" 
    })}`;
  } else {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
};

const groupNotifications = (notifications: Notification[]) => {
  const groups = {
    today: [] as Notification[],
    yesterday: [] as Notification[],
    thisWeek: [] as Notification[],
    earlier: [] as Notification[],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
};

interface NotificationItemProps {
  notification: Notification;
  onNavigate: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onNavigate }: NotificationItemProps) => {
  return (
    <div
      onClick={() => onNavigate(notification)}
      className={`
        p-4 cursor-pointer transition-colors hover:bg-accent/50
        ${!notification.read ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium text-muted-foreground"}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.data?.instanceId) {
      if (notification.type === "review_completed") {
        navigate(`/v2`);
      } else if (notification.type === "changes_requested") {
        navigate(`/v2/preview/${notification.data.instanceId}`);
      }
    }
  };

  const groupedNotifications = groupNotifications(notifications);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="default" className="h-5 px-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          
          {notifications.length > 0 && (
            <div className="flex gap-2 mt-4">
              {unreadCount > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={markAllAsRead}
                  className="flex-1"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearAllNotifications}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          )}
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">No notifications yet</p>
              <p className="text-sm text-muted-foreground/60 text-center mt-1">
                You'll see updates here when there's activity
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {groupedNotifications.today.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Today
                    </p>
                  </div>
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
              
              {groupedNotifications.yesterday.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Yesterday
                    </p>
                  </div>
                  {groupedNotifications.yesterday.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
              
              {groupedNotifications.thisWeek.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      This Week
                    </p>
                  </div>
                  {groupedNotifications.thisWeek.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
              
              {groupedNotifications.earlier.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Earlier
                    </p>
                  </div>
                  {groupedNotifications.earlier.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
