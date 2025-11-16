// User type definitions

export type UserRole = 'real_user' | 'operator' | 'admin' | 'super_admin'

export type Gender = 'male' | 'female' | 'other'

export type LookingFor = 'male' | 'female' | 'both'

export type UserTier = 'free' | 'bronze' | 'silver' | 'gold' | 'platinum'

export interface RealUser {
  id: string
  auth_id: string
  username: string
  display_name: string
  email: string
  age: number
  gender: Gender
  looking_for: LookingFor
  location: string
  latitude?: number
  longitude?: number
  bio?: string
  profile_picture?: string
  profile_pictures?: string[]
  credits: number
  total_spent: number
  user_tier: UserTier
  loyalty_points: number
  total_messages_sent: number
  total_chats: number
  favorite_count: number
  last_active_at: string
  is_active: boolean
  is_verified: boolean
  is_banned: boolean
  ban_reason?: string
  banned_until?: string
  notification_preferences: Record<string, boolean>
  privacy_settings: Record<string, boolean>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface FictionalUser {
  id: string
  name: string
  age: number
  gender: Gender
  location: string
  bio: string
  personality_traits?: string[]
  interests?: string[]
  occupation?: string
  education?: string
  relationship_status?: string
  profile_pictures: string[]
  cover_photo?: string
  response_style?: 'flirty' | 'romantic' | 'friendly' | 'intellectual' | 'playful'
  response_templates?: Record<string, string>
  personality_guidelines?: string
  total_chats: number
  total_messages: number
  average_rating: number
  total_revenue: number
  conversion_rate: number
  is_active: boolean
  is_featured: boolean
  featured_until?: string
  max_concurrent_chats: number
  tags?: string[]
  category?: string
  popularity_score: number
  created_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Operator {
  id: string
  auth_id: string
  name: string
  email: string
  specializations?: string[]
  languages: string[]
  skill_level: 'junior' | 'mid' | 'senior' | 'expert'
  is_active: boolean
  is_available: boolean
  max_concurrent_chats: number
  current_chat_count: number
  total_messages_sent: number
  total_chats_handled: number
  average_response_time?: string
  average_user_rating: number
  total_ratings: number
  quality_score: number
  idle_incidents: number
  reassignment_count: number
  user_complaints: number
  quality_threshold: number
  is_suspended: boolean
  suspension_reason?: string
  suspended_until?: string
  last_activity: string
  last_login?: string
  total_online_time?: string
  hourly_rate?: number
  commission_rate?: number
  total_earnings: number
  created_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Admin {
  id: string
  auth_id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: Record<string, boolean>
  is_active: boolean
  last_login?: string
  last_activity: string
  created_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}
