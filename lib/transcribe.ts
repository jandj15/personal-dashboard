// Speech-to-text via OpenAI Whisper. Telegram voice notes are OGG/Opus.

import OpenAI, { toFile } from "openai";

export async function transcribe(
  audio: ArrayBuffer | Uint8Array | Blob,
  filename = "voice.ogg"
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const openai = new OpenAI({ apiKey });
  const file = await toFile(audio, filename, { type: "audio/ogg" });
  const res = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });
  return res.text;
}
