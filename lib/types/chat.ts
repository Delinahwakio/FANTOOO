// Chat type definitions

export type ChatStatus = 'active' | 'idle' | 'closed' | 'archived' | 'escalated'

export type MessageSenderType = 'real' | 'fictional'

export type MessageContentType = 'text' | 'image' | 'voice' | 'video' | 'gif'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Chat {
  id: string
  real_user_id: string
  fictional_user_id: string
  assigned_operator_id?: string
  assignment_time?: string
  last_operator_activity?: string
  assignment_count: number
  status: ChatStatus
  close_reason?: string
  message_count: number
  free_messages_used: number
  paid_messages_count: number
  total_credits_spent: number
  user_satisfaction_rating?: number
  operator_notes?: string
  admin_notes?: string
  flags?: string[]
  first_message_at?: string
  last_message_at?: string
  last_user_message_at?: string
  last_fictional_message_at?: string
  average_response_time?: string
  created_at: string
  updated_at: string
  closed_at?: string
}

export interface Message {
  id: string
  chat_id: string
  sender_type: MessageSenderType
  content: string
  original_content?: string
  content_type: MessageContentType
  media_url?: string
  handled_by_operator_id?: string
  is_free_message: boolean
  credits_charged: number
  is_edited: boolean
  edited_by?: string
  edited_at?: string
  edit_count: number
  status: MessageStatus
  delivered_at?: string
  read_at?: string
  sentiment_score?: number
  toxicity_score?: number
  is_flagged: boolean
  flag_reason?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface ChatQueue {
  id: string
  chat_id: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  priority_score: number
  user_tier: string
  user_lifetime_value?: number
  wait_time?: string
  required_specializations?: string[]
  preferred_operator_id?: string
  excluded_operator_ids?: string[]
  entered_queue_at: string
  attempts: number
  last_attempt_at?: string
  created_at: string
}
