import { chat, extractJson } from "@/lib/ai/client";
import {
  COMMAND_SYSTEM_PROMPT,
  buildCommandPrompt,
} from "@/lib/ai/command-prompts";

export interface ParsedCommand {
  intent: string;
  confidence: number;
  params: {
    customer_name: string | null;
    status: string | null;
    query: string | null;
  };
}

const VALID_INTENTS = [
  "summary",
  "list_pending",
  "list_unpaid",
  "mark_delivered",
  "mark_paid",
  "invoice",
  "remind",
  "search",
  "help",
  "unknown",
];

export async function parseCommand(text: string): Promise<ParsedCommand> {
  const raw = await chat({
    messages: [
      { role: "system", content: COMMAND_SYSTEM_PROMPT },
      { role: "user", content: buildCommandPrompt(text) },
    ],
    temperature: 0.1,
  });

  const cleaned = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Command parser returned invalid JSON");
  }

  if (!VALID_INTENTS.includes(parsed.intent)) {
    parsed.intent = "unknown";
  }

  parsed.confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

  parsed.params = parsed.params || {
    customer_name: null,
    status: null,
    query: null,
  };

  return parsed as ParsedCommand;
}