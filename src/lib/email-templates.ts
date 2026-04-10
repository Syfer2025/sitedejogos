import { SITE_CONFIG } from "@/lib/config";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#22d3ee,#a855f7,#d946ef);text-align:center;line-height:44px;">
            <span style="color:#fff;font-weight:700;font-size:18px;">N</span>
          </div>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">${SITE_CONFIG.name}</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:24px 32px 32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #334155;">
          <p style="margin:0;color:#64748b;font-size:11px;text-align:center;">
            &copy; ${new Date().getFullYear()} ${SITE_CONFIG.name} &mdash; ${SITE_CONFIG.domain}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmailHtml(params: {
  displayName: string;
  verifyUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:600;">
      Verifique seu email
    </h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${params.displayName}</strong>, confirme seu endereço de email
      para ativar todas as funcionalidades da sua conta.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${params.verifyUrl}"
           style="display:inline-block;padding:12px 32px;background:linear-gradient(90deg,#22d3ee,#06b6d4);color:#0f172a;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">
          Verificar email
        </a>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.5;">
      Este link expira em 24 horas. Se você não criou uma conta, ignore este email.
    </p>
    <p style="margin:12px 0 0;color:#475569;font-size:11px;word-break:break-all;">
      ${params.verifyUrl}
    </p>
  `);
}

export function buildPasswordResetEmailHtml(params: {
  displayName: string;
  resetUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:600;">
      Redefinir senha
    </h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${params.displayName}</strong>, recebemos uma solicitação
      para redefinir a senha da sua conta.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${params.resetUrl}"
           style="display:inline-block;padding:12px 32px;background:linear-gradient(90deg,#22d3ee,#06b6d4);color:#0f172a;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">
          Redefinir senha
        </a>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.5;">
      Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
    </p>
    <p style="margin:12px 0 0;color:#475569;font-size:11px;word-break:break-all;">
      ${params.resetUrl}
    </p>
  `);
}
