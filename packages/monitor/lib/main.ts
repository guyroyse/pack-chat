import { createConnection } from 'node:net'
import { IncompleteKISS_FrameError, decodeKISS_Frame } from '@packchat/codec'

const HOST = process.env.TNC_HOST ?? 'localhost'
const PORT = Number(process.env.TNC_PORT ?? 8001)

const socket = createConnection({ host: HOST, port: PORT }, () => {
  console.log(`Connected to TNC at ${HOST}:${PORT}`)
})

let buffer: Uint8Array = new Uint8Array(0)

socket.on('data', chunk => {
  buffer = concat(buffer, chunk)
  drainFrames()
})

socket.on('error', err => {
  console.error('Socket error:', err.message)
  process.exit(1)
})

socket.on('close', () => {
  console.log('Connection closed')
  process.exit(0)
})

function drainFrames() {
  while (true) {
    let payload: Uint8Array
    let remainder: Uint8Array<ArrayBufferLike>
    try {
      ;[payload, remainder] = decodeKISS_Frame(buffer)
    } catch (err) {
      if (err instanceof IncompleteKISS_FrameError) return
      console.error('KISS decode error:', (err as Error).message)
      buffer = new Uint8Array(0)
      return
    }

    buffer = remainder
    logFrame(payload)

    if (buffer.length === 0) return
  }
}

function logFrame(payload: Uint8Array) {
  console.log('---')
  console.log(`KISS payload (${payload.length} bytes)`)
  console.log(`  hex   : ${toHex(payload)}`)
  console.log(`  ascii : ${toAscii(payload)}`)
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ')
}

function toAscii(bytes: Uint8Array): string {
  return Array.from(bytes, b => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join('')
}
