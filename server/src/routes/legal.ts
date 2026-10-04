/**
 * 法务静态页：隐私政策 + 用户条款（App Store 提审必填项）
 * GET /privacy → 隐私政策
 * GET /terms   → 用户条款
 * 纯内联样式静态 HTML，无外部依赖
 */
import type { Request, Response } from "express";

const BASE_STYLE = `
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8fafc; margin: 0; padding: 24px 16px; line-height: 1.65; }
    .wrap { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px 24px; }
    h1 { font-size: 26px; margin: 0 0 4px; }
    h2 { font-size: 17px; margin: 28px 0 8px; }
    p, li { font-size: 14px; color: #3c3c50; }
    ul { padding-left: 20px; }
    .meta { color: #7a7a90; font-size: 12px; margin-bottom: 20px; }
    a { color: #0ea5e9; }
  </style>
`;

function page(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} - ValueRadar</title>${BASE_STYLE}</head><body><div class="wrap"><h1>${title}</h1>${body}</div></body></html>`;
}

const PRIVACY_HTML = page(
  "Privacy Policy",
  `
  <p class="meta">Last updated: October 3, 2026</p>
  <p>ValueRadar ("we", "our") helps you compare used-phone conditions and generate an AI-assisted value report. This policy explains what data we handle and why.</p>

  <h2>1. Information We Collect</h2>
  <ul>
    <li><b>Anonymous device identifier:</b> a random UUID generated on your device and stored locally. It is used only to track free quota and daily limits. It contains no personal identity.</li>
    <li><b>Information you provide:</b> phone model selection and optional condition details you enter (e.g. battery health, battery cycles, usage habits). This is used solely to generate your report.</li>
    <li><b>Diagnostic data:</b> basic crash and error logs to keep the app working.</li>
  </ul>

  <h2>2. AI Processing</h2>
  <p>Report generation is performed by a third-party large-language-model service (Volcengine/Doubao). The condition details you enter are sent to that service to produce your report and are not used by us for advertising.</p>

  <h2>3. Advertising</h2>
  <p>The app shows rewarded video ads served by <b>Google AdMob</b>. Google and its partners may collect and process device identifiers (including IDFA, subject to your App Tracking Transparency choice), approximate location, and usage data to serve and measure ads. If you decline tracking, non-personalized ads are shown. See Google's privacy policy at <a href="https://policies.google.com/technologies/ads" rel="noopener">policies.google.com/technologies/ads</a>.</p>

  <h2>4. Data Storage &amp; Retention</h2>
  <p>Quota records are stored on our servers keyed by the anonymous device identifier. We do not require an account and do not collect your name, email, or phone number. Generated reports are kept on your device.</p>

  <h2>5. Your Choices</h2>
  <ul>
    <li>You can deny the tracking permission prompt; the app remains fully usable with non-personalized ads.</li>
    <li>Deleting the app removes the local identifier and locally stored reports.</li>
  </ul>

  <h2>6. Children</h2>
  <p>The app is not directed to children under 13 and we do not knowingly collect their personal data.</p>

  <h2>7. Contact</h2>
  <p>Questions or requests: <a href="mailto:support@waliapp.top">support@waliapp.top</a></p>
`
);

const TERMS_HTML = page(
  "Terms of Use",
  `
  <p class="meta">Last updated: October 3, 2026</p>
  <p>By using ValueRadar you agree to these terms.</p>

  <h2>1. Service</h2>
  <p>ValueRadar generates an AI-assisted reference report for used-phone condition assessment. Reports are for reference only and do not constitute a professional appraisal, warranty, or guarantee of transaction price.</p>

  <h2>2. Acceptable Use</h2>
  <p>You agree not to abuse the service (including automated quota farming, attempting to circumvent daily limits, or interfering with ad delivery).</p>

  <h2>3. Ads &amp; Unlocks</h2>
  <p>After the free quota is used, additional reports are unlocked by watching a rewarded ad. If ad delivery is temporarily unavailable, the service may grant a free unlock to keep the app usable.</p>

  <h2>4. Disclaimer</h2>
  <p>The service is provided "as is" without warranties. We are not liable for decisions made based on generated reports. AI output may contain inaccuracies.</p>

  <h2>5. Changes</h2>
  <p>We may update these terms; continued use constitutes acceptance. Material changes will be reflected on this page.</p>

  <h2>6. Contact</h2>
  <p><a href="mailto:support@waliapp.top">support@waliapp.top</a></p>
`
);

export function registerLegalRoutes(
  app: import("express").Express
): void {
  const html = (content: string) => (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(content);
  };
  app.get("/privacy", html(PRIVACY_HTML));
  app.get("/terms", html(TERMS_HTML));
}
