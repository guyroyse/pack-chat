# PackChat

A TypeScript codec library for amateur radio packet communication over AX.25.

## Overview

PackChat provides protocol codecs for building chat applications over VHF/UHF packet radio. The library implements the KISS, AX.25, and PackChat protocol layers needed to send and receive messages via Direwolf or other KISS-compatible TNCs.

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Module System**: ESM (ECMAScript modules)
- **Runtime**: Node.js / Browser (uses Uint8Array, not Buffer)
- **Test Framework**: Vitest
- **Workspaces**: npm workspaces monorepo
- **Zero production dependencies**

## Architecture

### Protocol Stack

```
┌─────────────────────────────────────┐
│     Application Code                │
│  (Your chat client, bot, etc.)      │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│     Codec (top-level glue)          │
│  - encodeToKISS / decodeFromKISS    │
│  - CodecPacket type                 │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│     PackChat Protocol               │
│  - Message types (root, reply, etc) │
│  - Message ID generation            │
│  - Channel addressing               │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│     AX.25 Layer                     │
│  - Frame construction               │
│  - Address encoding (callsign+SSID) │
│  - UI frame support                 │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│     KISS Protocol                   │
│  - Frame delimiters (FEND)          │
│  - Special character escaping       │
│  - Port/command byte handling       │
└─────────────────────────────────────┘
                 ↕
         TCP Socket to TNC
         (e.g., Direwolf :8001)
```

## Project Structure

```
pack-chat/
├── packages/
│   └── codec/                              # @packchat/codec workspace
│       ├── lib/
│       │   ├── codec.ts                    # Top-level encode/decode glue
│       │   ├── index.ts                    # Barrel: re-exports kiss, ax25, pack-chat, codec
│       │   ├── kiss/                       # KISS protocol
│       │   │   ├── kiss-types.ts           # Constants
│       │   │   ├── kiss-frame.ts           # KISS_Frame class
│       │   │   ├── kiss-encoder.ts
│       │   │   ├── kiss-decoder.ts         # IncompleteKISS_FrameError lives here
│       │   │   └── index.ts
│       │   ├── ax25/                       # AX.25 protocol
│       │   │   ├── ax25-types.ts
│       │   │   ├── ax25-address.ts
│       │   │   ├── ax25-frame.ts
│       │   │   ├── ax25-encoder.ts
│       │   │   ├── ax25-decoder.ts
│       │   │   └── index.ts
│       │   └── pack-chat/                  # PackChat protocol
│       │       ├── pack-chat-types.ts
│       │       ├── pack-chat-channel.ts
│       │       ├── pack-chat-message-id.ts
│       │       ├── pack-chat-message.ts
│       │       ├── pack-chat-encoder.ts
│       │       ├── pack-chat-decoder.ts
│       │       └── index.ts
│       ├── spec/                           # Test files (mirror of lib/)
│       │   ├── codec.spec.ts
│       │   ├── kiss/
│       │   ├── ax25/
│       │   └── pack-chat/
│       ├── dist/                           # Compiled output (gitignored)
│       ├── package.json                    # @packchat/codec
│       ├── tsconfig.json                   # Editor config (lib + spec)
│       └── tsconfig.build.json             # Build config (lib only)
├── package.json                            # Root: private, workspaces config
├── tsconfig.base.json                      # Shared compiler options
├── vitest.config.ts                        # Root vitest config
└── CLAUDE.md
```

## Public API

The codec is published as `@packchat/codec` with a single root export. All types and functions are available from the package root:

```typescript
import {
  // Top-level codec
  encodeToKISS, decodeFromKISS, CodecPacket,
  // KISS layer
  KISS_Frame, IncompleteKISS_FrameError, FEND, FESC, TFEND, TFESC,
  // AX.25 layer
  AX25_Frame, AX25_Address, AX25_Callsign, AX25_SSID,
  // PackChat layer
  PackChatChannel, PackChatMessageId, PackChatMessage,
  RootMessage, ReplyMessage, ReactionMessage, EditMessage, DeleteMessage
} from '@packchat/codec'
```

## Top-Level Codec

`codec.ts` is the highest-level entry point — it handles the full KISS ↔ AX.25 ↔ PackChat stack so callers don't have to chain decoders manually.

```typescript
import { encodeToKISS, decodeFromKISS, RootMessage, PackChatChannel, PackChatMessageId } from '@packchat/codec'

// Encode a CodecPacket to KISS bytes
const message = new RootMessage(new PackChatChannel('general'), new PackChatMessageId(), 'Hello!')
const bytes = encodeToKISS({ callsign: 'K6ABC', ssid: 5 as AX25_SSID, message })

// Decode one packet at a time from a streaming buffer
let buffer: Uint8Array = incomingBytes
while (true) {
  const [packet, remainder] = decodeFromKISS(buffer)
  if (!packet) break              // need more bytes
  handlePacket(packet)
  buffer = remainder
}
```

**Decode behavior:**

- Empty input → `[undefined, empty]`
- Bytes before the first FEND are silently discarded (KISS escapes FEND inside payloads, so bytes before the first FEND are junk).
- Incomplete frame (started, not finished) → `[undefined, remainder]` so caller can buffer more bytes.
- Complete frame → `[CodecPacket, trailingBytes]`. The caller calls again with `trailingBytes` to drain the buffer.
- Other KISS errors (unsupported port/command, invalid escape) propagate.

The codec layer is currently KISS-specific. Adding AGWPE or raw AX.25 transport later means adding `encodeToAGWPE`/`decodeFromAGWPE` and `encodeToAX25`/`decodeFromAX25` siblings — no shared abstraction needed at this scale.

## Implementation Status

### KISS Protocol - COMPLETE

- Frame encoding/decoding with FEND delimiters (0xC0)
- Special character escaping (0xC0 → 0xDB 0xDC, 0xDB → 0xDB 0xDD)
- Only supports DATA_FRAME (0x00) on port 0
- State machine decoder with remainder handling for streaming
- `IncompleteKISS_FrameError` thrown when a frame is missing its closing FEND so callers can distinguish "needs more bytes" from real corruption

### AX.25 Protocol - COMPLETE

- AX25_Address class (callsign + SSID)
- AX25_Frame class (UI frames only, hardcoded destination APCHAT-0, no repeaters)
- Frame encoding/decoding with proper address bit-shifting
- Only supports UI frames (0x03) with PID 0xF0

### PackChat Protocol - COMPLETE

- Five message types: ROOT, REPLY, REACTION, EDIT, DELETE
- PackChatChannel class with name validation
- PackChatMessageId class (64-bit: 48-bit timestamp + 16-bit random)
- Message classes for type-safe construction (RootMessage, ReplyMessage, etc.)
- Protocol encoder with text length validation (max 224 bytes)
- UTF-8 text support (including emojis and international characters)

## Protocol Details

### KISS Protocol

```
[FEND] [0x00] [DATA...] [FEND]
```

- `FEND` = 0xC0 (frame delimiter)
- `CMD` = 0x00 (port 0, DATA_FRAME command - hardcoded)
- Escaping in DATA only:
  - 0xC0 → 0xDB 0xDC (FESC + TFEND)
  - 0xDB → 0xDB 0xDD (FESC + TFESC)

### AX.25 Packet Structure

```
┌──────────────┬──────────────┬─────────┬─────┬──────────┐
│ Destination  │   Source     │ Control │ PID │   Info   │
│   7 bytes    │   7 bytes    │  0x03   │0xF0 │ 0-256 B  │
│  APCHAT-0    │  (varies)    │         │     │          │
└──────────────┴──────────────┴─────────┴─────┴──────────┘
```

**Address Encoding (7 bytes each):**

- Bytes 0-5: Callsign (ASCII, left-justified, space-padded, shifted left 1 bit)
- Byte 6: SSID and flags
  - Bits 1-4: SSID (0-15)
  - Bits 5-6: Reserved (always 0b11)
  - Bit 7: Command/Response (always 0 for PackChat)
  - Bit 0: Last address bit (0 = more addresses, 1 = last)

**PackChat restrictions:**

- Destination: Always `APCHAT-0` (hardcoded)
- Control: Always 0x03 (UI frame, hardcoded)
- PID: Always 0xF0 (no layer 3, hardcoded)
- Repeaters: Not supported (local-only communication)

### PackChat Protocol

```
┌────────────────────────────────────────────────────────────┐
│ Header (8 bytes)                                           │
├────────────────────────────────────────────────────────────┤
│ Byte 0: Version|Type|Reserved                              │
│   Bits 7-5: Version (3 bits, current = 0)                  │
│   Bits 4-2: Type (3 bits, 0-7)                             │
│   Bits 1-0: Reserved (must be 0)                           │
│ Bytes 1-7: Channel name (7-byte ASCII)                     │
├────────────────────────────────────────────────────────────┤
│ Variable ID Fields (8 bytes each, uint64 big-endian)       │
├────────────────────────────────────────────────────────────┤
│ Message Text (UTF-8, max 224 bytes)                        │
└────────────────────────────────────────────────────────────┘
```

**Channel Name (Bytes 1-7):**

- 7 bytes ASCII alphanumeric, right-padded with spaces (0x20)
- Lowercase letters (a-z), numbers (0-9), hyphens (-)
- Must start with a letter, end with letter or number
- Examples: `general`, `cq`, `newbie`, `random`, `dev-2`, `ham-net`

**Message Types:**

- `000` (0x0 - ROOT): Normal message [message_id] [text]
- `001` (0x1 - REPLY): Thread reply [message_id] [reply_to_id] [text]
- `010` (0x2 - REACTION): Emoji reaction [message_id] [react_to_id] [emoji]
- `011` (0x3 - EDIT): Edit message [message_id] [edit_id] [new_text]
- `100` (0x4 - DELETE): Delete message [message_id] [delete_id] (no text)
- `101-111` (0x5-0x7): Reserved for future use

**Message Size Limits:**

```
Type        Header  IDs      Max Text  Total   Notes
────────────────────────────────────────────────────────────
ROOT        8 B     8 B      224 B     240 B   16 B unused
REPLY       8 B     16 B     224 B     248 B   8 B unused
REACTION    8 B     16 B     224 B     248 B   8 B unused
EDIT        8 B     16 B     224 B     248 B   8 B unused
DELETE      8 B     16 B     0 B       24 B    No text field
```

**Max text = 224 bytes** (enforced for all types so ROOT messages can always be edited and to allow future message types with up to 3 IDs)

**Message ID Format:**

- 64-bit unsigned integer (big-endian)
- Upper 48 bits: milliseconds since Unix epoch
- Lower 16 bits: random value

## Development

### Commands

```bash
npm test           # Run tests in watch mode (root)
npm run test:ui    # Run tests with browser UI
npm run test:run   # Run tests once
npm run build      # Build all workspaces (currently just @packchat/codec)
```

### Test Pattern

Specs follow a nested `describe` style: outer block names the scenario, `beforeEach` sets up state once, and individual `it` blocks each assert one thing. Test fixtures are constructed as raw byte arrays (not by feeding the code-under-test into itself), so encode and decode are tested independently against the same external truth.

### Code Style

- Prettier configured (no semicolons, single quotes, 120 char width)
- TypeScript strict mode enabled
- Path alias: `@packchat/codec` maps to `./packages/codec/lib` (via vitest config)

## Roadmap

### Completed

1. ~~Implement AX.25 frame decoder~~ ✅
2. ~~Implement PackChat protocol encoder/decoder~~ ✅
3. ~~Add message ID generation~~ ✅
4. ~~Convert to monorepo with workspaces~~ ✅
5. ~~Top-level codec (encodeToKISS / decodeFromKISS)~~ ✅
6. ~~Root barrel export~~ ✅

### Next Steps

1. Add integration tests (KISS → AX.25 → PackChat round-trips)
2. Test with real radio hardware (Direwolf TNC)
3. TCP client for TNC connection (likely a new workspace package)

### Future

- AGWPE transport (parallel `encodeToAGWPE` / `decodeFromAGWPE` functions)
- Custom FFT-based signal processing (replacing Direwolf dependency)
- Message deduplication
- Channel/DM state management
- Example chat application

## Security Notes

- Amateur radio prohibits encryption - all messages are plaintext
- Callsign authenticity is trust-based (no cryptographic verification)
- Edit/delete operations should verify source callsign matches
- Input sanitization needed at application layer
