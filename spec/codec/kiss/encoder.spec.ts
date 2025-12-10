import { encodeKISS_Frame, FEND, FESC, KISS_Command, KISS_Port } from '@lib/codec/kiss'

const emptyPayload = new Uint8Array([])
const samplePayload = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
const escapedPayload = new Uint8Array([0x01, FEND, 0x02, FESC, 0x03])

describe('encodeKISS_Frame', () => {
  let encodedFrame: Uint8Array

  const template = {
    port: 0 as KISS_Port,
    command: KISS_Command.DATA_FRAME,
    inputPayload: samplePayload
  }

  describe.each([
    {
      ...template,
      description: 'when encoding a frame typical frame',
      expectedFrame: new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a non-zero port',
      port: 3 as KISS_Port,
      expectedFrame: new Uint8Array([0xc0, 0x30, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a DATA_FRAME command',
      command: KISS_Command.DATA_FRAME,
      expectedFrame: new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a TX_DELAY command',
      command: KISS_Command.TX_DELAY,
      expectedFrame: new Uint8Array([0xc0, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a PERSISTENCE command',
      command: KISS_Command.PERSISTENCE,
      expectedFrame: new Uint8Array([0xc0, 0x02, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a SLOT_TIME command',
      command: KISS_Command.SLOT_TIME,
      expectedFrame: new Uint8Array([0xc0, 0x03, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a TX_TAIL command',
      command: KISS_Command.TX_TAIL,
      expectedFrame: new Uint8Array([0xc0, 0x04, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a FULL_DUPLEX command',
      command: KISS_Command.FULL_DUPLEX,
      expectedFrame: new Uint8Array([0xc0, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a SET_HARDWARE command',
      command: KISS_Command.SET_HARDWARE,
      expectedFrame: new Uint8Array([0xc0, 0x06, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a RETURN command',
      command: KISS_Command.RETURN,
      expectedFrame: new Uint8Array([0xc0, 0xff, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with a payload',
      inputPayload: samplePayload,
      expectedFrame: new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with no payload',
      inputPayload: emptyPayload,
      expectedFrame: new Uint8Array([0xc0, 0x00, 0xc0])
    },
    {
      ...template,
      description: 'when encoding a frame with escaped payload',
      inputPayload: escapedPayload,
      expectedFrame: new Uint8Array([0xc0, 0x00, 0x01, 0xdb, 0xdc, 0x02, 0xdb, 0xdd, 0x03, 0xc0])
    }
  ])('$description', ({ port, command, inputPayload, expectedFrame }) => {
    beforeEach(() => (encodedFrame = encodeKISS_Frame(port, command, inputPayload)))

    it('produces the expected byte sequence', () => expect(encodedFrame).toEqual(expectedFrame))
  })
})
