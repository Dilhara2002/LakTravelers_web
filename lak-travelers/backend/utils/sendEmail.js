import nodemailer from 'nodemailer';

export function emailConfig(env = process.env) {
  const provider = env.EMAIL_PROVIDER || (env.RESEND_API_KEY ? 'resend' : 'smtp');
  const custom = Boolean(env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASSWORD);
  const required = provider === 'resend' ? ['RESEND_API_KEY', 'EMAIL_FROM'] : custom
    ? ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'] : ['EMAIL_USER', 'EMAIL_PASS'];
  if (!['resend', 'smtp'].includes(provider)) throw Object.assign(new Error('Invalid email provider'), { code: 'CONFIG_INVALID' });
  const missing = required.filter(key => !env[key]);
  if (missing.length) throw Object.assign(new Error('Email configuration missing'), { code: 'CONFIG_MISSING', missing });
  return { provider, from: provider === 'resend' ? env.EMAIL_FROM : env.SMTP_FROM || env.EMAIL_USER,
    transport: { ...(custom ? { host: env.SMTP_HOST, port: Number(env.SMTP_PORT), secure: Number(env.SMTP_PORT) === 465 } : { service: 'gmail' }),
      auth: { user: custom ? env.SMTP_USER : env.EMAIL_USER, pass: custom ? env.SMTP_PASSWORD : env.EMAIL_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 } };
}

export async function sendEmail(message, { env = process.env, fetchImpl = globalThis.fetch, createTransport = options => nodemailer.createTransport(options) } = {}) {
  const config = emailConfig(env);
  const mail = { ...message, from: config.from };
  if (config.provider === 'resend') {
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mail, to: Array.isArray(mail.to) ? mail.to : [mail.to] }),
      });
      if (!response.ok || !(await response.json()).id) throw new Error('Email not accepted');
      return { accepted: Array.isArray(mail.to) ? mail.to : [mail.to], rejected: [] };
    } catch { throw Object.assign(new Error('HTTPS email delivery failed'), { code: 'EMAIL_API_FAILED' }); }
  }
  return createTransport(config.transport).sendMail(mail);
}
