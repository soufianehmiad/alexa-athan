import { buildReminderRequest } from "../lib/alexaReminders";

describe("alexaReminders", () => {
  describe("buildReminderRequest", () => {
    it("should build a valid reminder request", () => {
      const reminder = buildReminderRequest(
        "fajr",
        "2026-02-24T05:22:00",
        "Etc/GMT+5"
      );

      expect(reminder.trigger.type).toBe("SCHEDULED_ABSOLUTE");
      expect(reminder.trigger.scheduledTime).toBe("2026-02-24T05:22:00");
      expect(reminder.trigger.timeZoneId).toBe("Etc/GMT+5");
      expect(reminder.alertInfo.spokenInfo.content[0].locale).toBe("en-US");
      expect(reminder.alertInfo.spokenInfo.content[0].text).toBe(
        "It is time for Fajr prayer."
      );
      expect(reminder.pushNotification.status).toBe("ENABLED");
    });

    it("should capitalize the prayer name in text", () => {
      const reminder = buildReminderRequest("maghrib", "2026-02-24T18:00:00", "Etc/GMT");
      expect(reminder.alertInfo.spokenInfo.content[0].text).toBe(
        "It is time for Maghrib prayer."
      );
    });

    it("should set requestTime to current ISO timestamp", () => {
      const before = new Date().toISOString();
      const reminder = buildReminderRequest("dhuhr", "2026-02-24T12:10:00", "Etc/GMT");
      const after = new Date().toISOString();

      expect(reminder.requestTime >= before).toBe(true);
      expect(reminder.requestTime <= after).toBe(true);
    });
  });
});
