import { PackChatChannel } from './pack-chat-channel'
import { PackChatMessageId } from './pack-chat-message-id'
import { MAX_TEXT_LENGTH, MessageType, PackChatMessageData, PROTOCOL_VERSION } from './pack-chat-types'

/**
 * Encode a PackChat message to bytes
 *
 * @param message Message data to encode
 * @returns Encoded bytes ready for AX.25 info field
 * @throws Error if text exceeds max length
 */
export function encodePackChatMessage(message: PackChatMessageData): Uint8Array {
  // Encode format byte and channel
  const formatByte = encodeFormatByte(message.type)
  const channelBytes = encodeChannel(message.channel)

  // Encode message payload based on type
  let payloadBytes: Uint8Array

  switch (message.type) {
    case MessageType.ROOT:
      payloadBytes = encodeRootMessage(message.messageId, message.text)
      break
    case MessageType.REPLY:
      payloadBytes = encodeReplyMessage(message.messageId, message.replyToId, message.text)
      break
    case MessageType.REACTION:
      payloadBytes = encodeReactionMessage(message.messageId, message.reactToId, message.emoji)
      break
    case MessageType.EDIT:
      payloadBytes = encodeEditMessage(message.messageId, message.editId, message.text)
      break
    case MessageType.DELETE:
      payloadBytes = encodeDeleteMessage(message.messageId, message.deleteId)
      break
    default:
      throw new Error(`Unknown message type: ${(message as any).type}.`)
  }

  // Combine all parts into final byte array
  return new Uint8Array([formatByte, ...channelBytes, ...payloadBytes])

  /**
   * Encode format byte (version, type, reserved)
   *
   * Byte 0: version (bits 7-5) | type (bits 4-2) | reserved (bits 1-0)
   */
  function encodeFormatByte(type: MessageType): number {
    return (PROTOCOL_VERSION << 5) | (type << 2) | 0
  }

  /**
   * Encode channel to bytes
   */
  function encodeChannel(channel: PackChatChannel): Uint8Array {
    return channel.encode()
  }

  /**
   * Encode ROOT message: [message_id] [text]
   */
  function encodeRootMessage(messageId: PackChatMessageId, text: string): Uint8Array {
    const messageIdBytes = messageId.encode()
    const textBytes = encodeText(text)
    return new Uint8Array([...messageIdBytes, ...textBytes])
  }

  /**
   * Encode REPLY message: [message_id] [reply_to_id] [text]
   */
  function encodeReplyMessage(messageId: PackChatMessageId, replyToId: PackChatMessageId, text: string): Uint8Array {
    const messageIdBytes = messageId.encode()
    const replyToIdBytes = replyToId.encode()
    const textBytes = encodeText(text)
    return new Uint8Array([...messageIdBytes, ...replyToIdBytes, ...textBytes])
  }

  /**
   * Encode REACTION message: [message_id] [react_to_id] [emoji]
   */
  function encodeReactionMessage(
    messageId: PackChatMessageId,
    reactToId: PackChatMessageId,
    emoji: string
  ): Uint8Array {
    const messageIdBytes = messageId.encode()
    const reactToIdBytes = reactToId.encode()
    const emojiBytes = encodeText(emoji)
    return new Uint8Array([...messageIdBytes, ...reactToIdBytes, ...emojiBytes])
  }

  /**
   * Encode EDIT message: [message_id] [edit_id] [text]
   */
  function encodeEditMessage(messageId: PackChatMessageId, editId: PackChatMessageId, text: string): Uint8Array {
    const messageIdBytes = messageId.encode()
    const editIdBytes = editId.encode()
    const textBytes = encodeText(text)
    return new Uint8Array([...messageIdBytes, ...editIdBytes, ...textBytes])
  }

  /**
   * Encode DELETE message: [message_id] [delete_id]
   */
  function encodeDeleteMessage(messageId: PackChatMessageId, deleteId: PackChatMessageId): Uint8Array {
    const messageIdBytes = messageId.encode()
    const deleteIdBytes = deleteId.encode()
    return new Uint8Array([...messageIdBytes, ...deleteIdBytes])
  }

  /**
   * Encode text to UTF-8 bytes with length validation
   */
  function encodeText(text: string): Uint8Array {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)

    if (bytes.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text exceeds maximum length: ${bytes.length} bytes (max ${MAX_TEXT_LENGTH}).`)
    }

    return bytes
  }
}
