import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured, skipping email send")
    return
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function serviceOrderEmailTemplate({
  customerName,
  orderNumber,
  status,
  tenantName,
}: {
  customerName: string
  orderNumber: string
  status: string
  tenantName: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${escapeHtml(tenantName)} - Ordem de Serviço</h2>
      <p>Olá <strong>${escapeHtml(customerName)}</strong>,</p>
      <p>Sua ordem de serviço <strong>#${escapeHtml(orderNumber)}</strong> está com status: <strong>${escapeHtml(status)}</strong>.</p>
      <hr />
      <p style="color: #666; font-size: 12px;">Este é um e-mail automático. Por favor, não responda.</p>
    </div>
  `
}
