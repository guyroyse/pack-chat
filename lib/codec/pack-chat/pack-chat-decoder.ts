import { PackChatChannel } from './pack-chat-channel'
import { MESSAGE_ID_LENGTH, PackChatMessageId } from './pack-chat-message-id'
import {
  HEADER_LENGTH,
  MessageType,
  PackChatMessageData,
  PackChatRootMessageData,
  PackChatReplyMessageData,
  PackChatReactionMessageData,
  PackChatEditMessageData,
  PackChatDeleteMessageData,
  PackChatVersion,
  PROTOCOL_VERSION
} from './pack-chat-types'

/**
 * Decode a PackChat message from bytes
 *
 * @param buffer Encoded message bytes (from AX.25 info field)
 * @returns Decoded message data
 * @throws Error if buffer invalid or unsupported message type
 */
export function decodePackChatMessage(buffer: Uint8Array): PackChatMessageData {
  if (buffer.length < HEADER_LENGTH)
    throw new Error(
      `Buffer too short for PackChat header: expected at least ${HEADER_LENGTH} bytes, got ${buffer.length}.`
    )

  let index = 0

  const { type } = decodeFormatByte()

  // Decode channel (bytes 1-7)
  const channel = decodeChannel()

  // Decode based on message type
  switch (type) {
    case MessageType.ROOT:
      return decodeRootMessage()
    case MessageType.REPLY:
      return decodeReplyMessage()
    case MessageType.REACTION:
      return decodeReactionMessage()
    case MessageType.EDIT:
      return decodeEditMessage()
    case MessageType.DELETE:
      return decodeDeleteMessage()
    default:
      throw new Error(`Unsupported message type: ${type}.`)
  }

  /**
   * Decode format byte (version, type, reserved) and validate
   *
   * @param formatByte First byte of message containing version and type
   * @returns Decoded fields
   * @throws Error if version or type is invalid
   */
  function decodeFormatByte(): {
    version: PackChatVersion
    type: MessageType
  } {
    const formatByte = buffer[index]

    // Extract and verify version
    const version = (formatByte & 0b11100000) >> 5
    if (version !== PROTOCOL_VERSION)
      throw new Error(`Unsupported protocol version: ${version} (expected ${PROTOCOL_VERSION}).`)

    // Extract and verify message type
    const type = (formatByte & 0b00011100) >> 2
    if (type < MessageType.ROOT || type > MessageType.DELETE) throw new Error(`Unsupported message type: ${type}.`)

    // Extract and verify reserved bits
    const reserved = formatByte & 0b00000011
    if (reserved !== 0) throw new Error(`Invalid format byte: reserved bits must be 0, got ${reserved}.`)

    // Move to next byte
    index++

    // Return decoded fields
    return {
      version: version as PackChatVersion,
      type: type as MessageType
    }
  }

  /**
   * Decode channel from message header
   *
   * @param channelBytes Channel bytes (7 bytes from message header)
   * @returns Decoded channel
   */
  function decodeChannel(): PackChatChannel {
    const channelBytes = buffer.slice(index, index + 7)
    index += 7

    return PackChatChannel.decode(channelBytes)
  }

  /**
   * Decode ROOT message: [message_id] [text]
   */
  function decodeRootMessage(): PackChatRootMessageData {
    if (buffer.length < index + MESSAGE_ID_LENGTH)
      throw new Error(`Buffer too short for ROOT message: expected at least ${MESSAGE_ID_LENGTH} more bytes.`)

    // Message ID
    const messageId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Text (remaining bytes)
    const text = decodeText(buffer.slice(index))

    return {
      type: MessageType.ROOT,
      channel,
      messageId,
      text
    }
  }

  /**
   * Decode REPLY message: [message_id] [reply_to_id] [text]
   */
  function decodeReplyMessage(): PackChatReplyMessageData {
    if (buffer.length < index + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH)
      throw new Error(`Buffer too short for REPLY message: expected at least ${MESSAGE_ID_LENGTH * 2} more bytes.`)

    // Message ID
    const messageId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Reply-to ID
    const replyToId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Text (remaining bytes)
    const text = decodeText(buffer.slice(index))

    return {
      type: MessageType.REPLY,
      channel,
      messageId,
      replyToId,
      text
    }
  }

  /**
   * Decode REACTION message: [message_id] [react_to_id] [emoji]
   */
  function decodeReactionMessage(): PackChatReactionMessageData {
    if (buffer.length < index + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH)
      throw new Error(`Buffer too short for REACTION message: expected at least ${MESSAGE_ID_LENGTH * 2} more bytes.`)

    // Message ID
    const messageId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // React-to ID
    const reactToId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Emoji text (remaining bytes)
    const emoji = decodeText(buffer.slice(index))

    return {
      type: MessageType.REACTION,
      channel,
      messageId,
      reactToId,
      emoji
    }
  }

  /**
   * Decode EDIT message: [message_id] [edit_id] [text]
   */
  function decodeEditMessage(): PackChatEditMessageData {
    if (buffer.length < index + MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH)
      throw new Error(`Buffer too short for EDIT message: expected at least ${MESSAGE_ID_LENGTH * 2} more bytes.`)

    // Message ID
    const messageId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Edit ID
    const editId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Text (remaining bytes)
    const text = decodeText(buffer.slice(index))

    return {
      type: MessageType.EDIT,
      channel,
      messageId,
      editId,
      text
    }
  }

  /**
   * Decode DELETE message: [message_id] [delete_id]
   */
  function decodeDeleteMessage(): PackChatDeleteMessageData {
    const expectedRemaining = MESSAGE_ID_LENGTH + MESSAGE_ID_LENGTH
    if (buffer.length !== index + expectedRemaining)
      throw new Error(
        `Invalid length for DELETE message: expected exactly ${expectedRemaining} more bytes, got ${
          buffer.length - index
        }.`
      )

    // Message ID
    const messageId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

    // Delete ID
    const deleteId = PackChatMessageId.decode(buffer.slice(index, index + MESSAGE_ID_LENGTH))
    index += MESSAGE_ID_LENGTH

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
}
