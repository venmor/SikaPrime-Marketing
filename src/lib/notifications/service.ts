import "server-only";

type NotificationInput = {
  title: string;
  body: string;
};

export async function sendSlackNotification(input: NotificationInput) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { delivered: false, reason: "missing_webhook" as const };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `${input.title}\n${input.body}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { delivered: false, reason: "delivery_failed" as const };
  }

  return { delivered: true as const };
}
