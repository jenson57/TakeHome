import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Takehome',
  description: 'How Takehome collects, uses, and protects your personal and financial data.',
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f7f9ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8f0fe', background: 'white', padding: '0 24px' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, color: '#0a1628', fontSize: 18, letterSpacing: '-0.3px' }}>Takehome</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 8 }}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 40 }}>
          This policy explains how Takehome collects, uses, and protects your personal and financial information when you use our service at <strong>gettakehome.xyz</strong>.
        </p>

        {[
          {
            title: '1. Who we are',
            content: `Takehome is a UK personal finance application available at gettakehome.xyz. We provide tools to help you understand your take-home pay, track your spending, manage bills, and plan your budget. For privacy enquiries, please contact us at: [contact email — coming soon].`,
          },
          {
            title: '2. What data we collect',
            content: null,
            list: [
              { label: 'Account information', detail: 'Your name and email address, provided when you sign up.' },
              { label: 'Transaction data', detail: 'Spending transactions you add manually or import from your bank via Plaid.' },
              { label: 'Financial settings', detail: 'Your monthly take-home pay, budget preferences, and alert settings.' },
              { label: 'Bills and debts', detail: 'Recurring bills and debt details you enter into the app.' },
              { label: 'Bank connection data', detail: 'If you connect your bank, we store an encrypted access token provided by Plaid. We never store your bank login credentials.' },
            ],
          },
          {
            title: '3. How we use your data',
            content: null,
            list: [
              { label: 'To provide the service', detail: 'Displaying your spending, calculating take-home pay, tracking bills, and generating budget plans.' },
              { label: 'To personalise your experience', detail: 'Showing spending insights, subscription detection, and debt payoff plans based on your data.' },
              { label: 'To power the AI budget assistant', detail: 'Your financial context (take-home pay, bills total, disposable income) is sent to Anthropic\'s Claude API to generate personalised budget advice. No personally identifiable information such as your name or email is shared with Anthropic.' },
              { label: 'To maintain the service', detail: 'Diagnosing technical issues and ensuring the app works correctly.' },
            ],
          },
          {
            title: '4. How we store and protect your data',
            content: `All your data is stored securely in Supabase, a cloud database provider with encryption at rest and in transit. We use Row Level Security (RLS) to ensure each user can only access their own data — it is technically impossible for one user to see another user's data.\n\nWe use HTTPS across the entire application. API keys and sensitive credentials are stored as server-side environment variables and are never exposed to the browser.`,
          },
          {
            title: '5. Third parties we share data with',
            content: null,
            list: [
              { label: 'Supabase', detail: 'Our database and authentication provider. Your data is stored on Supabase infrastructure.' },
              { label: 'Plaid', detail: 'If you choose to connect your bank account, Plaid facilitates the connection. Plaid handles your bank credentials directly — we never see them. Plaid\'s privacy policy is available at plaid.com/legal.' },
              { label: 'Anthropic', detail: 'When you use the AI budget assistant, anonymised financial context is sent to Anthropic\'s API to generate responses. See anthropic.com/privacy for their policy.' },
              { label: 'Vercel', detail: 'Our hosting provider. Network requests pass through Vercel\'s infrastructure.' },
            ],
          },
          {
            title: '6. Bank connection and Open Banking',
            content: `When you connect your bank account, Takehome uses Plaid to establish a secure connection under Open Banking regulations. This allows us to read your transaction history. We do not have the ability to move money, make payments, or modify your account in any way.\n\nYou can disconnect your bank at any time by reconnecting and revoking access, or by deleting your Takehome account.`,
          },
          {
            title: '7. Your rights under UK GDPR',
            content: `As a UK resident, you have the following rights regarding your personal data:`,
            list: [
              { label: 'Right to access', detail: 'You can request a copy of all data we hold about you.' },
              { label: 'Right to erasure', detail: 'You can delete your account and all associated data at any time via Settings → Delete account. This permanently removes all your data from our systems.' },
              { label: 'Right to rectification', detail: 'You can update your name and email address in Settings at any time.' },
              { label: 'Right to portability', detail: 'You can export your transaction data at any time.' },
              { label: 'Right to object', detail: 'You can contact us to object to how we process your data.' },
            ],
          },
          {
            title: '8. Data retention',
            content: `We retain your data for as long as your account is active. If you delete your account, all your personal data, transactions, bills, debts, and financial settings are permanently deleted immediately. We do not retain backups of deleted user data beyond 30 days.`,
          },
          {
            title: '9. Cookies',
            content: `Takehome uses only essential cookies required for authentication and session management. We do not use advertising cookies, tracking cookies, or third-party analytics cookies. No cookie consent banner is required as we only use strictly necessary cookies.`,
          },
          {
            title: '10. Children\'s privacy',
            content: `Takehome is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has created an account, please contact us and we will delete the account immediately.`,
          },
          {
            title: '11. Changes to this policy',
            content: `We may update this Privacy Policy from time to time. We will notify registered users of significant changes by email. The date at the top of this page will always reflect when it was last updated. Continued use of Takehome after changes are posted constitutes acceptance of the updated policy.`,
          },
          {
            title: '12. Contact us',
            content: `For any privacy-related questions, data requests, or concerns, please contact us at: [contact email — coming soon]\n\nWe aim to respond to all privacy requests within 30 days.`,
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a1628', marginBottom: 12 }}>{section.title}</h2>
            {section.content && section.content.split('\n\n').map((para, j) => (
              <p key={j} style={{ fontSize: 15, color: '#374151', lineHeight: '1.7', marginBottom: 12 }}>{para}</p>
            ))}
            {section.list && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {section.list.map((item, j) => (
                  <div key={j} style={{ padding: '12px 16px', background: 'white', borderRadius: 10, border: '1px solid #e8f0fe' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628', marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: '1.6' }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ borderTop: '1px solid #e8f0fe', paddingTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ fontSize: 14, color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>Terms of Service →</Link>
          <Link href="/" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>← Back to Takehome</Link>
        </div>
      </div>
    </main>
  );
}