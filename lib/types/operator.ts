// Operator type definitions

export type OperatorSkillLevel = 'junior' | 'mid' | 'senior' | 'expert'

export interface Operator {
  id: string
  auth_id: string
  name: string
  email: string
  specializations?: string[]
  languages: string[]
  skill_level: OperatorSkillLevel
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

export interface OperatorStats {
  messages_sent: number
  chats_handled: number
  quality_score: number
  average_response_time?: string
  average_user_rating: number
  idle_incidents: number
  reassignment_count: number
  user_complaints: number
  total_online_time?: string
  total_earnings: number
}

export interface OperatorPerformance {
  operator_id: string
  date: string
  messages_sent: number
  chats_handled: number
  average_response_time?: string
  user_ratings_received: number
  average_rating: number
  idle_incidents: number
  quality_score: number
  online_time?: string
  earnings: number
}
