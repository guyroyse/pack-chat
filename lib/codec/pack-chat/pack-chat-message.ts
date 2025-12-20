import { decodePackChatMessage } from './pack-chat-decoder'
import { encodePackChatMessage } from './pack-chat-encoder'
import { PackChatChannel } from './pack-chat-channel'
import { PackChatMessageId } from './pack-chat-message-id'
import { MessageType, PackChatMessageData } from './types'

/**
 * PackChat Message class
 *
 * Represents a complete PackChat protocol message.
 *
 * Message types:
 * - ROOT: Normal message [message_id] [text]
 * - REPLY: Thread reply [message_id] [reply_to_id] [text]
 * - REACTION: Emoji reaction [react_to_id] [emoji]
 * - EDIT: Edit message [message_id] [edit_id] [new_text]
 * - DELETE: Delete message [message_id] [delete_id]
 *
 * Wire format:
 * ┌────────────────────────────────────────────────────────────┐
 * │ Header (8 bytes)                                           │
 * ├────────────────────────────────────────────────────────────┤
 * │ Byte 0: Version|Type|Reserved                              │
 * │ Bytes 1-7: Channel name                                    │
 * ├────────────────────────────────────────────────────────────┤
 * │ Variable ID Fields (8 bytes each)                          │
 * ├────────────────────────────────────────────────────────────┤
 * │ Message Text (UTF-8, max 224 bytes)                        │
 * └────────────────────────────────────────────────────────────┘
 */
export class PackChatMessage {
  #data: PackChatMessageData

  private constructor(data: PackChatMessageData) {
    this.#data = data
  }

  /** Message type */
  get type(): MessageType {
    return this.#data.type
  }

  /** Channel */
  get channel(): PackChatChannel {
    return this.#data.channel
  }

  /** Message ID (for ROOT, REPLY, EDIT, DELETE) */
  get messageId(): PackChatMessageId | undefined {
    if ('messageId' in this.#data) {
      return this.#data.messageId
    }
    return undefined
  }

  /** Reply-to ID (for REPLY) */
  get replyToId(): PackChatMessageId | undefined {
    if (this.#data.type === MessageType.REPLY) {
      return this.#data.replyToId
    }
    return undefined
  }

  /** React-to ID (for REACTION) */
  get reactToId(): PackChatMessageId | undefined {
    if (this.#data.type === MessageType.REACTION) {
      return this.#data.reactToId
    }
    return undefined
  }

  /** Edit ID (for EDIT) */
  get editId(): PackChatMessageId | undefined {
    if (this.#data.type === MessageType.EDIT) {
      return this.#data.editId
    }
    return undefined
  }

  /** Delete ID (for DELETE) */
  get deleteId(): PackChatMessageId | undefined {
    if (this.#data.type === MessageType.DELETE) {
      return this.#data.deleteId
    }
    return undefined
  }

  /** Message text (for ROOT, REPLY, EDIT) */
  get text(): string | undefined {
    if ('text' in this.#data) {
      return this.#data.text
    }
    return undefined
  }

  /** Emoji text (for REACTION) */
  get emoji(): string | undefined {
    if (this.#data.type === MessageType.REACTION) {
      return this.#data.emoji
    }
    return undefined
  }

  /** Raw message data (discriminated union) */
  get data(): PackChatMessageData {
    return this.#data
  }

  /**
   * Encode this message to bytes for AX.25 info field
   *
   * @returns Encoded message bytes
   */
  encode(): Uint8Array {
    return encodePackChatMessage(this.#data)
  }

  /**
   * Decode a PackChat message from bytes
   *
   * @param buffer Encoded message bytes (from AX.25 info field)
   * @returns Decoded PackChatMessage instance
   * @throws Error if buffer invalid or unsupported message type
   */
  static decode(buffer: Uint8Array): PackChatMessage {
    const data = decodePackChatMessage(buffer)
    return new PackChatMessage(data)
  }

  /**
   * Create a ROOT message
   *
   * @param channel Channel name
   * @param messageId Message ID
   * @param text Message text (max 224 bytes UTF-8)
   * @returns PackChatMessage instance
   * @throws Error if text exceeds maximum length
   */
  static root(channel: PackChatChannel, messageId: PackChatMessageId, text: string): PackChatMessage {
    // Validate by encoding (will throw if text too long)
    const data: PackChatMessageData = {
      type: MessageType.ROOT,
      channel,
      messageId,
      text,
    }

    // Pre-validate by encoding
    encodePackChatMessage(data)

    return new PackChatMessage(data)
  }

  /**
   * Create a REPLY message
   *
   * @param channel Channel name
   * @param messageId Message ID
   * @param replyToId ID of message being replied to
   * @param text Reply text (max 224 bytes UTF-8)
   * @returns PackChatMessage instance
   * @throws Error if text exceeds maximum length
   */
  static reply(
    channel: PackChatChannel,
    messageId: PackChatMessageId,
    replyToId: PackChatMessageId,
    text: string
  ): PackChatMessage {
    const data: PackChatMessageData = {
      type: MessageType.REPLY,
      channel,
      messageId,
      replyToId,
      text,
    }

    // Pre-validate by encoding
    encodePackChatMessage(data)

    return new PackChatMessage(data)
  }

  /**
   * Create a REACTION message
   *
   * @param channel Channel name
   * @param reactToId ID of message being reacted to
   * @param emoji Emoji text (max 224 bytes UTF-8)
   * @returns PackChatMessage instance
   * @throws Error if emoji exceeds maximum length
   */
  static reaction(channel: PackChatChannel, reactToId: PackChatMessageId, emoji: string): PackChatMessage {
    const data: PackChatMessageData = {
      type: MessageType.REACTION,
      channel,
      reactToId,
      emoji,
    }

    // Pre-validate by encoding
    encodePackChatMessage(data)

    return new PackChatMessage(data)
  }

  /**
   * Create an EDIT message
   *
   * @param channel Channel name
   * @param messageId Message ID of this edit
   * @param editId ID of message being edited
   * @param text New text (max 224 bytes UTF-8)
   * @returns PackChatMessage instance
   * @throws Error if text exceeds maximum length
   */
  static edit(
    channel: PackChatChannel,
    messageId: PackChatMessageId,
    editId: PackChatMessageId,
    text: string
  ): PackChatMessage {
    const data: PackChatMessageData = {
      type: MessageType.EDIT,
      channel,
      messageId,
      editId,
      text,
    }

    // Pre-validate by encoding
    encodePackChatMessage(data)

    return new PackChatMessage(data)
  }

  /**
   * Create a DELETE message
   *
   * @param channel Channel name
   * @param messageId Message ID of this delete
   * @param deleteId ID of message being deleted
   * @returns PackChatMessage instance
   */
  static delete(channel: PackChatChannel, messageId: PackChatMessageId, deleteId: PackChatMessageId): PackChatMessage {
    const data: PackChatMessageData = {
      type: MessageType.DELETE,
      channel,
      messageId,
      deleteId,
    }

    return new PackChatMessage(data)
  }
}
