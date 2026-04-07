const BRAND = {
  brand: "#35559a",
  graphite: "#232833",
  text: "#1d2430",
  muted: "#617083",
  border: "#d6dde7",
  panel: "#edf1f6",
  bgTop: "#f7f8fb",
  bgBottom: "#eef2f7",
  sage: "#6f8d7c",
  white: "#ffffff",
  headerMuted: "#dbe3f5"
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRows(rows: Array<{ label: string; value: string }>) {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${BRAND.muted};">
            ${escapeHtml(row.label)}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px; font-size: 15px; line-height: 1.55; color: ${BRAND.text}; word-break: break-word;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");
}

export function renderEmailLayout(input: {
  preheader: string;
  title: string;
  summary: string;
  intro?: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
  details?: Array<{ label: string; value: string }>;
  note?: string;
  footer?: string;
}) {
  const badge = escapeHtml(input.badge ?? "Datum Signet");
  const title = escapeHtml(input.title);
  const preheader = escapeHtml(input.preheader);
  const summary = escapeHtml(input.summary);
  const intro = input.intro ? `<p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: ${BRAND.text};">${escapeHtml(input.intro)}</p>` : "";
  const details = input.details?.length
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 18px 0 0; padding: 18px 20px; border: 1px solid ${BRAND.border}; border-radius: 18px; background: #ffffff;">
        <tbody>
          ${renderRows(input.details)}
        </tbody>
      </table>
    `
    : "";

  const action = input.actionLabel && input.actionUrl
    ? `
      <div style="margin: 28px 0 24px;">
        <a href="${escapeHtml(input.actionUrl)}" style="display: inline-block; border-radius: 14px; background: ${BRAND.brand}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 22px;">
          ${escapeHtml(input.actionLabel)}
        </a>
      </div>
      <p style="margin: 0 0 18px; font-size: 13px; line-height: 1.7; color: ${BRAND.muted}; word-break: break-word;">
        Jika tombol di atas tidak berfungsi, gunakan tautan berikut:<br />
        <a href="${escapeHtml(input.actionUrl)}" style="color: ${BRAND.brand}; text-decoration: underline;">${escapeHtml(input.actionUrl)}</a>
      </p>
    `
    : "";

  const note = input.note
    ? `
      <div style="margin: 22px 0 0; padding: 16px 18px; border-radius: 16px; background: ${BRAND.panel}; border: 1px solid ${BRAND.border};">
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: ${BRAND.text};">
          ${escapeHtml(input.note)}
        </p>
      </div>
    `
    : "";

  const footer = escapeHtml(
    input.footer ?? "Email ini dikirim otomatis oleh sistem. Jika Anda tidak mengenali aktivitas ini, abaikan email ini atau hubungi admin internal."
  );

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body bgcolor="${BRAND.bgBottom}" style="margin: 0; padding: 0; background-color: ${BRAND.bgBottom}; background-image: linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgBottom} 100%); font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: ${BRAND.text};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          ${preheader}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${BRAND.bgBottom}" style="padding: 28px 16px; background-color: ${BRAND.bgBottom}; background-image: linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgBottom} 100%);">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${BRAND.white}" style="max-width: 640px; overflow: hidden; border-radius: 28px; background-color: ${BRAND.white}; border: 1px solid ${BRAND.border}; box-shadow: 0 18px 48px rgba(29, 36, 48, 0.08);">
                <tr>
                  <td bgcolor="${BRAND.graphite}" style="padding: 28px 28px 22px; background-color: ${BRAND.graphite}; background-image: radial-gradient(circle at top left, rgba(53, 85, 154, 0.42), transparent 28%), linear-gradient(160deg, rgba(255,255,255,0.06), transparent 42%); color: ${BRAND.white};">
                    <div style="display: inline-block; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); background-color: rgba(255,255,255,0.10); padding: 8px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${BRAND.white};">
                      ${badge}
                    </div>
                    <h1 style="margin: 18px 0 10px; font-size: 30px; line-height: 1.25; font-weight: 700; color: ${BRAND.white};">
                      ${title}
                    </h1>
                    <p style="margin: 0; max-width: 520px; font-size: 14px; line-height: 1.75; color: ${BRAND.headerMuted};">
                      Workspace drawing yang lebih tertib, mudah dilacak, dan siap diaudit.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0 0 14px; font-size: 16px; line-height: 1.8; color: ${BRAND.text};">
                      ${summary}
                    </p>
                    ${intro}
                    ${details}
                    ${action}
                    ${note}
                    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid ${BRAND.border};">
                      <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.7; color: ${BRAND.muted};">
                        ${footer}
                      </p>
                      <p style="margin: 0; font-size: 12px; line-height: 1.7; color: ${BRAND.sage}; font-weight: 600;">
                        Datum Signet
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
