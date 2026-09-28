import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  formatLocalNow,
  parsedActivityTextSchema,
  type ParsedActivityText,
} from "../lib/activity-text";
import type { VolumeUnit } from "../types/route-types";

const MODEL = "claude-haiku-4-5";

let anthropic: Anthropic | null = null;

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Text logging isn't set up yet.");
  }
  anthropic ??= new Anthropic();
  return anthropic;
}

function buildSystemPrompt(
  localNow: string,
  timezone: string,
  defaultUnit: VolumeUnit,
) {
  return `You turn a parent's short note about their baby's bottle feeds and pumping sessions into structured entries.

The current local date and time is ${localNow}, timezone ${timezone}.

- A feed is a bottle given to the baby. Record formula and breast milk amounts separately. If the note doesn't say what was in the bottle, treat it as formula.
- A pumping session is milk a parent expressed. Record the total amount.
- Units are oz or ml ("ounces" means oz; "milliliters", "mls" and "cc" mean ml). If a number has no unit, use ${defaultUnit}.
- Give each entry's time as local "YYYY-MM-DDTHH:mm". Resolve relative times ("20 min ago", "at 2", "3am") against the current local time. Times are never in the future: if a clock time hasn't happened yet today, it was yesterday, and an hour like "at 6" means the most recent 6 o'clock that has passed. If the note gives no time for an entry, use null.
- Make one entry for each feed or pumping session mentioned.
- Don't guess amounts. Briefly put anything you couldn't turn into an entry (missing amounts, other activities, questions) in notUnderstood; otherwise set it to null.`;
}

export async function parseActivityText(
  text: string,
  context: { now: Date; timezone: string; defaultUnit: VolumeUnit },
): Promise<ParsedActivityText | null> {
  const client = getAnthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(
        formatLocalNow(context.now, context.timezone),
        context.timezone,
        context.defaultUnit,
      ),
      messages: [{ role: "user", content: text }],
      output_config: { format: zodOutputFormat(parsedActivityTextSchema) },
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return null;
    }
    return response.parsed_output ?? null;
  } catch (error) {
    console.error("parseActivityText failed", error);
    throw new Error("Couldn't read that right now. Try again, or use the form.", {
      cause: error,
    });
  }
}
