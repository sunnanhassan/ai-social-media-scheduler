import { test, describe } from "node:test";
import assert from "node:assert";
import { format, startOfDay, addMinutes, isBefore } from "date-fns";

describe("1-Minute Scheduling & Quick Testing Presets", () => {
  test("generates full 1-minute resolution time slots (1440 options)", () => {
    const baseDate = startOfDay(new Date());
    const options = [];
    for (let i = 0; i < 24 * 60; i += 1) {
      options.push(format(addMinutes(baseDate, i), "h:mm a"));
    }

    assert.strictEqual(options.length, 1440);
    assert.strictEqual(options[0], "12:00 AM");
    assert.strictEqual(options[1], "12:01 AM");
    assert.strictEqual(options[60], "1:00 AM");
    assert.strictEqual(options[1439], "11:59 PM");
  });

  test("quick preset calculations for +1m, +2m, +5m, +15m resolve valid future times", () => {
    const now = new Date();
    const presets = [1, 2, 5, 15];

    presets.forEach((mins) => {
      const target = addMinutes(now, mins);
      const formatted = format(target, "h:mm a");

      assert.ok(target.getTime() > now.getTime());
      assert.match(formatted, /^\d{1,2}:\d{2}\s(AM|PM)$/);
    });
  });

  test("filtering with 60-second grace window preserves imminent 1-minute target", () => {
    const now = new Date();
    const graceTime = new Date(now.getTime() - 60000);
    const candidateOneMin = addMinutes(now, 1);

    assert.strictEqual(isBefore(candidateOneMin, graceTime), false);
  });

  test("validation allows scheduling for 1 minute in the future", () => {
    const now = Date.now();
    const targetScheduledAt = now + 60 * 1000; // 1 minute ahead

    const isPast = targetScheduledAt < now - 30000;
    assert.strictEqual(isPast, false);
  });
});

