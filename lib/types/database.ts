// Database type definitions
// This file will be populated with Supabase generated types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be defined here after database setup
    }
    Views: {
      // Views will be defined here
    }
    Functions: {
      // Functions will be defined here
    }
    Enums: {
      // Enums will be defined here
    }
  }
}
