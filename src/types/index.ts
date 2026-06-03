export interface User {
  id: string
  email: string
  display_name: string
  app_id: string
  is_premium: boolean
}

export interface Group {
  id: string
  name: string
  owner_id: string
  timezone: string
  created_at: string
}

export type MemberRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface GroupMember {
  group_id: string
  user_id: string
  role: MemberRole
  invitation_status: InvitationStatus
  joined_at: string | null
}

export interface Note {
  id: string
  group_id: string
  author_id: string
  diary_date: string
  content: string
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type ReactionType = 'love' | 'funny' | 'sad' | 'support' | 'seen' | 'favorite'

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  love: '❤️',
  funny: '😂',
  sad: '😢',
  support: '🫂',
  seen: '👀',
  favorite: '⭐',
}

export interface Reaction {
  id: string
  note_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
}

export interface Reply {
  id: string
  note_id: string
  author_id: string
  content: string
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'new_note'
  | 'reaction'
  | 'reply'
  | 'group_invitation'
  | 'invitation_accepted'

export type RefType = 'note' | 'group' | 'reply'

export interface Notification {
  id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  reference_id: string
  ref_type: RefType
  metadata: Record<string, string>
  is_read: boolean
  created_at: string
}

export interface PaginatedNotifications {
  notifications: Notification[]
  unread_count: number
}
