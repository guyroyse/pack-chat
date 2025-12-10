# PackChat

A TypeScript codec library for amateur radio packet communication over AX.25.

## Overview

PackChat provides protocol codecs for building chat applications over VHF/UHF packet radio. The library implements the KISS, AX.25, and PackChat protocol layers needed to send and receive messages via Direwolf or other KISS-compatible TNCs.

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Module System**: ESM (ECMAScript modules)
- **Runtime**: Node.js
- **Test Framework**: Vitest
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
│     PackChat Protocol               │
│  - Message types (root, reply, etc) │
│  - Message ID generation            │
│  - Channel/DM addressing            │
│  - Flags (private, emote)           │
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
├── lib/                          # Source code
│   └── codec/
│       ├── kiss/                 # KISS protocol (COMPLETE)
│       │   ├── kiss-types.ts     # Constants and type definitions
│       │   ├── kiss-frame.ts     # KISS_Frame class
│       │   ├── kiss-encoder.ts   # Binary encoding
│       │   ├── kiss-decoder.ts   # Binary decoding (state machine)
│       │   └── index.ts          # Public exports
│       ├── ax-25/                # AX.25 protocol (PARTIAL)
│       │   ├── types.ts          # Frame and address types
│       │   ├── encoder.ts        # Frame encoding (COMPLETE)
│       │   ├── decoder.ts        # Frame decoding (TODO)
│       │   └── index.ts          # Public exports
│       └── pack-chat/            # PackChat protocol (TODO)
│           ├── types.ts          # Message types and interfaces
│           └── index.ts          # Public exports
├── spec/                         # Test files
│   └── codec/
│       └── kiss/                 # KISS protocol tests (80 tests)
│           ├── kiss-frame.spec.ts
│           ├── encoder.spec.ts
│           └── decoder.spec.ts
├── dist/                         # Compiled output
├── package.json
├── tsconfig.json                 # TypeScript config (includes tests)
├── tsconfig.build.json           # Build config (lib only)
├── vitest.config.ts              # Test configuration
├── vitest.setup.ts               # Custom matchers
└── CLAUDE.md                     # This file
```

## Implementation Status

### KISS Protocol - COMPLETE

Full implementation with 80 passing tests.

**Features:**
- Frame encoding/decoding with FEND delimiters (0xC0)
- Special character escaping (0xC0 → 0xDB 0xDC, 0xDB → 0xDB 0xDD)
- All 8 KISS commands: DATA_FRAME, TX_DELAY, PERSISTENCE, SLOT_TIME, TX_TAIL, FULL_DUPLEX, SET_HARDWARE, RETURN
- Port number support (0-15)
- State machine decoder with remainder handling for streaming

**Usage:**
```typescript
import { KISS_Frame, KISS_Command } from '@lib/codec/kiss'

// Encode
const frame = new KISS_Frame(0, KISS_Command.DATA_FRAME, payload)
const bytes = frame.encode()

// Decode (handles partial frames, returns remainder)
const [decoded, remainder] = KISS_Frame.decode(buffer)
```

### AX.25 Protocol - PARTIAL

**Complete:**
- Type definitions (addresses, frames, control fields, PIDs)
- Frame encoding with proper address bit-shifting
- `createUIFrame()` helper for connectionless frames
- Repeater path support

**TODO:**
- Frame decoding (`decodeAX25Frame()`)
- Test coverage

**Usage:**
```typescript
import { createUIFrame, encodeAX25Frame } from '@lib/codec/ax-25'

const frame = createUIFrame('K6ABC', 0, infoPayload)
const bytes = encodeAX25Frame(frame)
```

### PackChat Protocol - TODO

Only type definitions exist. Needs:
- Protocol encoder
- Protocol decoder
- Message ID generation (48-bit timestamp + 16-bit random)

## Protocol Details

### KISS Protocol

**Frame Format:**
```
[FEND] [CMD] [DATA...] [FEND]
```

- `FEND` = 0xC0 (frame delimiter)
- `CMD` = port (upper 4 bits) + command (lower 4 bits)
- Escaping in DATA only:
  - 0xC0 → 0xDB 0xDC (FESC + TFEND)
  - 0xDB → 0xDB 0xDD (FESC + TFESC)

### AX.25 Packet Structure

```
┌──────────────┬──────────────┬──────────┬─────────┬─────┬──────────┐
│ Destination  │   Source     │ Repeaters│ Control │ PID │   Info   │
│   (7 bytes)  │  (7 bytes)   │ (0-56 B) │ (1-2 B) │(0-1)│ (0-256)  │
└──────────────┴──────────────┴──────────┴─────────┴─────┴──────────┘
```

**Address Encoding (7 bytes each):**
- Bytes 0-5: Callsign (ASCII, left-justified, space-padded, shifted left 1 bit)
- Byte 6: SSID and flags
  - Bits 1-4: SSID (0-15)
  - Bit 5: Reserved
  - Bit 6: Command/Response
  - Bit 7: Extension bit (1 = last address)

**PackChat defaults:**
- Destination: `APCHAT-0`
- Control: 0x03 (UI frame)
- PID: 0xF0 (no layer 3)

### PackChat Protocol (Planned)

**Info Field Format:**
```
┌──────────────────────────────────────────────────────────────┐
│ Header (9 bytes)                                             │
├──────────────────────────────────────────────────────────────┤
│ Byte 0: Version (bits 0-3) | Type (bits 4-7)                │
│ Byte 1: Flags (is_private, is_emote)                        │
│ Bytes 2-8: Channel/Destination (AX.25 address format)       │
├──────────────────────────────────────────────────────────────┤
│ Variable ID Fields (8 bytes each, uint64 big-endian)        │
├──────────────────────────────────────────────────────────────┤
│ Message Text (UTF-8, remaining bytes)                       │
└──────────────────────────────────────────────────────────────┘
```

**Message Types:**
- `0000` (Root): Normal message [message_id] [text]
- `0001` (Reply): Thread reply [message_id] [reply_to_id] [text]
- `0010` (Reaction): Emoji reaction [react_to_id] [emoji]
- `0011` (Edit): Edit message [message_id] [edit_id] [new_text]
- `0100` (Delete): Delete message [message_id] [delete_id]

**Message ID Format:**
- 64-bit unsigned integer (big-endian)
- Upper 48 bits: milliseconds since Unix epoch
- Lower 16 bits: random value

## Development

### Commands

```bash
npm run build      # Compile TypeScript to dist/
npm test           # Run tests in watch mode
npm run test:ui    # Run tests with browser UI
npm run test:run   # Run tests once
```

### Adding Tests

Tests go in `spec/` mirroring the `lib/` structure. Custom matchers `toBeTrue()` and `toBeFalse()` are available.

### Code Style

- Prettier configured (no semicolons, single quotes, 120 char width)
- TypeScript strict mode enabled
- Path alias: `@lib/*` maps to `./lib/*`

## Roadmap

### Next Steps
1. Implement AX.25 decoder
2. Add AX.25 test coverage
3. Implement PackChat protocol encoder/decoder
4. Add message ID generation
5. Create root index.ts for package exports

### Future
- TCP client for TNC connection
- Message deduplication
- Channel/DM state management
- Example chat application

## Security Notes

- Amateur radio prohibits encryption - all messages are plaintext
- Callsign authenticity is trust-based (no cryptographic verification)
- Edit/delete operations should verify source callsign matches
- Input sanitization needed at application layer
