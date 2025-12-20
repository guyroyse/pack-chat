/**
 * PackChat Protocol Types
 *
 * Application-layer protocol for PackChat messages
 */

/**
 * PackChat message types (3-bit field)
 */
export enum MessageType {
  ROOT = 0x0,      // Normal message
  REPLY = 0x1,     // Thread reply
  REACTION = 0x2,  // Emoji reaction
  EDIT = 0x3,      // Edit message
  DELETE = 0x4     // Delete message
  // 0x5-0x7 reserved for future use
}
