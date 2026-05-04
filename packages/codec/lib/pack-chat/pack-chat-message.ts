import { encodePackChatMessage } from './pack-chat-encoder'
import { decodePackChatMessage } from './pack-chat-decoder'
import { PackChatChannel } from './pack-chat-channel'
import { PackChatMessageId } from './pack-chat-message-id'
import { MessageType, PackChatMessageData } from './pack-chat-types'

/**
 * Abstract base class for PackChat protocol messages
 *
 * Provides common interface for all message types with polymorphic encode/decode.
 *
 * Concrete message types:
 * - RootMessage: Normal message [message_id] [text]
 * - ReplyMessage: Thread reply [message_id] [reply_to_id] [text]
 * - ReactionMessage: Emoji reaction [react_to_id] [emoji]
 * - EditMessage: Edit message [message_id] [edit_id] [new_text]
 * - DeleteMessage: Delete message [message_id] [delete_id]
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
export abstract class PackChatMessage {
  /** Channel name */
  readonly channel: PackChatChannel

  protected constructor(channel: PackChatChannel) {
    this.channel = channel
  }

  /**
   * Encode this message to bytes for AX.25 info field
   *
   * @returns Encoded message bytes
   */
  abstract encode(): Uint8Array

  /**
   * Decode a PackChat message from bytes (factory method)
   *
   * @param buffer Encoded message bytes (from AX.25 info field)
   * @returns Decoded PackChatMessage subclass instance
   * @throws Error if buffer invalid or unsupported message type
   */
  static decode(buffer: Uint8Array): PackChatMessage {
    const data = decodePackChatMessage(buffer)

    switch (data.type) {
      case MessageType.ROOT:
        return new RootMessage(data.channel, data.messageId, data.text)
      case MessageType.REPLY:
        return new ReplyMessage(data.channel, data.messageId, data.replyToId, data.text)
      case MessageType.REACTION:
        return new ReactionMessage(data.channel, data.messageId, data.reactToId, data.emoji)
      case MessageType.EDIT:
        return new EditMessage(data.channel, data.messageId, data.editId, data.text)
      case MessageType.DELETE:
        return new DeleteMessage(data.channel, data.messageId, data.deleteId)
      default: {
        const exhaustive: never = data
        throw new Error(`Unknown message type: ${(exhaustive as PackChatMessageData).type}`)
      }
    }
  }
}

/**
 * ROOT message: Normal message [message_id] [text]
 */
export class RootMessage extends PackChatMessage {
  readonly messageId: PackChatMessageId
  readonly text: string

  constructor(channel: PackChatChannel, messageId: PackChatMessageId, text: string) {
    super(channel)
    this.messageId = messageId
    this.text = text
  }

  encode(): Uint8Array {
    return encodePackChatMessage({
      type: MessageType.ROOT,
      channel: this.channel,
      messageId: this.messageId,
      text: this.text
    })
  }
}

/**
 * REPLY message: Thread reply [message_id] [reply_to_id] [text]
 */
export class ReplyMessage extends PackChatMessage {
  readonly messageId: PackChatMessageId
  readonly replyToId: PackChatMessageId
  readonly text: string

  constructor(channel: PackChatChannel, messageId: PackChatMessageId, replyToId: PackChatMessageId, text: string) {
    super(channel)
    this.messageId = messageId
    this.replyToId = replyToId
    this.text = text
  }

  encode(): Uint8Array {
    return encodePackChatMessage({
      type: MessageType.REPLY,
      channel: this.channel,
      messageId: this.messageId,
      replyToId: this.replyToId,
      text: this.text
    })
  }
}

/**
 * REACTION message: Emoji reaction [message_id] [react_to_id] [emoji]
 */
export class ReactionMessage extends PackChatMessage {
  readonly messageId: PackChatMessageId
  readonly reactToId: PackChatMessageId
  readonly emoji: string

  constructor(channel: PackChatChannel, messageId: PackChatMessageId, reactToId: PackChatMessageId, emoji: string) {
    super(channel)
    this.messageId = messageId
    this.reactToId = reactToId
    this.emoji = emoji
  }

  encode(): Uint8Array {
    return encodePackChatMessage({
      type: MessageType.REACTION,
      channel: this.channel,
      messageId: this.messageId,
      reactToId: this.reactToId,
      emoji: this.emoji
    })
  }
}

/**
 * EDIT message: Edit message [message_id] [edit_id] [new_text]
 */
export class EditMessage extends PackChatMessage {
  readonly messageId: PackChatMessageId
  readonly editId: PackChatMessageId
  readonly text: string

  constructor(channel: PackChatChannel, messageId: PackChatMessageId, editId: PackChatMessageId, text: string) {
    super(channel)
    this.messageId = messageId
    this.editId = editId
    this.text = text
  }

  encode(): Uint8Array {
    return encodePackChatMessage({
      type: MessageType.EDIT,
      channel: this.channel,
      messageId: this.messageId,
      editId: this.editId,
      text: this.text
    })
  }
}

/**
 * DELETE message: Delete message [message_id] [delete_id] (no text)
 */
export class DeleteMessage extends PackChatMessage {
  readonly messageId: PackChatMessageId
  readonly deleteId: PackChatMessageId

  constructor(channel: PackChatChannel, messageId: PackChatMessageId, deleteId: PackChatMessageId) {
    super(channel)
    this.messageId = messageId
    this.deleteId = deleteId
  }

  encode(): Uint8Array {
    return encodePackChatMessage({
      type: MessageType.DELETE,
      channel: this.channel,
      messageId: this.messageId,
      deleteId: this.deleteId
    })
  }
}
