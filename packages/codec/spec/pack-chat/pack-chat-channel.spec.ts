import { PackChatChannel } from '@packchat/codec/pack-chat/pack-chat-channel'

describe('PackChatChannel', () => {
  describe('constructor', () => {
    it('stores the channel name', () => {
      const channel = new PackChatChannel('abc')
      expect(channel.name).toBe('abc')
    })

    it.each([
      { description: 'accepts a single lowercase letter', channelName: 'a' },
      { description: 'accepts multiple lowercase letters', channelName: 'abc' },
      { description: 'accepts the maximum length of 7 chars', channelName: 'abcdefg' },
      { description: 'accepts numbers in the middle', channelName: 'ab12cd' },
      { description: 'accepts numbers at the end', channelName: 'abc12' },
      { description: 'accepts multiple numbers', channelName: 'a1b2c3' },
      { description: 'accepts hyphen between words', channelName: 'abc-def' },
      { description: 'accepts multiple hyphens', channelName: 'a-b-c' },
      { description: 'accepts numbers and hyphens', channelName: 'ab-1-cd' }
    ])('$description', ({ channelName }) => expect(() => new PackChatChannel(channelName)).not.toThrow())

    it.each([
      { description: 'rejects empty channel name', channelName: '', expectedError: 'Channel name cannot be empty.' },
      {
        description: 'rejects channel name this is too long',
        channelName: 'abcdefgh',
        expectedError: 'Channel name cannot exceed 7 characters, got 8.'
      },
      {
        description: 'rejects channel name that is uppercase',
        channelName: 'ABC',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name that is mixed case',
        channelName: 'AbCd',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name starting with a number',
        channelName: '1abc',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name starting with hyphen',
        channelName: '-abc',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name ending with hyphen',
        channelName: 'abc-',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name containing exclamation marks',
        channelName: 'abc!',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name containing underscores',
        channelName: 'abc_def',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name containing spaces',
        channelName: 'abc def',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      },
      {
        description: 'rejects channel name with at symbol',
        channelName: 'ab@def',
        expectedError: 'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      }
    ])('$description', ({ channelName, expectedError }) => {
      expect(() => new PackChatChannel(channelName)).toThrow(expectedError)
    })
  })

  describe('#encode', () => {
    it('encodes a short channel name with space padding', () => {
      const channel = new PackChatChannel('abc')
      const encoded = channel.encode()

      expect(encoded).toEqual(new Uint8Array([0x61, 0x62, 0x63, 0x20, 0x20, 0x20, 0x20]))
    })

    it('encodes a 7-character channel name without padding', () => {
      const channel = new PackChatChannel('abcdefg')
      const encoded = channel.encode()

      expect(encoded).toEqual(new Uint8Array([0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67]))
    })
  })

  describe('.decode', () => {
    it('decodes a padded channel name', () => {
      const buffer = new Uint8Array([0x61, 0x62, 0x63, 0x20, 0x20, 0x20, 0x20])
      const channel = PackChatChannel.decode(buffer)

      expect(channel.name).toBe('abc')
    })

    it('decodes a full 7-character channel name', () => {
      const buffer = new Uint8Array([0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67])
      const channel = PackChatChannel.decode(buffer)

      expect(channel.name).toBe('abcdefg')
    })

    it('complains if buffer is too small', () => {
      const buffer = new Uint8Array([0x61, 0x62, 0x63])
      expect(() => PackChatChannel.decode(buffer)).toThrow(
        'Buffer too small for channel name: expected 7 bytes, got 3.'
      )
    })

    it('complains if decoded name is invalid', () => {
      const buffer = new Uint8Array([0x31, 0x61, 0x62, 0x63, 0x20, 0x20, 0x20])
      expect(() => PackChatChannel.decode(buffer)).toThrow()
    })
  })
})
