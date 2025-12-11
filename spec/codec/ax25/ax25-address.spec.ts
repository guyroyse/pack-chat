import { AX25_Address, AX25_SSID, AX25_CommandResponse } from '@lib/codec/ax25'

describe('AX25_Address', () => {
  describe('constructor', () => {
    it('stores the callsign', () => {
      const address = new AX25_Address('K6ABC', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)
      expect(address.callsign).toBe('K6ABC')
    })

    it('stores the SSID', () => {
      const address = new AX25_Address('K6ABC', 5 as AX25_SSID, AX25_CommandResponse.COMMAND, false)
      expect(address.ssid).toBe(5)
    })

    it('stores the command/response', () => {
      const address = new AX25_Address('K6ABC', 0 as AX25_SSID, AX25_CommandResponse.RESPONSE, false)
      expect(address.commandResponse).toBe(AX25_CommandResponse.RESPONSE)
    })

    it('stores the extension bit', () => {
      const address = new AX25_Address('K6ABC', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, true)
      expect(address.extensionBit).toBe(true)
    })

    it('throws error for empty callsign', () => {
      expect(() => new AX25_Address('', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign > 6 characters', () => {
      expect(() => new AX25_Address('TOOLONG', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for lowercase callsign', () => {
      expect(() => new AX25_Address('k6abc', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign with invalid characters', () => {
      expect(() => new AX25_Address('K6-ABC', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign with spaces', () => {
      expect(() => new AX25_Address('K6 ABC', 0 as AX25_SSID, AX25_CommandResponse.COMMAND, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })
  })

  describe('#encode', () => {
    let encodedAddress: Buffer

    const template = {
      callsign: 'K6ABC',
      ssid: 0 as AX25_SSID,
      commandResponse: AX25_CommandResponse.COMMAND,
      extensionBit: false
    }

    describe.each([
      {
        ...template,
        description: 'encodes a simple address',
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a short callsign',
        callsign: 'AB',
        expectedAddress: Buffer.from([0x82, 0x84, 0x40, 0x40, 0x40, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a full 6-character callsign',
        callsign: 'WB2OSZ',
        expectedAddress: Buffer.from([0xae, 0x84, 0x64, 0x9e, 0xa6, 0xb4, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a non-zero SSID',
        ssid: 15 as AX25_SSID,
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x7e])
      },
      {
        ...template,
        description: 'encodes and address with COMMAND bit',
        commandResponse: AX25_CommandResponse.COMMAND,
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes and address with RESPONSE bit',
        commandResponse: AX25_CommandResponse.RESPONSE,
        // SSID byte: ext=0, ssid=0000, reserved=11, cr=1 = 0b11100000 = 0xE0
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0xe0])
      },
      {
        ...template,
        description: 'encodes and address with extension bit false',
        extensionBit: false,
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes and address with extension bit true',
        extensionBit: true,
        expectedAddress: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x61])
      }
    ])('$description', ({ callsign, ssid, commandResponse, extensionBit, expectedAddress }) => {
      beforeEach(() => {
        const address = new AX25_Address(callsign, ssid, commandResponse, extensionBit)
        encodedAddress = address.encode()
      })

      it('produces the expected byte sequence', () => expect(encodedAddress).toEqual(expectedAddress))
    })
  })

  describe('.decode', () => {
    let decodedAddress: AX25_Address

    const template = {
      buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
      expectedCallsign: 'K6ABC',
      expectedSSID: 0 as AX25_SSID,
      expectedCommandResponse: AX25_CommandResponse.COMMAND,
      expectedExtensionBit: false
    }

    describe.each([
      {
        ...template,
        description: 'decodes a simple address',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'decodes an address with a short callsign',
        buffer: Buffer.from([0x82, 0x84, 0x40, 0x40, 0x40, 0x40, 0x60]),
        expectedCallsign: 'AB'
      },
      {
        ...template,
        description: 'decodes an address with a full 6-character callsign',
        buffer: Buffer.from([0xae, 0x84, 0x64, 0x9e, 0xa6, 0xb4, 0x60]),
        expectedCallsign: 'WB2OSZ'
      },
      {
        ...template,
        description: 'decodes an address with a non-zero SSID',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x7e]),
        expectedSSID: 15 as AX25_SSID
      },
      {
        ...template,
        description: 'decodes an address with COMMAND bit',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
        expectedCommandResponse: AX25_CommandResponse.COMMAND
      },
      {
        ...template,
        description: 'decodes an address with RESPONSE bit',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0xe0]),
        expectedCommandResponse: AX25_CommandResponse.RESPONSE
      },
      {
        ...template,
        description: 'decodes an address with extension bit false',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
        expectedExtensionBit: false
      },
      {
        ...template,
        description: 'decodes an address with extension bit true',
        buffer: Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x61]),
        expectedExtensionBit: true
      }
    ])('$description', ({ buffer, expectedCallsign, expectedSSID, expectedCommandResponse, expectedExtensionBit }) => {
      beforeEach(() => {
        decodedAddress = AX25_Address.decode(buffer)
      })

      it('has the expected callsign', () => expect(decodedAddress.callsign).toBe(expectedCallsign))
      it('has the expected SSID', () => expect(decodedAddress.ssid).toBe(expectedSSID))
      it('has the expected command/response', () =>
        expect(decodedAddress.commandResponse).toBe(expectedCommandResponse))
      it('has the expected extension bit', () => expect(decodedAddress.extensionBit).toBe(expectedExtensionBit))
    })

    it('throws error if buffer too small', () => {
      const buffer = Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40]) // Only 6 bytes
      expect(() => AX25_Address.decode(buffer)).toThrow('Buffer must be at least 7 bytes')
    })
  })
})
