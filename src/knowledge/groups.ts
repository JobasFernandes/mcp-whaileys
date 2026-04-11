export interface GroupMethodInfo {
  name: string
  signature: string
  description: string
  notes?: string
}

export const GROUP_METHODS: GroupMethodInfo[] = [
  { name: 'groupCreate', signature: '(subject: string, participants: string[]) => Promise<GroupMetadata>', description: 'Create a new group with a subject and initial participants.' },
  { name: 'groupMetadata', signature: '(jid: string) => Promise<GroupMetadata>', description: 'Fetch full metadata for a group.' },
  { name: 'groupLeave', signature: '(id: string) => Promise<void>', description: 'Leave a group.' },
  { name: 'groupUpdateSubject', signature: '(jid: string, subject: string) => Promise<void>', description: 'Update the group subject/name.' },
  { name: 'groupUpdateDescription', signature: '(jid: string, description?: string) => Promise<void>', description: 'Update the group description. Pass undefined to remove.' },
  { name: 'groupParticipantsUpdate', signature: '(jid: string, participants: string[], action: ParticipantAction) => Promise<{ status: string; jid: string }[]>', description: 'Add, remove, promote, or demote participants.', notes: 'ParticipantAction: "add" | "remove" | "promote" | "demote"' },
  { name: 'groupInviteCode', signature: '(jid: string) => Promise<string | undefined>', description: 'Get the group invite code.' },
  { name: 'groupRevokeInvite', signature: '(jid: string) => Promise<string | undefined>', description: 'Revoke the invite code and generate a new one.' },
  { name: 'groupAcceptInvite', signature: '(code: string) => Promise<string | undefined>', description: 'Join a group by invite code. Returns group JID.' },
  { name: 'groupAcceptInviteV4', signature: '(key: string | WAMessageKey, inviteMessage: proto.Message.IGroupInviteMessage) => Promise<string>', description: 'Accept a v4 invite from a group invite message.' },
  { name: 'groupGetInviteInfo', signature: '(code: string) => Promise<GroupMetadata>', description: 'Get group info from an invite code without joining.' },
  { name: 'groupToggleEphemeral', signature: '(jid: string, ephemeralExpiration: number) => Promise<void>', description: 'Set disappearing messages timer. 0 to disable.', notes: 'Values: 0 (off), 86400 (24h), 604800 (7d), 7776000 (90d)' },
  { name: 'groupSettingUpdate', signature: '(jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>', description: 'Update group settings.', notes: 'announcement = only admins can send. locked = only admins can edit group info.' },
  { name: 'groupFetchAllParticipating', signature: '() => Promise<{ [_: string]: GroupMetadata }>', description: 'Fetch metadata for ALL groups you are in.' },
]

export const GROUP_METADATA_FIELDS = {
  interface: 'GroupMetadata',
  fields: [
    { name: 'id', type: 'string', description: 'Group JID (e.g., 120363...@g.us)' },
    { name: 'owner', type: 'string | undefined', description: 'JID of the group creator' },
    { name: 'addressingMode', type: 'string | undefined', description: 'LID addressing mode: "pn" (phone number) or "lid"' },
    { name: 'subject', type: 'string', description: 'Group name/subject' },
    { name: 'subjectOwner', type: 'string?', description: 'JID of the user who set the subject' },
    { name: 'subjectTime', type: 'number?', description: 'Timestamp when subject was last changed' },
    { name: 'creation', type: 'number?', description: 'Group creation timestamp' },
    { name: 'desc', type: 'string?', description: 'Group description' },
    { name: 'descOwner', type: 'string?', description: 'JID of the user who set the description' },
    { name: 'descId', type: 'string?', description: 'Description ID' },
    { name: 'joinApprovalMode', type: 'boolean?', description: 'Require admin approval to join' },
    { name: 'linkedParent', type: 'string?', description: 'Parent community JID (if part of a community)' },
    { name: 'isCommunity', type: 'boolean?', description: 'Whether this group is a community' },
    { name: 'isCommunityAnnounce', type: 'boolean?', description: 'Whether this is the announcement group of a community' },
    { name: 'restrict', type: 'boolean?', description: 'Only admins can change group settings (locked)' },
    { name: 'announce', type: 'boolean?', description: 'Only admins can send messages (announcement mode)' },
    { name: 'size', type: 'number?', description: 'Number of participants' },
    { name: 'participants', type: 'GroupParticipant[]', description: 'List of participants with admin status' },
    { name: 'ephemeralDuration', type: 'number?', description: 'Disappearing messages duration in seconds' },
  ],
}

export const PARTICIPANT_ACTIONS = [
  { action: 'add', description: 'Add participants to the group' },
  { action: 'remove', description: 'Remove participants from the group' },
  { action: 'promote', description: 'Promote participants to admin' },
  { action: 'demote', description: 'Demote admins to regular participants' },
] as const

export const GROUP_PARTICIPANT_FIELDS = {
  interface: 'GroupParticipant (extends Contact)',
  fields: [
    { name: 'id', type: 'string', description: 'Participant JID' },
    { name: 'isAdmin', type: 'boolean?', description: 'Is a group admin' },
    { name: 'isSuperAdmin', type: 'boolean?', description: 'Is the group creator/super admin' },
    { name: 'admin', type: '"admin" | "superadmin" | null', description: 'Admin role string' },
  ],
}
