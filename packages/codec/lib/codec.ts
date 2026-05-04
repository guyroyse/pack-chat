import { KISS_Frame, FEND, IncompleteKISS_FrameError } from './kiss'
import { AX25_Frame, AX25_Callsign, AX25_SSID } from './ax25'
import { PackChatMessage } from './pack-chat'

export type CodecPacket = {
  callsign: AX25_Callsign
  ssid: AX25_SSID
  message: PackChatMessage
}

export function encodeToKISS(packet: CodecPacket): Uint8Array {
  const ax25Frame = new AX25_Frame(packet.callsign, packet.ssid, packet.message.encode())
  const kissFrame = new KISS_Frame(ax25Frame.encode())
  return kissFrame.encode()
}

export function decodeFromKISS(bytes: Uint8Array): [CodecPacket | null, Uint8Array] {
  // Discard any leading bytes before the first FEND. KISS escapes FEND in payloads,
  // so a FEND can only appear at a frame boundary; anything before it is junk.
  const firstFend = bytes.indexOf(FEND)
  if (firstFend === -1) return [null, new Uint8Array([])]
  const remaining = bytes.subarray(firstFend)

  let kissFrame: KISS_Frame
  let remainder: Uint8Array

  try {
    ;[kissFrame, remainder] = KISS_Frame.decode(remaining)
  } catch (error) {
    if (error instanceof IncompleteKISS_FrameError) return [null, remaining]
    throw error
  }

  const ax25Frame = AX25_Frame.decode(kissFrame.payload)
  const message = PackChatMessage.decode(ax25Frame.info)

  const packet: CodecPacket = {
    callsign: ax25Frame.callsign,
    ssid: ax25Frame.ssid,
    message
  }

  return [packet, remainder]
}
