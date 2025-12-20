import { CHANNEL_NAME_LENGTH, PackChatChannel } from './pack-chat-channel'
import { MESSAGE_ID_LENGTH, PackChatMessageId } from './pack-chat-message-id'
import { HEADER_LENGTH, MAX_TEXT_LENGTH, MessageType, PackChatMessageData, PROTOCOL_VERSION } from './types'

/**
 * Encode a PackChat message to bytes
 *
 * @param message Message data to encode
 * @returns Encoded bytes ready for AX.25 info field
 * @throws Error if text exceeds max length
 */
export function encodePackChatMessage(message: PackChatMessageData): Uint8Array {
  // Encode header (8 bytes)
  const header = encodeHeader(message.type, message.channel)

  // Encode IDs and text based on message type
  switch (message.type) {
    case MessageType.ROOT:
      return encodeRootMessage(header, message.messageId, message.text)

    case MessageType.REPLY:
      return encodeReplyMessage(header, message.messageId, message.replyToId, message.text)

    case MessageType.REACTION:
      return encodeReactionMessage(header, message.reactToId, message.emoji)

    case MessageType.EDIT:
      return encodeEditMessage(header, message.messageId, message.editId, message.text)

    case MessageType.DELETE:
      return encodeDeleteMessage(header, message.messageId, message.deleteId)

    default:
      // TypeScript should prevent this, but handle it anyway
      throw new Error(`Unknown message type: ${(message as any).type}.`)
  }
}

/**
 * Encode message header (8 bytes)
 *
 * Byte 0: Version|Type|Reserved
 * Bytes 1-7: Channel name
 *
 * @param type Message type
 * @param channel Channel name
 * @returns 8-byte header
 */
function encodeHeader(type: MessageType, channel: PackChatChannel): Uint8Array {
  const header = new Uint8Array(HEADER_LENGTH)

  // Byte 0: version (bits 7-5) | type (bits 4-2) | reserved (bits 1-0)
  const byte0 = (PROTOCOL_VERSION << 5) | (type << 2) | 0
  header[0] = byte0

  // Bytes 1-7: channel name
  const channelBytes = channel.encode()
  header.set(channelBytes, 1)

  return header
}

/**
 * Encode ROOT message: [header] [message_id] [text]
 */
function encodeRootMessage(header: Uint8Array, messageId: PackChatMessageId, text: string): Uint8Array {
  const textBytes = encodeText(text)
  const totalLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + textBytes.length

  const buffer = new Uint8Array(totalLength)
  let offset = 0

  // Header
  buffer.set(header, offset)
  offset += HEADER_LENGTH

  // Message ID
  buffer.set(messageId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Text
  buffer.set(textBytes, offset)

  return buffer
}

/**
 * Encode REPLY message: [header] [message_id] [reply_to_id] [text]
 */
function encodeReplyMessage(
  header: Uint8Array,
  messageId: PackChatMessageId,
  replyToId: PackChatMessageId,
  text: string
): Uint8Array {
  const textBytes = encodeText(text)
  const totalLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH + textBytes.length

  const buffer = new Uint8Array(totalLength)
  let offset = 0

  // Header
  buffer.set(header, offset)
  offset += HEADER_LENGTH

  // Message ID
  buffer.set(messageId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Reply-to ID
  buffer.set(replyToId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Text
  buffer.set(textBytes, offset)

  return buffer
}

/**
 * Encode REACTION message: [header] [react_to_id] [emoji]
 */
function encodeReactionMessage(header: Uint8Array, reactToId: PackChatMessageId, emoji: string): Uint8Array {
  const emojiBytes = encodeText(emoji)
  const totalLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + emojiBytes.length

  const buffer = new Uint8Array(totalLength)
  let offset = 0

  // Header
  buffer.set(header, offset)
  offset += HEADER_LENGTH

  // React-to ID
  buffer.set(reactToId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Emoji text
  buffer.set(emojiBytes, offset)

  return buffer
}

/**
 * Encode EDIT message: [header] [message_id] [edit_id] [text]
 */
function encodeEditMessage(
  header: Uint8Array,
  messageId: PackChatMessageId,
  editId: PackChatMessageId,
  text: string
): Uint8Array {
  const textBytes = encodeText(text)
  const totalLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH + textBytes.length

  const buffer = new Uint8Array(totalLength)
  let offset = 0

  // Header
  buffer.set(header, offset)
  offset += HEADER_LENGTH

  // Message ID
  buffer.set(messageId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Edit ID
  buffer.set(editId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Text
  buffer.set(textBytes, offset)

  return buffer
}

/**
 * Encode DELETE message: [header] [message_id] [delete_id]
 */
function encodeDeleteMessage(
  header: Uint8Array,
  messageId: PackChatMessageId,
  deleteId: PackChatMessageId
): Uint8Array {
  const totalLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH

  const buffer = new Uint8Array(totalLength)
  let offset = 0

  // Header
  buffer.set(header, offset)
  offset += HEADER_LENGTH

  // Message ID
  buffer.set(messageId.encode(), offset)
  offset += MESSAGE_ID_LENGTH

  // Delete ID
  buffer.set(deleteId.encode(), offset)

  return buffer
}

/**
 * Encode text to UTF-8 bytes with length validation
 *
 * @param text Text to encode
 * @returns UTF-8 encoded bytes
 * @throws Error if text exceeds MAX_TEXT_BYTES
 */
function encodeText(text: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)

  if (bytes.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length: ${bytes.length} bytes (max ${MAX_TEXT_LENGTH}).`)
  }

  return bytes
}
