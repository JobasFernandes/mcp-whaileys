import type { CodeExample } from './index.js'

export const GROUP_EXAMPLES: CodeExample[] = [
  {
    id: 'group-create',
    title: 'Create Group',
    description: 'Create a new WhatsApp group with a subject and initial participants.',
    code: `const group = await socket.groupCreate('My Group', [
  '5511999999999@s.whatsapp.net',
  '5511888888888@s.whatsapp.net'
])

console.log('Group created:', group.id)`,
    tags: ['group', 'create', 'groupCreate'],
  },
  {
    id: 'group-update-subject',
    title: 'Update Group Subject',
    description: 'Change the group name/subject and description.',
    code: `await socket.groupUpdateSubject(groupJid, 'New Group Name')

await socket.groupUpdateDescription(groupJid, 'Updated group description')`,
    tags: ['group', 'subject', 'description', 'update'],
  },
  {
    id: 'group-participants',
    title: 'Manage Group Participants',
    description: 'Add, remove, promote, or demote group participants.',
    code: `const participants = ['5511999999999@s.whatsapp.net']

await socket.groupParticipantsUpdate(groupJid, participants, 'add')

await socket.groupParticipantsUpdate(groupJid, participants, 'remove')

await socket.groupParticipantsUpdate(groupJid, participants, 'promote')

await socket.groupParticipantsUpdate(groupJid, participants, 'demote')`,
    tags: ['group', 'participants', 'add', 'remove', 'promote', 'demote'],
  },
  {
    id: 'group-invite',
    title: 'Group Invite Code',
    description: 'Get, revoke, or accept group invite codes.',
    code: `const code = await socket.groupInviteCode(groupJid)
console.log('Invite link: https://chat.whatsapp.com/' + code)

const newCode = await socket.groupRevokeInvite(groupJid)

const joinedGroupJid = await socket.groupAcceptInvite(code!)

const info = await socket.groupGetInviteInfo(code!)`,
    tags: ['group', 'invite', 'code', 'join'],
  },
  {
    id: 'group-ephemeral',
    title: 'Toggle Disappearing Messages',
    description: 'Enable or disable disappearing messages in a group. Values: 0 (off), 86400 (24h), 604800 (7d), 7776000 (90d).',
    code: `await socket.groupToggleEphemeral(groupJid, 604800)

await socket.groupToggleEphemeral(groupJid, 0)`,
    tags: ['group', 'ephemeral', 'disappearing', 'timer'],
  },
  {
    id: 'group-settings',
    title: 'Update Group Settings',
    description: 'Change group settings: announcement (only admins send) and locked (only admins edit info).',
    code: `await socket.groupSettingUpdate(groupJid, 'announcement')

await socket.groupSettingUpdate(groupJid, 'not_announcement')

await socket.groupSettingUpdate(groupJid, 'locked')

await socket.groupSettingUpdate(groupJid, 'unlocked')`,
    tags: ['group', 'settings', 'announcement', 'locked', 'admin'],
  },
  {
    id: 'group-metadata',
    title: 'Fetch Group Metadata',
    description: 'Get full group metadata including participants, or fetch all groups.',
    code: `const metadata = await socket.groupMetadata(groupJid)
console.log('Subject:', metadata.subject)
console.log('Participants:', metadata.participants.length)
console.log('Admins:', metadata.participants.filter(p => p.admin).length)

const allGroups = await socket.groupFetchAllParticipating()
for (const [jid, group] of Object.entries(allGroups)) {
  console.log(group.subject, '-', group.size, 'members')
}`,
    tags: ['group', 'metadata', 'participants', 'info'],
  },
]
