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
  kind: MemoryBookKind
  emoji: string
  color: MemoryBookColor
  created_at: string
}

export type MemoryBookKind =
  | 'everyday'
  | 'best-friends'
  | 'family'
  | 'long-distance'
  | 'partner'
  | 'adventure'
  | 'memory-book'

export type MemoryBookColor = 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'slate'

export type MemberRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface GroupMember {
  group_id: string
  user_id: string
  role: MemberRole
  invitation_status: InvitationStatus
  joined_at: string | null
}

export interface NoteMedia {
  id: string
  media_url: string
  mime_type: string
  media_kind: 'image' | 'video'
  duration_seconds?: number
}

export interface Note {
  id: string
  client_id?: string
  group_id: string
  author_id: string
  diary_date: string
  content: string
  is_edited: boolean
  is_deleted: boolean
  media: NoteMedia[]
  created_at: string
  updated_at: string
  sync_status?: 'pending' | 'failed'
}

export type ReactionType = string

export const LEGACY_REACTION_EMOJIS: Record<string, string> = {
  love: '❤️',
  funny: '😂',
  sad: '😢',
  support: '🫂',
  seen: '👀',
  favorite: '⭐',
}

export const DEFAULT_REACTION_EMOJIS = ['❤️', '😂', '🥹', '😍', '😭', '🫂', '👀', '⭐', '🔥', '✨', '👏', '💌']

export function reactionEmoji(value: ReactionType): string {
  return LEGACY_REACTION_EMOJIS[value] ?? value
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

export type NotificationType = 'new_note' | 'reaction' | 'reply' | 'group_invitation' | 'invitation_accepted'

export type RefType = 'note' | 'group' | 'reply'

export interface PendingGroupInvitation {
  group_id: string
  group_name: string
  invited_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  actor_id: string
  actor_display_name: string
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

export interface GroupMemberDetail {
  user_id: string
  display_name: string
  app_id: string
  role: MemberRole
  joined_at: string | null
}

export interface Friend {
  friendship_id: string
  user_id: string
  display_name: string
  app_id: string
  tag: string
  nickname: string
  since: string
}

export interface FriendRequest {
  friendship_id: string
  requester_id: string
  display_name: string
  app_id: string
  sent_at: string
}

export const FRIEND_TAGS = [
  { value: 'best_friend', label: 'Best friend' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'boyfriend', label: 'Boyfriend' },
  { value: 'girlfriend', label: 'Girlfriend' },
  { value: 'family', label: 'Family' },
] as const

export type FriendTagValue = (typeof FRIEND_TAGS)[number]['value']
