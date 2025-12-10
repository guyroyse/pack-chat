import { FEND, FESC, KISS_Command, KISS_Payload, KISS_Port, TFEND, TFESC } from './kiss-types'

/**
 * Decode a KISS frame from raw bytes
 *
 * @param bytes - Raw bytes containing a KISS frame
 * @returns Tuple of [port, command, payload, remainder]
 */
export function decodeKISS_Frame(bytes: Uint8Array): [KISS_Port, KISS_Command, KISS_Payload, Uint8Array] {
  enum State {
    START_OF_FRAME,
    IN_PORT_AND_COMMAND_BYTE,
    IN_PAYLOAD,
    ESCAPING_PAYLOAD,
    END_OF_FRAME
  }

  let state = State.START_OF_FRAME
  let index: number
  let port: KISS_Port = 0
  let command: KISS_Command = KISS_Command.DATA_FRAME
  let payload: number[] = []

  outer: for (index = 0; index < bytes.length; index++) {
    const byte = bytes[index]

    switch (state) {
      case State.START_OF_FRAME:
        state = processStartOfPacket(byte)
        break
      case State.IN_PORT_AND_COMMAND_BYTE:
        state = processPortAndCommandByte(byte)
        break
      case State.IN_PAYLOAD:
        state = processPayloadByte(byte)
        break
      case State.END_OF_FRAME:
        break outer
      case State.ESCAPING_PAYLOAD:
        state = processEscapedByte(byte)
        break
      default:
        throw new Error('Invalid state')
    }
  }

  if (state !== State.END_OF_FRAME) throw new Error('Incomplete KISS frame')

  return [port, command, new Uint8Array(payload), bytes.subarray(index)]

  function processStartOfPacket(byte: number): State {
    if (byte === FEND) return State.IN_PORT_AND_COMMAND_BYTE
    throw new Error('KISS packet does not start with FEND')
  }

  function processPortAndCommandByte(byte: number): State {
    if (byte === 0xff) {
      port = null
      command = KISS_Command.RETURN
    } else {
      port = ((byte >> 4) & 0x0f) as KISS_Port
      const commandValue = byte & 0x0f
      if (commandValue < 0 || commandValue > 0x06) throw new Error('Invalid KISS command')
      command = commandValue as KISS_Command
    }

    return State.IN_PAYLOAD
  }

  function processPayloadByte(byte: number): State {
    if (byte === FESC) return State.ESCAPING_PAYLOAD
    if (byte === FEND) return State.END_OF_FRAME
    payload.push(byte)
    return State.IN_PAYLOAD
  }

  function processEscapedByte(transposedByte: number): State {
    if (transposedByte !== TFESC && transposedByte !== TFEND) throw new Error('Invalid escape sequence in dataframe')
    payload.push(transposedByte === TFESC ? FESC : FEND)
    return State.IN_PAYLOAD
  }
}
