# PackChat

A TypeScript codec library for amateur radio packet communication over AX.25.

## Overview

PackChat provides protocol codecs for building chat applications over VHF/UHF packet radio. The library implements the KISS, AX.25, and PackChat protocol layers needed to send and receive messages via Direwolf or other KISS-compatible TNCs.

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Module System**: ESM (ECMAScript modules)
- **Runtime**: Node.js / Browser (uses Uint8Array, not Buffer)
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
├── lib/                          # Source code
│   └── codec/
│       ├── kiss/                 # KISS protocol (COMPLETE)
│       │   ├── kiss-types.ts     # Constants and type definitions
│       │   ├── kiss-frame.ts     # KISS_Frame class
│       │   ├── kiss-encoder.ts   # Binary encoding
│       │   ├── kiss-decoder.ts   # Binary decoding (state machine)
│       │   └── index.ts          # Public exports
│       ├── ax25/                 # AX.25 protocol (COMPLETE)
│       │   ├── ax25-types.ts     # Frame and address types
│       │   ├── ax25-address.ts   # AX25_Address class
│       │   ├── ax25-frame.ts     # AX25_Frame class
│       │   ├── ax25-encoder.ts   # Frame encoding (COMPLETE)
│       │   ├── ax25-decoder.ts   # Frame decoding (COMPLETE)
│       │   └── index.ts          # Public exports
│       └── pack-chat/            # PackChat protocol (TODO)
│           ├── types.ts          # Message types and interfaces
│           └── index.ts          # Public exports
├── spec/                         # Test files
│   └── codec/
│       ├── kiss/                 # KISS protocol tests (25 tests)
│       │   ├── kiss-frame.spec.ts
│       │   ├── kiss-encoder.spec.ts
│       │   └── kiss-decoder.spec.ts
│       └── ax25/                 # AX.25 protocol tests (43 tests)
│           ├── ax25-address.spec.ts
│           └── ax25-frame.spec.ts
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

Simplified implementation with 25 passing tests.

**Features:**

- Frame encoding/decoding with FEND delimiters (0xC0)
- Special character escaping (0xC0 → 0xDB 0xDC, 0xDB → 0xDB 0xDD)
- **Simplified**: Only supports DATA_FRAME (0x00) on port 0
- State machine decoder with remainder handling for streaming
- Comprehensive error handling (invalid escapes, incomplete frames, unsupported commands/ports)
- Uses Uint8Array (browser/Electron compatible)

**Usage:**

```typescript
import { KISS_Frame } from '@lib/codec/kiss'

// Encode
const payload = new Uint8Array([0x01, 0x02, 0x03])
const frame = new KISS_Frame(payload)
const bytes = frame.encode()

// Decode (handles partial frames, returns remainder)
const [decoded, remainder] = KISS_Frame.decode(buffer)
```

### AX.25 Protocol - COMPLETE

Simplified implementation with 43 passing tests (33 address + 10 frame).

**Features:**

- Type definitions with type safety (AX25_SSID, AX25_Callsign)
- AX25_Address class with encode/decode methods
- AX25_Frame class following KISS_Frame pattern
- Frame encoding/decoding with proper address bit-shifting
- **Simplified**: Only supports UI frames (0x03) with PID 0xF0
- **Simplified**: Hardcoded destination APCHAT-0 (no repeaters)
- Comprehensive test coverage (address + frame encode/decode)
- Uses Uint8Array (browser/Electron compatible)

**Usage:**

```typescript
import { AX25_Frame, AX25_Address, AX25_SSID } from '@lib/codec/ax25'

// Create address
const addr = new AX25_Address('K6ABC', 5 as AX25_SSID, false)
const encoded = addr.encode() // Returns Uint8Array
const decoded = AX25_Address.decode(encoded)

// Create UI frame
const encoder = new TextEncoder()
const frame = new AX25_Frame('K6ABC', 0 as AX25_SSID, encoder.encode('Hello'))
const bytes = frame.encode() // Returns Uint8Array

// Decode frame
const decoded = AX25_Frame.decode(bytes)
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
[FEND] [0x00] [DATA...] [FEND]
```

- `FEND` = 0xC0 (frame delimiter)
- `CMD` = 0x00 (port 0, DATA_FRAME command - hardcoded)
- Escaping in DATA only:
  - 0xC0 → 0xDB 0xDC (FESC + TFEND)
  - 0xDB → 0xDB 0xDD (FESC + TFESC)

**Note:** This implementation only supports DATA_FRAME (0x00) on port 0. Other commands/ports will throw an error.

### AX.25 Packet Structure

**Simplified PackChat UI Frame:**

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

### PackChat Protocol (Planned)

**Info Field Format:**

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

**Byte 0 Layout:**

```
Bit:  7   6   5 | 4   3   2 | 1   0
     [Version ] | [ Type  ] | [Res]
      3 bits      3 bits      2 bits
```

**Channel Name (Bytes 1-7):**

- 7 bytes ASCII alphanumeric
- Lowercase letters (a-z), numbers (0-9), hyphens (-)
- Must start with a letter (a-z)
- Must end with a letter or number (not hyphen)
- Right-padded with spaces (0x20)
- Examples: `general`, `cq`, `newbie`, `random`, `dev-2`, `ham-net`

**Message Types:**

- `000` (0x0 - ROOT): Normal message [message_id] [text]
- `001` (0x1 - REPLY): Thread reply [message_id] [reply_to_id] [text]
- `010` (0x2 - REACTION): Emoji reaction [react_to_id] [emoji]
- `011` (0x3 - EDIT): Edit message [message_id] [edit_id] [new_text]
- `100` (0x4 - DELETE): Delete message [message_id] [delete_id] (no text)
- `101-111` (0x5-0x7): Reserved for future use

**Message Size Limits:**

```
Type        Header  IDs      Max Text  Total   Notes
────────────────────────────────────────────────────────────
ROOT        8 B     8 B      224 B     240 B   16 B unused
REPLY       8 B     16 B     224 B     248 B   8 B unused
REACTION    8 B     8 B      224 B     240 B   16 B unused
EDIT        8 B     16 B     224 B     248 B   8 B unused
DELETE      8 B     16 B     0 B       24 B    No text field
```

**Max text = 224 bytes** (enforced for all types to ensure ROOT messages can always be edited and to allow future message types with up to 3 IDs)

**Message ID Format:**

- 64-bit unsigned integer (big-endian)
- Upper 48 bits: milliseconds since Unix epoch
- Lower 16 bits: random value

**Example - ROOT message to #general:**

```
Byte 0:    0x00 (version=0, type=0, reserved=0)
           Binary: 00000000
Bytes 1-7: "general" → 0x67 0x65 0x6E 0x65 0x72 0x61 0x6C
Bytes 8-15: message_id (uint64 big-endian)
Bytes 16+:  "Hello world!" (UTF-8, max 224 bytes)
```

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

1. ~~Implement AX.25 frame decoder~~ ✅ DONE
2. ~~Add AX.25 frame test coverage~~ ✅ DONE
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
