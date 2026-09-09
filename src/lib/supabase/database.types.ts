export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          payment_handle: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          payment_handle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          payment_handle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["member_role"];
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          joined_at?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          household_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id?: string | null;
          name: string;
          icon?: string | null;
          color?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string | null;
          name?: string;
          icon?: string | null;
          color?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          month: number;
          year: number;
          category_id: string | null;
          planned_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          month: number;
          year: number;
          category_id?: string | null;
          planned_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          month?: number;
          year?: number;
          category_id?: string | null;
          planned_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          category_id: string | null;
          item_name: string;
          amount: number;
          expense_date: string;
          month: number;
          year: number;
          split_type: Database["public"]["Enums"]["split_type"];
          note: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          edited_by: string | null;
          recurring_expense_id: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          paid_by: string;
          category_id?: string | null;
          item_name: string;
          amount: number;
          expense_date?: string;
          month?: number;
          year?: number;
          split_type?: Database["public"]["Enums"]["split_type"];
          note?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          edited_by?: string | null;
          recurring_expense_id?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          paid_by?: string;
          category_id?: string | null;
          item_name?: string;
          amount?: number;
          expense_date?: string;
          month?: number;
          year?: number;
          split_type?: Database["public"]["Enums"]["split_type"];
          note?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          edited_by?: string | null;
          recurring_expense_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_recurring_expense_id_fkey";
            columns: ["recurring_expense_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
          is_included: boolean;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          share_amount?: number;
          is_included?: boolean;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          share_amount?: number;
          is_included?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          id: string;
          household_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          month: number;
          year: number;
          status: Database["public"]["Enums"]["settlement_status"];
          settled_at: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          month: number;
          year: number;
          status?: Database["public"]["Enums"]["settlement_status"];
          settled_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          from_user?: string;
          to_user?: string;
          amount?: number;
          month?: number;
          year?: number;
          status?: Database["public"]["Enums"]["settlement_status"];
          settled_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          category_id: string | null;
          item_name: string;
          amount: number;
          split_type: Database["public"]["Enums"]["split_type"];
          note: string | null;
          frequency: Database["public"]["Enums"]["recurrence_frequency"];
          next_run_date: string;
          active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          paid_by: string;
          category_id?: string | null;
          item_name: string;
          amount: number;
          split_type?: Database["public"]["Enums"]["split_type"];
          note?: string | null;
          frequency?: Database["public"]["Enums"]["recurrence_frequency"];
          next_run_date: string;
          active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          paid_by?: string;
          category_id?: string | null;
          item_name?: string;
          amount?: number;
          split_type?: Database["public"]["Enums"]["split_type"];
          note?: string | null;
          frequency?: Database["public"]["Enums"]["recurrence_frequency"];
          next_run_date?: string;
          active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_expense_splits: {
        Row: {
          id: string;
          recurring_expense_id: string;
          user_id: string;
          share_amount: number;
          is_included: boolean;
        };
        Insert: {
          id?: string;
          recurring_expense_id: string;
          user_id: string;
          share_amount?: number;
          is_included?: boolean;
        };
        Update: {
          id?: string;
          recurring_expense_id?: string;
          user_id?: string;
          share_amount?: number;
          is_included?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expense_splits_recurring_expense_id_fkey";
            columns: ["recurring_expense_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_expense_splits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_household: {
        Args: { p_name: string; p_currency?: string };
        Returns: Database["public"]["Tables"]["households"]["Row"];
      };
      join_household: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      update_household: {
        Args: { p_household_id: string; p_name: string; p_currency: string };
        Returns: Database["public"]["Tables"]["households"]["Row"];
      };
      rotate_invite_code: {
        Args: { p_household_id: string };
        Returns: string;
      };
      set_member_active: {
        Args: {
          p_household_id: string;
          p_user_id: string;
          p_is_active: boolean;
        };
        Returns: undefined;
      };
      set_member_role: {
        Args: {
          p_household_id: string;
          p_user_id: string;
          p_role: Database["public"]["Enums"]["member_role"];
        };
        Returns: undefined;
      };
      leave_household: {
        Args: { p_household_id: string };
        Returns: undefined;
      };
      is_household_member: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_household_admin: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_active_member: {
        Args: { p_household_id: string; p_user_id: string };
        Returns: boolean;
      };
      shares_household_with: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      can_mutate_expense: {
        Args: { p_expense_id: string };
        Returns: boolean;
      };
      can_mutate_recurring_expense: {
        Args: { p_recurring_expense_id: string };
        Returns: boolean;
      };
      save_expense: {
        Args: {
          p_household_id: string;
          p_paid_by: string;
          p_item_name: string;
          p_amount: number;
          p_expense_date: string;
          p_split_type: Database["public"]["Enums"]["split_type"];
          p_splits: Json;
          p_category_id?: string | null;
          p_note?: string | null;
          p_id?: string | null;
          p_recurring_expense_id?: string | null;
        };
        Returns: string;
      };
      save_recurring_expense: {
        Args: {
          p_household_id: string;
          p_paid_by: string;
          p_item_name: string;
          p_amount: number;
          p_split_type: Database["public"]["Enums"]["split_type"];
          p_splits: Json;
          p_frequency: Database["public"]["Enums"]["recurrence_frequency"];
          p_next_run_date: string;
          p_category_id?: string | null;
          p_note?: string | null;
          p_id?: string | null;
          p_active?: boolean;
        };
        Returns: string;
      };
      apply_recurring_expense: {
        Args: { p_id: string };
        Returns: string;
      };
      skip_recurring_expense: {
        Args: { p_id: string };
        Returns: string;
      };
      upsert_budget: {
        Args: {
          p_household_id: string;
          p_year: number;
          p_month: number;
          p_amount: number | null;
          p_category_id?: string | null;
        };
        Returns: number | null;
      };
      advance_recurring_date: {
        Args: {
          p_date: string;
          p_frequency: Database["public"]["Enums"]["recurrence_frequency"];
        };
        Returns: string;
      };
      dashboard_stats: {
        Args: {
          p_household_id: string;
          p_year: number;
          p_month: number;
          p_trend_months?: number;
        };
        Returns: Json;
      };
      set_overall_budget: {
        Args: {
          p_household_id: string;
          p_year: number;
          p_month: number;
          p_amount: number;
        };
        Returns: number;
      };
      settlement_balances: {
        Args: {
          p_household_id: string;
          p_year?: number | null;
          p_month?: number | null;
        };
        Returns: {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          is_active: boolean;
          paid: number;
          fair_share: number;
          settled_out: number;
          settled_in: number;
          net: number;
        }[];
      };
    };
    Enums: {
      member_role: "admin" | "member";
      split_type: "equal" | "percentage" | "custom_amount" | "shares";
      settlement_status: "pending" | "confirmed";
      recurrence_frequency: "monthly" | "weekly";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Profile = Tables<"profiles">;
export type Household = Tables<"households">;
export type HouseholdMember = Tables<"household_members">;
export type Category = Tables<"categories">;
export type Budget = Tables<"budgets">;
export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
export type Settlement = Tables<"settlements">;
export type RecurringExpense = Tables<"recurring_expenses">;
