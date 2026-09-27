// lib/ai/transcribe.ts

const GROQ_ENDPOINT =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-large-v3-turbo";

/**
 * Detects whether the given text contains Devanagari (Hindi/Urdu in
 * Devanagari script) characters. If it does, we don't try to auto-
 * transliterate — that requires a dedicated model — we just flag it so
 * the message is still legible and the seller can correct it.
 */
function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Transcribes an audio buffer using Groq's Whisper.
 * Returns the raw text, or null on failure.
 *
 * @param audioBuffer - the audio file bytes
 * @param filename - the filename to send to Groq (helps it infer format)
 * @param language - optional ISO code ("en", "ur"). Leave undefined to auto-detect.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("[transcribe] GROQ_API_KEY not set");
    return null;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], {
      type: "audio/ogg",
    });
        formData.append("file", blob, filename);
    formData.append("model", WHISPER_MODEL);
    formData.append("response_format", "text");
    if (language) formData.append("language", language);

    // Bias the model toward Roman-script output for mixed-language audio
    // (Roman Urdu / Hinglish / English). Without this, Whisper tends to
    // output Devanagari for Urdu-sounding audio.
    formData.append(
      "prompt",
      "Transcribe in Roman/Latin script. Example: 'Sara k liye 2 suits, 3500 rupees, COD, Gulberg'."
    );

    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[transcribe] Groq error ${res.status}: ${text}`);
      return null;
    }

        let transcription = (await res.text()).trim();

    if (!transcription) return null;

    // If Whisper output Devanagari for what sounds like Urdu/Hindi, mark it
    // so the UI can render appropriately. We do not attempt to transliterate
    // automatically — that needs a dedicated model. The seller sees the
    // message and can correct it in the dashboard if needed.
    if (containsDevanagari(transcription)) {
      console.warn(
        "[transcribe] output contains Devanagari — seller may need to correct"
      );
    }

    return transcription;

    if (!transcription) {
      console.warn("[transcribe] empty transcription");
      return null;
    }

    return transcription;
  } catch (error) {
    console.error("[transcribe] failed:", error);
    return null;
  }
}