import { createConnection } from 'node:net'
import { AX25_Frame, IncompleteKISS_FrameError, KISS_Frame } from '@packchat/codec'

const HOST = process.env.TNC_HOST ?? 'localhost'
const PORT = Number(process.env.TNC_PORT ?? 8001)

const socket = createConnection({ host: HOST, port: PORT }, () => {
  console.log(`Connected to TNC at ${HOST}:${PORT}`)
})

let buffer: Uint8Array = new Uint8Array(0)

socket.on('data', chunk => {
  buffer = addChunkToBuffer(buffer, chunk)
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

function addChunkToBuffer(buffer: Uint8Array, chunk: Uint8Array): Uint8Array {
  const out = new Uint8Array(buffer.length + chunk.length)
  out.set(buffer, 0)
  out.set(chunk, buffer.length)
  return out
}

function drainFrames() {
  while (true) {
    let kissFrame: KISS_Frame
    let remainingBytes: Uint8Array

    try {
      ;[kissFrame, remainingBytes] = KISS_Frame.decode(buffer)
    } catch (err) {
      if (err instanceof IncompleteKISS_FrameError) return
      console.error('KISS decode error:', (err as Error).message)
      buffer = new Uint8Array(0)
      return
    }

    buffer = remainingBytes

    logKISS_Frame(kissFrame)

    try {
      const ax25Frame = AX25_Frame.decode(kissFrame.payload)
      logAX25_Frame(ax25Frame)
    } catch (err) {
      console.error('AX.25 decode error:', (err as Error).message)
      // Continue processing remaining frames even if this one is malformed
    }

    if (buffer.length === 0) return
  }
}

function logKISS_Frame(frame: KISS_Frame) {
  console.log('---')
  console.log(`KISS payload (${frame.payload.length} bytes)`)
  console.log(`  hex   : ${toHex(frame.payload)}`)
  console.log(`  ascii : ${toAscii(frame.payload)}`)
}

function logAX25_Frame(frame: AX25_Frame) {
  console.log('---')
  console.log(`AX.25 Frame`)
  console.log(`  Callsign   : ${frame.callsign}`)
  console.log(`  SSID       : ${frame.ssid}`)
  console.log(`  Info ascii : ${toAscii(frame.info)}`)
  console.log(`  Info hex   : ${toHex(frame.info)}`)
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ')
}

function toAscii(bytes: Uint8Array): string {
  return Array.from(bytes, b => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join('')
}
