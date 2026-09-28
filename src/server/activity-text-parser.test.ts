import { beforeEach, describe, expect, it, vi } from "vitest";

const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

import { parseActivityText } from "./activity-text-parser";

const context = {
  now: new Date("2026-09-25T21:30:00.000Z"),
  timezone: "America/Los_Angeles",
  defaultUnit: "ml" as const,
};

describe("parseActivityText", () => {
  beforeEach(() => {
    parse.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("fails clearly when no API key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(parseActivityText("3oz", context)).rejects.toThrow(
      "Text logging isn't set up yet.",
    );
    expect(parse).not.toHaveBeenCalled();
  });

  it("sends local time, timezone and default unit, and returns the parsed entries", async () => {
    const parsed = { entries: [], notUnderstood: null };
    parse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: parsed });

    await expect(parseActivityText("pumped 120", context)).resolves.toBe(parsed);

    const request = parse.mock.calls[0][0];
    expect(request.model).toBe("claude-haiku-4-5");
    expect(request.messages).toEqual([{ role: "user", content: "pumped 120" }]);
    expect(request.system).toContain(
      "2026-09-25 14:30 (Friday), timezone America/Los_Angeles",
    );
    expect(request.system).toContain("use ml");
  });

  it("returns null on refusal or truncated output", async () => {
    parse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(parseActivityText("x", context)).resolves.toBeNull();
    parse.mockResolvedValue({ stop_reason: "max_tokens", parsed_output: null });
    await expect(parseActivityText("x", context)).resolves.toBeNull();
  });

  it("replaces API errors with a user-facing message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    parse.mockRejectedValue(new Error("overloaded"));
    await expect(parseActivityText("x", context)).rejects.toThrow(
      "Couldn't read that right now. Try again, or use the form.",
    );
  });
});
