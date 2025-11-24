export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_category: string
          event_type: string
          id: string
          instance_id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_category: string
          event_type: string
          id?: string
          instance_id: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_category?: string
          event_type?: string
          id?: string
          instance_id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "template_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          ai_enabled: boolean | null
          ai_instructions: Json | null
          created_at: string | null
          id: string
          name: string
          tov_document_url: string | null
          tov_guidelines: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_instructions?: Json | null
          created_at?: string | null
          id?: string
          name: string
          tov_document_url?: string | null
          tov_guidelines?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          ai_instructions?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          tov_document_url?: string | null
          tov_guidelines?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      creative_reviews: {
        Row: {
          change_requests: Json | null
          created_at: string
          deletion_request_notes: string | null
          deletion_requested: boolean | null
          deletion_requested_at: string | null
          id: string
          instance_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          change_requests?: Json | null
          created_at?: string
          deletion_request_notes?: string | null
          deletion_requested?: boolean | null
          deletion_requested_at?: string | null
          id?: string
          instance_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          change_requests?: Json | null
          created_at?: string
          deletion_request_notes?: string | null
          deletion_requested?: boolean | null
          deletion_requested_at?: string | null
          id?: string
          instance_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_reviews_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "template_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fonts: {
        Row: {
          created_at: string | null
          family: string
          file_name: string
          file_size: number
          id: string
          name: string
          storage_path: string
          style: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          family: string
          file_name: string
          file_size: number
          id?: string
          name: string
          storage_path: string
          style?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          family?: string
          file_name?: string
          file_size?: number
          id?: string
          name?: string
          storage_path?: string
          style?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      layers: {
        Row: {
          ai_content_type: string | null
          ai_editable: boolean | null
          ai_prompt_template: string | null
          color: string | null
          created_at: string
          font_family: string | null
          font_size: number | null
          font_weight: number | null
          height: number
          hr_editable: boolean | null
          hr_visible: boolean | null
          id: string
          image_src: string | null
          letter_spacing: number | null
          line_height: number | null
          locked: boolean
          max_length: number | null
          name: string
          opacity: number
          rotation: number
          slide_id: string
          text_align: string | null
          text_content: string | null
          text_transform: string | null
          type: string
          visible: boolean
          width: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          ai_content_type?: string | null
          ai_editable?: boolean | null
          ai_prompt_template?: string | null
          color?: string | null
          created_at?: string
          font_family?: string | null
          font_size?: number | null
          font_weight?: number | null
          height?: number
          hr_editable?: boolean | null
          hr_visible?: boolean | null
          id?: string
          image_src?: string | null
          letter_spacing?: number | null
          line_height?: number | null
          locked?: boolean
          max_length?: number | null
          name: string
          opacity?: number
          rotation?: number
          slide_id: string
          text_align?: string | null
          text_content?: string | null
          text_transform?: string | null
          type: string
          visible?: boolean
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          ai_content_type?: string | null
          ai_editable?: boolean | null
          ai_prompt_template?: string | null
          color?: string | null
          created_at?: string
          font_family?: string | null
          font_size?: number | null
          font_weight?: number | null
          height?: number
          hr_editable?: boolean | null
          hr_visible?: boolean | null
          id?: string
          image_src?: string | null
          letter_spacing?: number | null
          line_height?: number | null
          locked?: boolean
          max_length?: number | null
          name?: string
          opacity?: number
          rotation?: number
          slide_id?: string
          text_align?: string | null
          text_content?: string | null
          text_transform?: string | null
          type?: string
          visible?: boolean
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "layers_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      psd_uploads: {
        Row: {
          file_name: string
          file_size: number
          id: string
          storage_path: string
          template_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size: number
          id?: string
          storage_path: string
          template_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number
          id?: string
          storage_path?: string
          template_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psd_uploads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      slides: {
        Row: {
          created_at: string
          height: number
          id: string
          instance_id: string | null
          name: string
          order_index: number
          template_id: string | null
          width: number
        }
        Insert: {
          created_at?: string
          height: number
          id?: string
          instance_id?: string | null
          name: string
          order_index?: number
          template_id?: string | null
          width: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          instance_id?: string | null
          name?: string
          order_index?: number
          template_id?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "slides_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "template_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_instances: {
        Row: {
          ai_generated: boolean | null
          brand: string | null
          can_download: boolean | null
          caption_copy: string | null
          category: string | null
          created_at: string
          created_by: string
          id: string
          job_description: Json | null
          name: string
          original_template_id: string
          updated_at: string
          workflow_version: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          brand?: string | null
          can_download?: boolean | null
          caption_copy?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          job_description?: Json | null
          name: string
          original_template_id: string
          updated_at?: string
          workflow_version?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          brand?: string | null
          can_download?: boolean | null
          caption_copy?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          job_description?: Json | null
          name?: string
          original_template_id?: string
          updated_at?: string
          workflow_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_instances_original_template_id_fkey"
            columns: ["original_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          name: string
          psd_file_url: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          name: string
          psd_file_url?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          name?: string
          psd_file_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          preferred_version: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_version?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_version?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_audit_logs_with_emails: {
        Args: {
          _end_date?: string
          _event_category?: string
          _event_type?: string
          _instance_id?: string
          _limit?: number
          _offset?: number
          _performed_by?: string
          _start_date?: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          event_category: string
          event_type: string
          id: string
          instance_id: string
          instance_name: string
          metadata: Json
          new_value: Json
          old_value: Json
          performed_at: string
          performed_by: string
          performed_by_email: string
        }[]
      }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _entity_id?: string
          _entity_type?: string
          _event_category: string
          _event_type: string
          _instance_id: string
          _metadata?: Json
          _new_value?: Json
          _old_value?: Json
          _performed_by: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "marcomms" | "hr"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["marcomms", "hr"],
    },
  },
} as const
