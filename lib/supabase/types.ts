export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          date_of_birth: string | null;
          religion: "hindu" | "christian" | "parsi" | "muslim" | "other" | null;
          consent_given_at: string | null;
          consent_purpose: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          religion?: "hindu" | "christian" | "parsi" | "muslim" | "other" | null;
          consent_given_at?: string | null;
          consent_purpose?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      estates: {
        Row: {
          id: string;
          user_id: string;
          intake_state: string;
          estate_json_enc: string | null;
          estate_envelope_meta: Json | null;
          intake_completed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          intake_state?: string;
          estate_json_enc?: string | null;
          estate_envelope_meta?: Json | null;
          intake_completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["estates"]["Insert"]>;
      };
      assets: {
        Row: {
          id: string;
          estate_id: string;
          asset_class: string;
          institution: string | null;
          aa_source: boolean;
          claim_process_meta: Json | null;
          asset_payload_enc: string | null;
          asset_envelope_meta: Json | null;
          wallet_meta: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          estate_id: string;
          asset_class: string;
          institution?: string | null;
          aa_source?: boolean;
          claim_process_meta?: Json | null;
          asset_payload_enc?: string | null;
          asset_envelope_meta?: Json | null;
          wallet_meta?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          estate_id: string;
          doc_type: string;
          file_name: string;
          storage_path: string;
          envelope_meta: Json;
          file_size_bytes: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          estate_id: string;
          doc_type: string;
          file_name: string;
          storage_path: string;
          envelope_meta: Json;
          file_size_bytes?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      vault_keys: {
        Row: {
          id: string;
          user_id: string;
          kdf_salt: string;
          kdf_opslimit: number;
          kdf_memlimit: number;
          user_share_enc: string;
          escrow_share_enc: string;
          kit_issued: boolean;
          kit_issued_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          kdf_salt: string;
          kdf_opslimit: number;
          kdf_memlimit: number;
          user_share_enc: string;
          escrow_share_enc: string;
          kit_issued?: boolean;
          kit_issued_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vault_keys"]["Insert"]>;
      };
      nominees: {
        Row: {
          id: string;
          estate_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          relationship: string | null;
          invite_token: string | null;
          invite_sent_at: string | null;
          kyc_status: string;
          digilocker_ref: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          estate_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          relationship?: string | null;
          invite_token?: string | null;
          invite_sent_at?: string | null;
          kyc_status?: string;
          digilocker_ref?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["nominees"]["Insert"]>;
      };
      wills: {
        Row: {
          id: string;
          estate_id: string;
          version: number;
          clause_set_hash: string;
          clause_library_version: string;
          religion_branch: string;
          status: string;
          will_doc_path: string | null;
          kit_doc_path: string | null;
          envelope_meta: Json | null;
          generated_at: string | null;
          kit_issued_at: string | null;
          executed_confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          estate_id: string;
          version?: number;
          clause_set_hash: string;
          clause_library_version: string;
          religion_branch: string;
          status?: string;
          will_doc_path?: string | null;
          kit_doc_path?: string | null;
          envelope_meta?: Json | null;
          generated_at?: string | null;
          kit_issued_at?: string | null;
          executed_confirmed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wills"]["Insert"]>;
      };
      release_events: {
        Row: {
          id: string;
          estate_id: string;
          initiator_nominee_id: string | null;
          status: string;
          death_certificate_path: string | null;
          ops_notes: string | null;
          time_lock_expires_at: string | null;
          notified_nominees: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          estate_id: string;
          initiator_nominee_id?: string | null;
          status?: string;
          death_certificate_path?: string | null;
          ops_notes?: string | null;
          time_lock_expires_at?: string | null;
          notified_nominees?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["release_events"]["Insert"]>;
      };
      release_event_log: {
        Row: {
          id: string;
          release_event_id: string;
          from_status: string | null;
          to_status: string;
          actor: string;
          notes: string | null;
          logged_at: string | null;
        };
        Insert: {
          id?: string;
          release_event_id: string;
          from_status?: string | null;
          to_status: string;
          actor: string;
          notes?: string | null;
          logged_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["release_event_log"]["Insert"]>;
      };
      ca_partners: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          icai_membership_no: string | null;
          referral_code: string;
          commission_rate: number;
          white_label_subdomain: string | null;
          white_label_config: Json | null;
          payout_ledger: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          icai_membership_no?: string | null;
          referral_code: string;
          commission_rate?: number;
          white_label_subdomain?: string | null;
          white_label_config?: Json | null;
          payout_ledger?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ca_partners"]["Insert"]>;
      };
      referrals: {
        Row: {
          id: string;
          ca_partner_id: string;
          user_id: string | null;
          referral_code: string;
          plan_purchased: string | null;
          amount_paid_paise: number | null;
          commission_amount_paise: number | null;
          commission_status: string;
          razorpay_order_id: string | null;
          embed_source: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          ca_partner_id: string;
          user_id?: string | null;
          referral_code: string;
          plan_purchased?: string | null;
          amount_paid_paise?: number | null;
          commission_amount_paise?: number | null;
          commission_status?: string;
          razorpay_order_id?: string | null;
          embed_source?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
      };
      pre_orders: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          referral_code: string | null;
          razorpay_payment_id: string | null;
          razorpay_order_id: string | null;
          amount_paise: number | null;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          referral_code?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          amount_paise?: number | null;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pre_orders"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}