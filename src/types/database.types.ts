export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      kanban_columns: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_tasks: {
        Row: {
          column_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_id: string
          position: number
          ticket_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          column_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id: string
          position?: number
          ticket_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string
          position?: number
          ticket_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["ticket_status"] | null
          id: string
          ticket_id: string
          to_status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          ticket_id: string
          to_status: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          ticket_id?: string
          to_status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          application_id: string
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          protocol: string
          requester_contact: string | null
          requester_name: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          triaged_at: string | null
          type: Database["public"]["Enums"]["ticket_type"] | null
          updated_at: string
        }
        Insert: {
          application_id: string
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          protocol?: string
          requester_contact?: string | null
          requester_name: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          triaged_at?: string | null
          type?: Database["public"]["Enums"]["ticket_type"] | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          protocol?: string
          requester_contact?: string | null
          requester_name?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          triaged_at?: string | null
          type?: Database["public"]["Enums"]["ticket_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      create_public_ticket: {
        Args: {
          p_application_id: string
          p_requester_name: string
          p_requester_contact: string | null
          p_description: string
        }
        Returns: string
      }
      get_ticket_status: {
        Args: {
          p_protocol: string
        }
        Returns: {
          protocol: string
          status: Database["public"]["Enums"]["ticket_status"]
          created_at: string
          updated_at: string
          application_name: string | null
        }[]
      }
    }
    Enums: {
      ticket_priority: "baixa" | "media" | "alta" | "critica"
      ticket_status:
        | "novo"
        | "triagem"
        | "em_andamento"
        | "aguardando_cliente"
        | "resolvido"
        | "fechado"
      ticket_type: "melhoria" | "correcao"
      user_role: "admin" | "agente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

export type Ticket = Tables<"tickets">
export type Application = Tables<"applications">
export type Profile = Tables<"profiles">
export type TicketComment = Tables<"ticket_comments">
export type TicketStatusHistory = Tables<"ticket_status_history">
export type KanbanColumn = Tables<"kanban_columns">
export type KanbanTask = Tables<"kanban_tasks">

export type TicketStatus = Enums<"ticket_status">
export type TicketPriority = Enums<"ticket_priority">
export type TicketType = Enums<"ticket_type">
export type UserRole = Enums<"user_role">

export type TicketWithDetails = Ticket & {
  application?: Application | null
  assigned_profile?: Profile | null
}

export type KanbanTaskWithTicket = KanbanTask & {
  ticket?: {
    id: string
    protocol: string
    requester_name: string
    status: TicketStatus
    priority: TicketPriority | null
    application?: { name: string } | null
  } | null
}
