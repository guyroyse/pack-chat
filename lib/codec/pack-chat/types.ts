/**
 * PackChat Protocol Types
 *
 * Application-layer protocol for PackChat messages
 */

/**
 * PackChat message types
 */
export enum MessageType {
  ROOT = 0x00,      // Normal message
  REPLY = 0x01,     // Thread reply
  REACTION = 0x02,  // Emoji reaction
  EDIT = 0x03,      // Edit message
  DELETE = 0x04     // Delete message
}

/**
 * Message flags
 */
export interface MessageFlags {
  isPrivate: boolean;  // DM vs channel
  isEmote: boolean;    // /me action
}

/**
 * Parsed PackChat message
 */
export interface PackChatMessage {
  // Header
  version: number;
  type: MessageType;
  flags: MessageFlags;
  channel: string;        // Channel name or destination callsign
  channelSSID: number;

  // IDs (presence depends on message type)
  messageId?: bigint;     // Present for ROOT, REPLY, EDIT, DELETE
  replyToId?: bigint;     // Present for REPLY
  reactToId?: bigint;     // Present for REACTION
  editId?: bigint;        // Present for EDIT
  deleteId?: bigint;      // Present for DELETE

  // Content
  text: string;           // UTF-8 text content

  // Metadata (not in protocol, added by application)
  sourceCallsign?: string;
  sourceSSID?: number;
  timestamp?: Date;
}

/**
 * Outbound message to send
 */
export interface OutboundMessage {
  type: MessageType;
  channel: string;
  channelSSID?: number;
  isPrivate?: boolean;
  isEmote?: boolean;
  text: string;

  // Optional IDs for replies/edits/deletes
  replyToId?: bigint;
  reactToId?: bigint;
  editId?: bigint;
  deleteId?: bigint;
}
