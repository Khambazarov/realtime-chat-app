const baseStyles = {
  bodyBg: "#0f172a",
  cardBg: "#ffffff",
  cardBorder: "#eaeef5",
  text: "#111827",
  muted: "#6b7280",
  divider: "#eef1f6",
  brand: "#2563eb",
  brandBorder: "#1e4fdc",
  ok: "#059669",
  okBorder: "#047857",
  headerBg: "#334155",
  headerText: "#ffffff",
};

function headerHTML({ title, imgUrl }) {
  return `
    <tr>
      <td style="padding:20px 24px 0 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
               style="width:100%;background:${baseStyles.headerBg};border-radius:12px;">
          <tr>
            <td style="padding:16px 18px;" width="100%">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
                <tr>
                  <td align="left" style="font:700 18px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.headerText}">
                    ${title}
                  </td>
                  <td align="right" style="white-space:nowrap;">
                    <img src="${imgUrl}" width="44" height="44" alt="Chat App"
                         style="display:block;border:0;outline:none;border-radius:8px" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function containerStart() {
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body style="margin:0;padding:0;background:${baseStyles.bodyBg};">
      <!-- Full-width wrapper -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
             style="width:100%;background:${baseStyles.bodyBg};">
        <tr>
          <td align="center" style="padding:28px 14px;">
            <!-- Karte: 100% bis max 600px -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                   style="width:100%;max-width:600px;background:${baseStyles.cardBg};border:1px solid ${baseStyles.cardBorder};border-radius:14px;overflow:hidden;">
  `;
}

function containerEnd(appName) {
  return `
            </table>
            <div style="padding:12px 8px 0 8px;font:400 11px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#9ca3af;">
              © ${new Date().getFullYear()} ${appName}
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export function renderVerificationEmail({
  appName,
  title = "Hello, Word!",
  imgUrl,
  verifyUrl,
  code,
}) {
  return (
    containerStart() +
    headerHTML({ title, imgUrl }) +
    `
    <tr>
      <td style="padding:24px 28px 0 28px;text-align:center;">
        <div style="font:700 20px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.text}">
          Verify your email
        </div>
        <div style="margin-top:8px;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.muted}">
          Welcome to <strong>${appName}</strong>! Use the code below to verify your email address.
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:12px 28px 0 28px;">
        <div style="display:inline-block;background:#eef2ff;color:#1f3fff;border:1px solid #dbe3ff;border-radius:10px;padding:14px 20px;font:700 22px/1.2 'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:0.08em;">
          ${code}
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:18px 28px 6px 28px;">
        <a href="${verifyUrl}" target="_blank"
           style="display:inline-block;background:${baseStyles.brand};color:#ffffff;text-decoration:none;font:600 14px/1 'Segoe UI',Roboto,Arial,sans-serif;padding:14px 22px;border-radius:10px;border:1px solid ${baseStyles.brandBorder};">
          Verify my email
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 24px 28px;text-align:center;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.muted}">
        If the button doesn’t work, copy this link:<br>
        <span style="word-break:break-all;color:#374151;">${verifyUrl}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 24px 28px;border-top:1px solid ${baseStyles.divider};text-align:center;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#9ca3af;">
        If you didn’t sign up, you can safely ignore this email.
      </td>
    </tr>
    ` +
    containerEnd(appName)
  );
}

export function renderResetEmail({
  appName,
  title = "Hello, Word!",
  imgUrl,
  resetUrl,
  code,
}) {
  return (
    containerStart() +
    headerHTML({ title, imgUrl }) +
    `
    <tr>
      <td style="padding:24px 28px 0 28px;text-align:center;">
        <div style="font:700 20px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.text}">
          Password reset request
        </div>
        <div style="margin-top:8px;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.muted}">
          Use the code below to verify it’s you, then choose a new password for <strong>${appName}</strong>.
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:12px 28px 0 28px;">
        <div style="display:inline-block;background:#ecfdf5;color:#065f46;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px;font:700 22px/1.2 'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:0.08em;">
          ${code}
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:18px 28px 6px 28px;">
        <a href="${resetUrl}" target="_blank"
           style="display:inline-block;background:${baseStyles.ok};color:#ffffff;text-decoration:none;font:600 14px/1 'Segoe UI',Roboto,Arial,sans-serif;padding:14px 22px;border-radius:10px;border:1px solid ${baseStyles.okBorder};">
          Set new password
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 24px 28px;text-align:center;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${baseStyles.muted}">
        If the button doesn’t work, copy this link:<br>
        <span style="word-break:break-all;color:#374151;">${resetUrl}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 28px 24px 28px;border-top:1px solid ${baseStyles.divider};text-align:center;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#9ca3af;">
        Didn’t request this? You can ignore this message.
      </td>
    </tr>
    ` +
    containerEnd(appName)
  );
}
