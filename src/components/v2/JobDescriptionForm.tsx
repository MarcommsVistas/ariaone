import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const jobDescriptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Job title must be at least 3 characters" })
    .max(100, { message: "Job title must be less than 100 characters" }),
  description: z
    .string()
    .trim()
    .min(20, { message: "Job description must be at least 20 characters" })
    .max(2000, { message: "Job description must be less than 2000 characters" }),
  location: z
    .string()
    .trim()
    .min(2, { message: "Location must be at least 2 characters" })
    .max(100, { message: "Location must be less than 100 characters" }),
});

type JobDescriptionFormData = z.infer<typeof jobDescriptionSchema>;

interface JobDescriptionFormProps {
  templateId: string;
  templateName: string;
}

export const JobDescriptionForm = ({ templateId, templateName }: JobDescriptionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
    },
  });

  const onSubmit = async (data: JobDescriptionFormData) => {
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Authentication error:", authError);
        toast({
          title: "Authentication Error",
          description: "Please log in to generate creatives.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (!user) {
        console.error("No authenticated user found");
        toast({
          title: "Not Logged In",
          description: "Please log in to generate creatives.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      console.log("Creating template instance for user:", user.id);
      console.log("Template ID:", templateId);
      console.log("Job description data:", data);

      // Create template instance with job description
      const { data: instance, error: instanceError } = await supabase
        .from("template_instances")
        .insert({
          name: `${data.title} - ${templateName}`,
          original_template_id: templateId,
          created_by: user.id,
          workflow_version: "v2",
          job_description: {
            title: data.title,
            description: data.description,
            location: data.location,
          },
          ai_generated: false, // Will be set to true after AI generation
          can_download: false, // Will be set to true after approval
        })
        .select()
        .single();

      if (instanceError) {
        console.error("Supabase insert error:", instanceError);
        console.error("Error code:", instanceError.code);
        console.error("Error message:", instanceError.message);
        console.error("Error details:", instanceError.details);
        throw instanceError;
      }

      if (!instance) {
        throw new Error("Instance creation returned no data");
      }

      console.log("Successfully created instance:", instance);

      toast({
        title: "Success",
        description: "Job details saved. Preparing AI generation...",
      });

      // Navigate to preview/generation page
      navigate(`/v2/preview/${instance.id}`);
    } catch (error) {
      console.error("Error creating instance:", error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to save job details. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        }
        
        // Handle specific RLS errors
        if (supabaseError.message?.includes("row-level security")) {
          errorMessage = "Permission denied. Please contact your administrator.";
        } else if (supabaseError.message?.includes("violates")) {
          errorMessage = "Data validation failed. Please check your input.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Senior Software Engineer"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The main title of the position you're hiring for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity unique..."
                  className="min-h-[200px] resize-y"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Provide detailed information about the role. The AI will use this to generate compelling creative content.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., London, UK or Remote"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Where is this position based?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/v2")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
