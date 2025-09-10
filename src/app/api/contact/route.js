import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function getEnv() {
  return {
    user: process.env.CONTACT_EMAIL_USER || process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.CONTACT_EMAIL_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS,
    from: process.env.CONTACT_EMAIL_FROM || process.env.EMAIL_FROM,
    to: process.env.CONTACT_EMAIL_TO || process.env.EMAIL_TO || process.env.CONTACT_EMAIL_FROM,
  };
}

export async function POST(req) {
  try {
    const { name, email, phone, message, hp } = await req.json();

    // Basic validation
    if (hp) return NextResponse.json({ ok: true }); // honeypot
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { user, pass, from, to } = getEnv();
    if (!user || !pass || !to) {
      return NextResponse.json({ error: "Email is not configured" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    const subject = `New enquiry from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
        <hr />
        <pre style="white-space:pre-wrap; font-family: ui-sans-serif, system-ui, -apple-system;">${escapeHtml(message)}</pre>
      </div>
    `;

    await transporter.sendMail({
      from: from || user,
      to,
      replyTo: email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

