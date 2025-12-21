/**
 * PackChat Protocol Types
 *
 * Application-layer protocol for PackChat messages
 */

import type { PackChatChannel } from './pack-chat-channel'
import type { PackChatMessageId } from './pack-chat-message-id'

/**
 * PackChat protocol version (3-bit field)
 */
export type PackChatVersion = 0

/**
 * Current protocol version
 */
export const PROTOCOL_VERSION: PackChatVersion = 0

/**
 * PackChat message types (3-bit field)
 */
export enum MessageType {
  ROOT = 0x0, // Normal message
  REPLY = 0x1, // Thread reply
  REACTION = 0x2, // Emoji reaction
  EDIT = 0x3, // Edit message
  DELETE = 0x4 // Delete message
  // 0x5-0x7 reserved for future use
}

/**
 * Protocol size constants
 */
export const MAX_TEXT_LENGTH = 224
export const HEADER_LENGTH = 8

/**
 * PackChat channel name type (validated string)
 */
export type PackChatChannelName = string

/**
 * ROOT message: Normal message [message_id] [text]
 */
export type PackChatRootMessage = {
  type: MessageType.ROOT
  channel: PackChatChannel
  messageId: PackChatMessageId
  text: string
}

/**
 * REPLY message: Thread reply [message_id] [reply_to_id] [text]
 */
export type PackChatReplyMessage = {
  type: MessageType.REPLY
  channel: PackChatChannel
  messageId: PackChatMessageId
  replyToId: PackChatMessageId
  text: string
}

/**
 * REACTION message: Emoji reaction [message_id] [react_to_id] [emoji]
 */
export type PackChatReactionMessage = {
  type: MessageType.REACTION
  channel: PackChatChannel
  messageId: PackChatMessageId
  reactToId: PackChatMessageId
  emoji: string
}

/**
 * EDIT message: Edit message [message_id] [edit_id] [new_text]
 */
export type PackChatEditMessage = {
  type: MessageType.EDIT
  channel: PackChatChannel
  messageId: PackChatMessageId
  editId: PackChatMessageId
  text: string
}

/**
 * DELETE message: Delete message [message_id] [delete_id] (no text)
 */
export type PackChatDeleteMessage = {
  type: MessageType.DELETE
  channel: PackChatChannel
  messageId: PackChatMessageId
  deleteId: PackChatMessageId
}

/**
 * Union type for all PackChat message types
 */
export type PackChatMessageData =
  | PackChatRootMessage
  | PackChatReplyMessage
  | PackChatReactionMessage
  | PackChatEditMessage
  | PackChatDeleteMessage
