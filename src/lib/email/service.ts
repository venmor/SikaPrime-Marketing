import "server-only";

import nodemailer from "nodemailer";

import { getIntegrationSettingValue } from "@/lib/integrations/service";
import { logOperationalEvent } from "@/lib/operations/service";

type EmailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
};

async function getEmailConfig(): Promise<EmailConfig | null> {
  const [
    host,
    portValue,
    user,
    password,
    secureValue,
    fromEmail,
    fromName,
  ] = await Promise.all([
    getIntegrationSettingValue("email.smtp_host", ""),
    getIntegrationSettingValue("email.smtp_port", "587"),
    getIntegrationSettingValue("email.smtp_user", ""),
    getIntegrationSettingValue("email.smtp_password", ""),
    getIntegrationSettingValue("email.smtp_secure", "false"),
    getIntegrationSettingValue("email.from_email", ""),
    getIntegrationSettingValue("email.from_name", "Sika Prime Loans"),
  ]);

  const port = Number.parseInt(portValue, 10);

  if (
    !host ||
    !Number.isFinite(port) ||
    !user ||
    !password ||
    !fromEmail
  ) {
    return null;
  }

  return {
    host,
    port,
    user,
    password,
    secure: secureValue.toLowerCase() === "true" || port === 465,
    fromEmail,
    fromName: fromName || "Sika Prime Loans",
  };
}

function buildFromLabel(config: EmailConfig) {
  return `${config.fromName} <${config.fromEmail}>`;
}

export async function isEmailDeliveryConfigured() {
  return Boolean(await getEmailConfig());
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  operation: "invite" | "password_reset" | "email_otp";
}) {
  const config = await getEmailConfig();

  if (!config) {
    return {
      delivered: false,
      reason: "Email delivery is not configured.",
    } as const;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  try {
    await transporter.sendMail({
      from: buildFromLabel(config),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return {
      delivered: true,
      reason: null,
    } as const;
  } catch (error) {
    await logOperationalEvent({
      severity: "error",
      source: "email_delivery",
      operation: input.operation,
      message: `Email delivery failed during ${input.operation}.`,
      metadata: {
        to: input.to,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      delivered: false,
      reason: error instanceof Error ? error.message : "Unknown email error.",
    } as const;
  }
}

export async function sendInviteEmail(input: {
  to: string;
  recipientName: string;
  inviteLink: string;
  expiresAt: Date;
  invitedByName?: string | null;
}) {
  return sendEmail({
    to: input.to,
    subject: "Your Sika Prime workspace invitation",
    text: [
      `Hello ${input.recipientName},`,
      "",
      `${input.invitedByName ?? "An admin"} invited you to join the Sika Prime workspace.`,
      `Use this secure invitation link before ${input.expiresAt.toLocaleString()}:`,
      input.inviteLink,
      "",
      "If you were not expecting this invitation, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${input.recipientName},</p>
      <p>${input.invitedByName ?? "An admin"} invited you to join the Sika Prime workspace.</p>
      <p><a href="${input.inviteLink}">Accept your invitation</a></p>
      <p>This secure link expires on ${input.expiresAt.toLocaleString()}.</p>
      <p>If you were not expecting this invitation, you can ignore this email.</p>
    `,
    operation: "invite",
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  recipientName?: string | null;
  resetLink: string;
  expiresAt: Date;
}) {
  return sendEmail({
    to: input.to,
    subject: "Reset your Sika Prime password",
    text: [
      `Hello ${input.recipientName ?? "there"},`,
      "",
      "A password reset was requested for your Sika Prime workspace account.",
      `Use this secure reset link before ${input.expiresAt.toLocaleString()}:`,
      input.resetLink,
      "",
      "If you did not request this reset, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${input.recipientName ?? "there"},</p>
      <p>A password reset was requested for your Sika Prime workspace account.</p>
      <p><a href="${input.resetLink}">Reset your password</a></p>
      <p>This secure link expires on ${input.expiresAt.toLocaleString()}.</p>
      <p>If you did not request this reset, you can ignore this email.</p>
    `,
    operation: "password_reset",
  });
}

export async function sendEmailOtp(input: {
  to: string;
  recipientName?: string | null;
  code: string;
  expiresAt: Date;
}) {
  return sendEmail({
    to: input.to,
    subject: "Your Sika Prime verification code",
    text: [
      `Hello ${input.recipientName ?? "there"},`,
      "",
      "Use this one-time verification code to finish signing in:",
      input.code,
      "",
      `This code expires on ${input.expiresAt.toLocaleString()}.`,
    ].join("\n"),
    html: `
      <p>Hello ${input.recipientName ?? "there"},</p>
      <p>Use this one-time verification code to finish signing in:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em;">${input.code}</p>
      <p>This code expires on ${input.expiresAt.toLocaleString()}.</p>
    `,
    operation: "email_otp",
  });
}
