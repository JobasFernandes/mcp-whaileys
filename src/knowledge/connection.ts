export interface SocketConfigField {
  name: string
  type: string
  defaultValue: string
  description: string
  notes?: string
}

export const SOCKET_CONFIG_FIELDS: SocketConfigField[] = [
  { name: 'auth', type: 'AuthenticationState', defaultValue: '(REQUIRED)', description: 'Authentication state containing credentials and Signal keys.', notes: 'Must provide { creds, keys }. Use initAuthCreds() for new sessions. Keys should use makeCacheableSignalKeyStore for performance.' },
  { name: 'version', type: 'WAVersion ([number, number, number])', defaultValue: 'from baileys-version.json', description: 'WhatsApp Web version to use.', notes: 'Use fetchLatestWaWebVersion() for latest, or hardcode fallback like [2, 3000, 1015901307].' },
  { name: 'browser', type: 'WABrowserDescription ([string, string, string])', defaultValue: 'Browsers.baileys("Chrome")', description: 'Browser identification [platform, browser, version].', notes: 'Production pattern uses Browsers.ubuntu("Chrome").' },
  { name: 'waWebSocketUrl', type: 'string | URL', defaultValue: '"wss://web.whatsapp.com/ws/chat"', description: 'WebSocket URL for WhatsApp Web connection.' },
  { name: 'connectTimeoutMs', type: 'number', defaultValue: '20000', description: 'Timeout for establishing the WebSocket connection.', notes: 'Production uses 25000ms.' },
  { name: 'defaultQueryTimeoutMs', type: 'number | undefined', defaultValue: '60000', description: 'Default timeout for queries sent to WhatsApp servers.' },
  { name: 'keepAliveIntervalMs', type: 'number', defaultValue: '15000', description: 'Interval for WebSocket keep-alive pings.' },
  { name: 'printQRInTerminal', type: 'boolean', defaultValue: 'false', description: 'Print QR code in terminal for scanning.' },
  { name: 'emitOwnEvents', type: 'boolean', defaultValue: 'true', description: 'Emit events for own messages/actions.' },
  { name: 'markOnlineOnConnect', type: 'boolean', defaultValue: 'true', description: 'Show as online when connected.', notes: 'Production sets this to false to avoid revealing bot presence.' },
  { name: 'retryRequestDelayMs', type: 'number', defaultValue: '250', description: 'Delay between retry requests.', notes: 'Production uses 500ms.' },
  { name: 'qrTimeout', type: 'number | undefined', defaultValue: 'undefined', description: 'Custom QR code expiration timeout in ms.' },
  { name: 'fireInitQueries', type: 'boolean', defaultValue: 'true', description: 'Fire initial queries on connection (contacts, chats, status).' },
  { name: 'syncFullHistory', type: 'boolean', defaultValue: 'false', description: 'Sync full chat history on connection.' },
  { name: 'generateHighQualityLinkPreview', type: 'boolean', defaultValue: 'false', description: 'Generate high quality thumbnails for link previews.', notes: 'Production enables this for better UX.' },
  { name: 'linkPreviewImageThumbnailWidth', type: 'number', defaultValue: '192', description: 'Width of link preview image thumbnails.' },
  { name: 'shouldIgnoreJid', type: '(jid: string) => boolean | undefined', defaultValue: '() => false', description: 'Filter function to ignore messages from specific JIDs.', notes: 'Production pattern: ignore broadcast (isJidBroadcast) and newsletter (isJidNewsletter) JIDs based on feature flags.' },
  { name: 'getMessage', type: '(key: proto.IMessageKey) => Promise<proto.IMessage | undefined>', defaultValue: 'async () => undefined', description: 'Function to retrieve messages for retry/decrypt. Critical for message retry handling.', notes: 'Production uses an LRU cache (max: 10000, ttl: 5min) for getMessage.' },
  { name: 'msgRetryCounterMap', type: 'MessageRetryMap | undefined', defaultValue: 'undefined', description: 'Map tracking message retry counts.', notes: 'Production uses LRU cache proxy (max: 5000, ttl: 10min).' },
  { name: 'shouldSyncHistoryMessage', type: '(msg: proto.Message.IHistorySyncNotification) => boolean', defaultValue: '() => true', description: 'Filter function to decide which history sync messages to process.' },
  { name: 'transactionOpts', type: 'TransactionCapabilityOptions', defaultValue: '{ maxCommitRetries: 10, delayBetweenTriesMs: 3000 }', description: 'Options for Signal Protocol transaction commits.' },
  { name: 'agent', type: 'Agent | undefined', defaultValue: 'undefined', description: 'HTTP agent for WebSocket connection (proxy support).' },
  { name: 'fetchAgent', type: 'Agent | undefined', defaultValue: 'undefined', description: 'HTTP agent for fetch requests (media upload/download proxy).' },
  { name: 'options', type: 'AxiosRequestConfig', defaultValue: '{}', description: 'Additional Axios options for HTTP requests.' },
  { name: 'mediaCache', type: 'NodeCache | undefined', defaultValue: 'undefined', description: 'Cache for media connections.' },
  { name: 'customUploadHosts', type: 'MediaConnInfo["hosts"]', defaultValue: '[]', description: 'Custom hosts for media uploads.' },
  { name: 'userDevicesCache', type: 'NodeCache | undefined', defaultValue: 'undefined', description: 'Cache for user device lists.' },
  { name: 'groupMetadataCache', type: 'NodeCache | undefined', defaultValue: 'new NodeCache({ stdTTL: 900, useClones: false })', description: 'Cache for group metadata (15 min TTL).' },
  { name: 'sentMessagesCache', type: 'NodeCache | undefined', defaultValue: 'new NodeCache({ stdTTL: 20, useClones: false })', description: 'Cache for recently sent messages (20s TTL).' },
  { name: 'shouldResendMessageOn475AckError', type: 'boolean | undefined', defaultValue: 'undefined', description: 'Whether to resend messages on 475 ack error.' },
]

export interface DisconnectReasonInfo {
  name: string
  code: number
  description: string
  shouldReconnect: boolean
  notes?: string
}

export const DISCONNECT_REASONS: DisconnectReasonInfo[] = [
  { name: 'connectionClosed', code: 428, shouldReconnect: true, description: 'Connection was closed normally.' },
  { name: 'connectionLost', code: 408, shouldReconnect: true, description: 'Connection was lost (timeout).' },
  { name: 'connectionReplaced', code: 440, shouldReconnect: false, description: 'Connection was replaced by another device/session.' },
  { name: 'timedOut', code: 408, shouldReconnect: true, description: 'Connection timed out (same code as connectionLost).' },
  { name: 'loggedOut', code: 401, shouldReconnect: false, description: 'Session was logged out. Must clear auth state and re-authenticate.', notes: 'CRITICAL: clearAuthState before reconnecting. User must scan QR again.' },
  { name: 'badSession', code: 500, shouldReconnect: false, description: 'Session data is corrupted or invalid.', notes: 'CRITICAL: clearAuthState and create new session.' },
  { name: 'restartRequired', code: 515, shouldReconnect: true, description: 'Server requested a restart.', notes: 'Use extended delay before reconnecting (longer than normal backoff).' },
  { name: 'multideviceMismatch', code: 411, shouldReconnect: false, description: 'Multi-device version mismatch.', notes: 'CRITICAL: may need to update Whaileys version.' },
  { name: 'forbidden', code: 403, shouldReconnect: false, description: 'Access forbidden — account may be banned or restricted.', notes: 'CRITICAL: do NOT reconnect. Account may need review.' },
  { name: 'unavailableService', code: 503, shouldReconnect: true, description: 'WhatsApp service temporarily unavailable.' },
]

export const CONNECTION_STATES = {
  type: 'WAConnectionState',
  definition: '"open" | "connecting" | "close"',
  fields: [
    { name: 'connection', type: 'WAConnectionState', description: 'Current connection state.' },
    { name: 'lastDisconnect', type: '{ error: Error | undefined; date: Date } | undefined', description: 'Last disconnect error and timestamp. Check error.output.statusCode for DisconnectReason.' },
    { name: 'isNewLogin', type: 'boolean | undefined', description: 'Whether this is a new login (first connection with these credentials).' },
    { name: 'qr', type: 'string | undefined', description: 'Current QR code string for scanning.' },
    { name: 'receivedPendingNotifications', type: 'boolean | undefined', description: 'Whether all pending offline notifications have been received.' },
    { name: 'isOnline', type: 'boolean | undefined', description: 'Whether the client is shown as active/online.' },
  ],
}

export const AUTH_STATE_PATTERN = {
  description: 'AuthenticationState structure for makeWASocket',
  definition: `{
  creds: AuthenticationCreds,
  keys: SignalKeyStore
}`,
  initMethod: 'initAuthCreds()',
  cacheableKeys: 'makeCacheableSignalKeyStore(keys, logger)',
  productionPattern: `Redis + AES-256-GCM encryption pattern:
- Key format: sessions:\${tenantId}:\${sessionId}:\${dataKey}
- Credentials: initAuthCreds() for new, load from Redis for existing
- Signal keys: get(type, ids) reads \${type}-\${id} keys; set(data) writes/deletes per category+id
- Special: app-state-sync-key requires proto.Message.AppStateSyncKeyData.fromObject()
- Serialization: JSON.stringify(data, BufferJSON.replacer) / JSON.parse(data, BufferJSON.reviver)
- Encryption: AES-256-GCM with iv:authTag:encrypted format`,
}

export const RECONNECTION_PATTERN = {
  strategy: 'Exponential backoff',
  formula: 'delay * 2^retries',
  maxRetries: 5,
  criticalCodes: ['loggedOut (401)', 'badSession (500)', 'forbidden (403)', 'multideviceMismatch (411)'],
  criticalAction: 'clearAuthState + do NOT reconnect',
  nonCriticalAction: 'exponential backoff with max retries',
  restartRequiredCode: 515,
  restartRequiredAction: 'Use extended delay instead of normal backoff',
  qrRetries: {
    max: 3,
    onMaxReached: 'clearAuthState + disconnect',
  },
}

export const SUPPRESSED_LOG_MESSAGES = [
  'myAppStateKeyId not synced',
  'failed to decrypt message',
  'Connection Closed',
  'stream errored out',
  'unexpected error in',
]
