import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle, Trash2, Calendar } from "lucide-react";
import { InstanceThumbnail } from "./InstanceThumbnail";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Review {
  id: string;
  instance_id: string;
  status: string;
  submitted_at: string;
  submitted_by: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  deletion_requested: boolean | null;
  deletion_request_notes: string | null;
  template_instances: {
    name: string;
    category: string | null;
    brand: string | null;
    job_description_parsed: any;
  } | null;
}

interface ReviewCardProps {
  review: Review;
  viewMode?: "grid" | "list";
  onReview: (instanceId: string) => void;
  className?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    case "changes_requested":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Changes Requested
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const ReviewCard = ({ review, viewMode = "grid", onReview, className }: ReviewCardProps) => {
  const jobInfo = review.template_instances?.job_description_parsed as any;

  if (viewMode === "list") {
    return (
      <Card className={cn("hover:shadow-lg transition-shadow", className)}>
        <div className="flex gap-4 p-4">
          <div className="bg-muted/30 p-3 rounded-lg shrink-0" style={{ width: '160px', height: '120px' }}>
            <InstanceThumbnail instanceId={review.instance_id} />
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg truncate">
                    {review.template_instances?.name || "Untitled Project"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    {jobInfo?.jobTitle && (
                      <span className="truncate">{jobInfo.jobTitle}</span>
                    )}
                    {jobInfo?.location && (
                      <>
                        <span>•</span>
                        <span className="truncate">{jobInfo.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(review.status)}
                  {review.deletion_requested && (
                    <Badge variant="destructive" className="gap-1">
                      <Trash2 className="w-3 h-3" />
                      Delete Request
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {review.template_instances?.category && (
                  <span className="truncate">{review.template_instances.category}</span>
                )}
                {review.template_instances?.brand && (
                  <>
                    <span>•</span>
                    <span className="truncate">{review.template_instances.brand}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(review.submitted_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">
                Submitted by {review.submitted_by}
              </div>
              <Button
                onClick={() => onReview(review.instance_id)}
                size="sm"
              >
                Review
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className={cn("hover:shadow-lg transition-shadow overflow-hidden", className)}>
      <div className="bg-muted/30 p-6 rounded-t-lg" style={{ minHeight: '340px' }}>
        <InstanceThumbnail instanceId={review.instance_id} />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            {review.template_instances?.name || "Untitled Project"}
          </h3>
          {getStatusBadge(review.status)}
        </div>
        {jobInfo?.jobTitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {jobInfo.jobTitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        {review.deletion_requested && (
          <Badge variant="destructive" className="gap-1">
            <Trash2 className="w-3 h-3" />
            Deletion Requested
          </Badge>
        )}
        <div className="space-y-1 text-sm text-muted-foreground">
          {review.template_instances?.category && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Category:</span>
              <span>{review.template_instances.category}</span>
            </div>
          )}
          {review.template_instances?.brand && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Brand:</span>
              <span>{review.template_instances.brand}</span>
            </div>
          )}
          {jobInfo?.location && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Location:</span>
              <span>{jobInfo.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>Submitted {format(new Date(review.submitted_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          By {review.submitted_by}
        </span>
        <Button
          onClick={() => onReview(review.instance_id)}
          size="sm"
        >
          Review
        </Button>
      </CardFooter>
    </Card>
  );
};
