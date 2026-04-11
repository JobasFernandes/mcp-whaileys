export interface WACallUpdateInfo {
  value: string
  description: string
}

export const WA_CALL_UPDATE_TYPES: WACallUpdateInfo[] = [
  { value: 'offer', description: 'Incoming call received. Use rejectCall() to decline.' },
  { value: 'ringing', description: 'Call is ringing on the remote device.' },
  { value: 'timeout', description: 'Call was not answered within the timeout period.' },
  { value: 'reject', description: 'Call was rejected by the recipient.' },
  { value: 'accept', description: 'Call was accepted by the recipient.' },
  { value: 'terminate', description: 'Call has ended (either party hung up).' },
]

export interface WACallEventField {
  name: string
  type: string
  description: string
  optional: boolean
}

export const WA_CALL_EVENT_FIELDS: WACallEventField[] = [
  { name: 'chatId', type: 'string', description: 'JID of the chat where the call originated', optional: false },
  { name: 'from', type: 'string', description: 'JID of the caller', optional: false },
  { name: 'isGroup', type: 'boolean', description: 'Whether this is a group call', optional: true },
  { name: 'id', type: 'string', description: 'Unique call identifier', optional: false },
  { name: 'date', type: 'Date', description: 'Timestamp of the call event', optional: false },
  { name: 'isVideo', type: 'boolean', description: 'Whether this is a video call (false = audio only)', optional: true },
  { name: 'status', type: 'WACallUpdateType', description: 'Current call status (offer, ringing, timeout, reject, accept, terminate)', optional: false },
  { name: 'offline', type: 'boolean', description: 'Whether the call event was received while offline', optional: false },
  { name: 'latencyMs', type: 'number', description: 'Network latency in milliseconds', optional: true },
]

export const CALL_HANDLING_PATTERN = {
  eventName: 'call',
  payloadType: 'WACallEvent[]',
  rejectMethod: 'rejectCall(callId: string, callFrom: string) => Promise<void>',
  productionPattern: `socket.ev.on('call', async (calls) => {
  for (const call of calls) {
    if (call.status === 'offer') {
      await socket.rejectCall(call.id, call.from)
    }
  }
})`,
  notes: `Calls arrive as an array of WACallEvent objects.
For bots, the standard pattern is to auto-reject incoming calls.
The 'offer' status indicates a new incoming call that can be rejected.
Group calls include isGroup: true and may have multiple participants.
Offline calls (offline: true) were received while the client was disconnected.`,
}
