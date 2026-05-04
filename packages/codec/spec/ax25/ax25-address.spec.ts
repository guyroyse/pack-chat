import { AX25_Address, AX25_SSID } from '@packchat/codec/ax25'

describe('AX25_Address', () => {
  describe('constructor', () => {
    it('stores the callsign', () => {
      const address = new AX25_Address('K6ABC', 0 as AX25_SSID, false)
      expect(address.callsign).toBe('K6ABC')
    })

    it('stores the SSID', () => {
      const address = new AX25_Address('K6ABC', 5 as AX25_SSID, false)
      expect(address.ssid).toBe(5)
    })

    it('stores the last address bit', () => {
      const address = new AX25_Address('K6ABC', 0 as AX25_SSID, true)
      expect(address.lastAddress).toBe(true)
    })

    it('throws error for empty callsign', () => {
      expect(() => new AX25_Address('', 0 as AX25_SSID, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign > 6 characters', () => {
      expect(() => new AX25_Address('TOOLONG', 0 as AX25_SSID, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for lowercase callsign', () => {
      expect(() => new AX25_Address('k6abc', 0 as AX25_SSID, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign with invalid characters', () => {
      expect(() => new AX25_Address('K6-ABC', 0 as AX25_SSID, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })

    it('throws error for callsign with spaces', () => {
      expect(() => new AX25_Address('K6 ABC', 0 as AX25_SSID, false)).toThrow(
        'Callsign must be 1-6 alphanumeric and uppercase characters'
      )
    })
  })

  describe('#encode', () => {
    let encodedAddress: Uint8Array

    const template = {
      callsign: 'K6ABC',
      ssid: 0 as AX25_SSID,
      lastAddress: false
    }

    describe.each([
      {
        ...template,
        description: 'encodes a simple address',
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a single-character callsign',
        callsign: 'A',
        expectedAddress: new Uint8Array([0x82, 0x40, 0x40, 0x40, 0x40, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a short callsign',
        callsign: 'N1A',
        expectedAddress: new Uint8Array([0x9c, 0x62, 0x82, 0x40, 0x40, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a full 6-character callsign',
        callsign: 'WB2OSZ',
        expectedAddress: new Uint8Array([0xae, 0x84, 0x64, 0x9e, 0xa6, 0xb4, 0x60])
      },
      {
        ...template,
        description: 'encodes an address with a zero SSID',
        ssid: 0 as AX25_SSID,
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },

      {
        ...template,
        description: 'encodes an address with a non-zero SSID',
        ssid: 7 as AX25_SSID,
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x6e])
      },
      {
        ...template,
        description: 'encodes an address with the maximum SSID',
        ssid: 15 as AX25_SSID,
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x7e])
      },
      {
        ...template,
        description: 'encodes and address with last address set to false',
        lastAddress: false,
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'encodes and address with last address set to true',
        lastAddress: true,
        expectedAddress: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x61])
      }
    ])('$description', ({ callsign, ssid, lastAddress, expectedAddress }) => {
      beforeEach(() => {
        const address = new AX25_Address(callsign, ssid, lastAddress)
        encodedAddress = address.encode()
      })

      it('produces the expected byte sequence', () => expect(encodedAddress).toEqual(expectedAddress))
    })
  })

  describe('.decode', () => {
    let decodedAddress: AX25_Address

    const template = {
      buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
      expectedCallsign: 'K6ABC',
      expectedSSID: 0 as AX25_SSID,
      expectedLastAddress: false
    }

    describe.each([
      {
        ...template,
        description: 'decodes a simple address',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60])
      },
      {
        ...template,
        description: 'decodes an address with a single-character callsign',
        buffer: new Uint8Array([0x82, 0x40, 0x40, 0x40, 0x40, 0x40, 0x60]),
        expectedCallsign: 'A'
      },
      {
        ...template,
        description: 'decodes an address with a short callsign',
        buffer: new Uint8Array([0x9c, 0x62, 0x82, 0x40, 0x40, 0x40, 0x60]),
        expectedCallsign: 'N1A'
      },
      {
        ...template,
        description: 'decodes an address with a full 6-character callsign',
        buffer: new Uint8Array([0xae, 0x84, 0x64, 0x9e, 0xa6, 0xb4, 0x60]),
        expectedCallsign: 'WB2OSZ'
      },
      {
        ...template,
        description: 'decodes an address with a zero SSID',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
        expectedSSID: 0 as AX25_SSID
      },
      {
        ...template,
        description: 'decodes an address with a non-zero SSID',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x6e]),
        expectedSSID: 7 as AX25_SSID
      },
      {
        ...template,
        description: 'decodes an address with a maximum SSID',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x7e]),
        expectedSSID: 15 as AX25_SSID
      },
      {
        ...template,
        description: 'decodes an address with last address set to false',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x60]),
        expectedLastAddress: false
      },
      {
        ...template,
        description: 'decodes an address with last address set to true',
        buffer: new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x61]),
        expectedLastAddress: true
      }
    ])('$description', ({ buffer, expectedCallsign, expectedSSID, expectedLastAddress }) => {
      beforeEach(() => {
        decodedAddress = AX25_Address.decode(buffer)
      })

      it('has the expected callsign', () => expect(decodedAddress.callsign).toBe(expectedCallsign))
      it('has the expected SSID', () => expect(decodedAddress.ssid).toBe(expectedSSID))
      it('has the expected last address bit', () => expect(decodedAddress.lastAddress).toBe(expectedLastAddress))
    })

    it('throws error if buffer too small', () => {
      const buffer = new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40]) // Only 6 bytes
      expect(() => AX25_Address.decode(buffer)).toThrow('Buffer must be at least 7 bytes')
    })
  })
})
