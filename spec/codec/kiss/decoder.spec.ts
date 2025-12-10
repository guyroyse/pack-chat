import { decodeKISS_Frame, FEND, FESC, KISS_Command, KISS_Payload, KISS_Port } from '@lib/codec/kiss'

const emptyPayload = new Uint8Array([])
const samplePayload = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
const escapedPayload = new Uint8Array([0x01, FEND, 0x02, FESC, 0x03])

describe('decode', () => {
  let port: KISS_Port
  let command: KISS_Command
  let payload: KISS_Payload
  let remainder: Uint8Array

  const template = {
    rawFrame: new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
    expectedPort: 0,
    expectedCommand: KISS_Command.DATA_FRAME,
    expectedPayload: samplePayload,
    expectedRemainder: new Uint8Array([])
  }

  describe.each([
    {
      ...template,
      description: 'when decoding a typical frame'
    },
    {
      ...template,
      description: 'when decoding a frame with a non-zero port',
      rawFrame: new Uint8Array([FEND, 0x30, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedPort: 3
    },
    {
      ...template,
      description: 'when decoding a frame with a DATA_FRAME command',
      rawFrame: new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.DATA_FRAME
    },
    {
      ...template,
      description: 'when decoding a frame with a TX_DELAY command',
      rawFrame: new Uint8Array([FEND, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.TX_DELAY
    },
    {
      ...template,
      description: 'when decoding a frame with a PERSISTENCE command',
      rawFrame: new Uint8Array([FEND, 0x02, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.PERSISTENCE
    },
    {
      ...template,
      description: 'when decoding a frame with a SLOT_TIME command',
      rawFrame: new Uint8Array([FEND, 0x03, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.SLOT_TIME
    },
    {
      ...template,
      description: 'when decoding a frame with a TX_TAIL command',
      rawFrame: new Uint8Array([FEND, 0x04, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.TX_TAIL
    },
    {
      ...template,
      description: 'when decoding a frame with a FULL_DUPLEX command',
      rawFrame: new Uint8Array([FEND, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.FULL_DUPLEX
    },
    {
      ...template,
      description: 'when decoding a frame with a SET_HARDWARE command',
      rawFrame: new Uint8Array([FEND, 0x06, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedCommand: KISS_Command.SET_HARDWARE
    },
    {
      ...template,
      description: 'when decoding a frame with a RETURN command',
      rawFrame: new Uint8Array([FEND, 0xff, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedPort: null,
      expectedCommand: KISS_Command.RETURN
    },
    {
      ...template,
      description: 'when decoding a frame with a payload',
      rawFrame: new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, FEND]),
      expectedPayload: samplePayload
    },
    {
      ...template,
      description: 'when decoding a frame with no payload',
      rawFrame: new Uint8Array([FEND, 0x00, FEND]),
      expectedPayload: emptyPayload
    },
    {
      ...template,
      description: 'when decoding a frame with escaped payload',
      rawFrame: new Uint8Array([FEND, 0x00, 0x01, FESC, 0xdc, 0x02, FESC, 0xdd, 0x03, FEND]),
      expectedPayload: escapedPayload
    },
    {
      ...template,
      description: 'when decoding a frame with a partial frame after it',
      rawFrame: new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, FEND, FEND, 0x00, 0x99, 0x88]),
      expectedPayload: new Uint8Array([0x01, 0x02, 0x03]),
      expectedRemainder: new Uint8Array([FEND, 0x00, 0x99, 0x88])
    },
    {
      ...template,
      description: 'when decoding a frame with a complete frame after it',
      rawFrame: new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, FEND, FEND, 0x00, 0x55, 0x66, 0x77, FEND]),
      expectedPayload: new Uint8Array([0x01, 0x02, 0x03]),
      expectedRemainder: new Uint8Array([FEND, 0x00, 0x55, 0x66, 0x77, FEND])
    }
  ])('$description', ({ rawFrame, expectedPort, expectedCommand, expectedPayload, expectedRemainder }) => {
    beforeEach(() => ([port, command, payload, remainder] = decodeKISS_Frame(rawFrame)))

    it('has the expected port', () => expect(port).toBe(expectedPort))
    it('has the expected command', () => expect(command).toBe(expectedCommand))
    it('has the expected payload', () => expect(payload).toEqual(expectedPayload))
    it('returns the expected remainder', () => expect(remainder).toEqual(expectedRemainder))
  })
})
