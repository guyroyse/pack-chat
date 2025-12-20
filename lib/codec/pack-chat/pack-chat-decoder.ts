import { PackChatChannel } from './pack-chat-channel'
import { MESSAGE_ID_LENGTH, PackChatMessageId } from './pack-chat-message-id'
import { HEADER_LENGTH, MessageType, PackChatMessageData, PackChatVersion, PROTOCOL_VERSION } from './types'

/**
 * Decode a PackChat message from bytes
 *
 * @param buffer Encoded message bytes (from AX.25 info field)
 * @returns Decoded message data
 * @throws Error if buffer invalid or unsupported message type
 */
export function decodePackChatMessage(buffer: Uint8Array): PackChatMessageData {
  if (buffer.length < HEADER_LENGTH) {
    throw new Error(
      `Buffer too short for PackChat header: expected at least ${HEADER_LENGTH} bytes, got ${buffer.length}.`
    )
  }

  // Extract byte 0 for version and type validation (before channel decoding)
  const byte0 = buffer[0]
  const version = (byte0 >> 5) & 0b111 // Bits 7-5
  const type = (byte0 >> 2) & 0b111 // Bits 4-2

  // Verify version BEFORE decoding channel (for better error messages)
  if (version !== PROTOCOL_VERSION) {
    throw new Error(`Unsupported protocol version: ${version} (expected ${PROTOCOL_VERSION}).`)
  }

  // Verify message type BEFORE decoding channel
  if (type < MessageType.ROOT || type > MessageType.DELETE) {
    throw new Error(`Unsupported message type: ${type}.`)
  }

  // Now decode the full header including channel
  const { channel } = decodeHeader(buffer)

  // Decode based on message type
  switch (type) {
    case MessageType.ROOT:
      return decodeRootMessage(buffer, channel)

    case MessageType.REPLY:
      return decodeReplyMessage(buffer, channel)

    case MessageType.REACTION:
      return decodeReactionMessage(buffer, channel)

    case MessageType.EDIT:
      return decodeEditMessage(buffer, channel)

    case MessageType.DELETE:
      return decodeDeleteMessage(buffer, channel)

    default:
      // Should never reach here due to earlier validation
      throw new Error(`Unsupported message type: ${type}.`)
  }
}

/**
 * Decode message header
 *
 * @param buffer Message buffer
 * @returns Decoded header fields
 */
function decodeHeader(buffer: Uint8Array): {
  version: PackChatVersion
  type: MessageType
  reserved: number
  channel: PackChatChannel
} {
  const byte0 = buffer[0]

  // Extract fields from byte 0
  const version = (byte0 >> 5) & 0b111 // Bits 7-5
  const type = (byte0 >> 2) & 0b111 // Bits 4-2
  const reserved = byte0 & 0b11 // Bits 1-0

  // Decode channel (bytes 1-7)
  const channelBytes = buffer.slice(1, HEADER_LENGTH)
  const channel = PackChatChannel.decode(channelBytes)

  return {
    version: version as PackChatVersion,
    type: type as MessageType,
    reserved,
    channel
  }
}

/**
 * Decode ROOT message: [header] [message_id] [text]
 */
function decodeRootMessage(buffer: Uint8Array, channel: PackChatChannel): PackChatMessageData {
  const minLength = HEADER_LENGTH + MESSAGE_ID_LENGTH
  if (buffer.length < minLength) {
    throw new Error(`Buffer too short for ROOT message: expected at least ${minLength} bytes, got ${buffer.length}.`)
  }

  // Message ID
  const messageId = PackChatMessageId.decode(buffer.slice(HEADER_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH))

  // Text (remaining bytes)
  const text = decodeText(buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH))

  return {
    type: MessageType.ROOT,
    channel,
    messageId,
    text
  }
}

/**
 * Decode REPLY message: [header] [message_id] [reply_to_id] [text]
 */
function decodeReplyMessage(buffer: Uint8Array, channel: PackChatChannel): PackChatMessageData {
  const minLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH
  if (buffer.length < minLength) {
    throw new Error(`Buffer too short for REPLY message: expected at least ${minLength} bytes, got ${buffer.length}.`)
  }

  // Message ID
  const messageId = PackChatMessageId.decode(buffer.slice(HEADER_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH))

  // Reply-to ID
  const replyToId = PackChatMessageId.decode(
    buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH * 2)
  )

  // Text (remaining bytes)
  const text = decodeText(buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH * 2))

  return {
    type: MessageType.REPLY,
    channel,
    messageId,
    replyToId,
    text
  }
}

/**
 * Decode REACTION message: [header] [react_to_id] [emoji]
 */
function decodeReactionMessage(buffer: Uint8Array, channel: PackChatChannel): PackChatMessageData {
  const minLength = HEADER_LENGTH + MESSAGE_ID_LENGTH
  if (buffer.length < minLength) {
    throw new Error(
      `Buffer too short for REACTION message: expected at least ${minLength} bytes, got ${buffer.length}.`
    )
  }

  // React-to ID
  const reactToId = PackChatMessageId.decode(buffer.slice(HEADER_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH))

  // Emoji text (remaining bytes)
  const emoji = decodeText(buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH))

  return {
    type: MessageType.REACTION,
    channel,
    reactToId,
    emoji
  }
}

/**
 * Decode EDIT message: [header] [message_id] [edit_id] [text]
 */
function decodeEditMessage(buffer: Uint8Array, channel: PackChatChannel): PackChatMessageData {
  const minLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH
  if (buffer.length < minLength) {
    throw new Error(`Buffer too short for EDIT message: expected at least ${minLength} bytes, got ${buffer.length}.`)
  }

  // Message ID
  const messageId = PackChatMessageId.decode(buffer.slice(HEADER_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH))

  // Edit ID
  const editId = PackChatMessageId.decode(
    buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH * 2)
  )

  // Text (remaining bytes)
  const text = decodeText(buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH * 2))

  return {
    type: MessageType.EDIT,
    channel,
    messageId,
    editId,
    text
  }
}

/**
 * Decode DELETE message: [header] [message_id] [delete_id]
 */
function decodeDeleteMessage(buffer: Uint8Array, channel: PackChatChannel): PackChatMessageData {
  const exactLength = HEADER_LENGTH + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH
  if (buffer.length !== exactLength) {
    throw new Error(`Invalid length for DELETE message: expected ${exactLength} bytes, got ${buffer.length}.`)
  }

  // Message ID
  const messageId = PackChatMessageId.decode(buffer.slice(HEADER_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH))

  // Delete ID
  const deleteId = PackChatMessageId.decode(
    buffer.slice(HEADER_LENGTH + MESSAGE_ID_LENGTH, HEADER_LENGTH + MESSAGE_ID_LENGTH * 2)
  )

  return {
    type: MessageType.DELETE,
    channel,
    messageId,
    deleteId
  }
}

/**
 * Decode UTF-8 text from bytes
 *
 * @param bytes Text bytes
 * @returns Decoded string
 */
function decodeText(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}
