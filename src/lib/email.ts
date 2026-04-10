import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { SITE_CONFIG } from "@/lib/config";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    // Dev fallback: log emails to console
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getTransporter();
  const from = `"${SITE_CONFIG.name}" <auth@${SITE_CONFIG.domain}>`;

  const info = await transport.sendMail({ from, ...options });

  if (!process.env.SMTP_HOST) {
    console.log("[email-dev]", JSON.parse(info.message));
  }

  return info;
}
