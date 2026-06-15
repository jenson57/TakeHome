import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Takehome',
  description: 'Terms and conditions for using the Takehome personal finance application.',
};

export default function TermsPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 8 }}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 40 }}>
          Please read these Terms of Service carefully before using Takehome. By creating an account or using the service, you agree to be bound by these terms.
        </p>

        {[
          {
            title: '1. About Takehome',
            content: `Takehome is a personal finance application available at gettakehome.xyz. It provides tools including a UK salary calculator, spending tracker, bill manager, budget planner, and debt payoff planner. Takehome is intended for personal, non-commercial use by individuals managing their own finances.`,
          },
          {
            title: '2. Eligibility',
            content: `You must be at least 18 years old and a resident of the United Kingdom to use Takehome. By creating an account, you confirm that you meet these requirements. We reserve the right to close accounts that do not meet these criteria.`,
          },
          {
            title: '3. Your account',
            content: `You are responsible for maintaining the security of your account credentials. You must not share your password with anyone or allow others to access your account. You are responsible for all activity that occurs under your account.\n\nYou agree to provide accurate information when creating your account and to keep it up to date. We reserve the right to suspend or terminate accounts that provide false information.`,
          },
          {
            title: '4. The service',
            content: `Takehome provides financial tracking and planning tools for informational purposes only. Nothing in the app constitutes financial advice, investment advice, or professional financial guidance.\n\nThe salary calculator uses UK tax rates and National Insurance figures that are believed to be accurate but may not reflect the most recent HMRC figures. Always consult a qualified financial advisor or HMRC directly for authoritative tax information.\n\nThe AI budget assistant generates suggestions based on the information you provide. These suggestions are for guidance only and should not be treated as professional financial advice.`,
          },
          {
            title: '5. Bank connection',
            content: `If you choose to connect your bank account, you authorise Takehome to access your transaction history via our banking partner Plaid. This access is read-only — we cannot make payments, transfers, or any changes to your bank account.\n\nYou can revoke this access at any time by disconnecting your bank in the app or by contacting your bank directly to revoke Open Banking permissions.\n\nWe are not responsible for any issues arising from Plaid's service, including data delays, inaccuracies in transaction data, or service outages.`,
          },
          {
            title: '6. Acceptable use',
            content: `You agree not to:`,
            list: [
              { label: 'Misuse the service', detail: 'Use Takehome for any unlawful purpose or in a way that violates these terms.' },
              { label: 'Attempt to gain unauthorised access', detail: 'Try to access other users\' data, bypass security measures, or exploit vulnerabilities in the app.' },
              { label: 'Abuse the AI assistant', detail: 'Use the budget chat to generate harmful content or attempt to manipulate the AI into violating its guidelines.' },
              { label: 'Reverse engineer the app', detail: 'Attempt to copy, decompile, or extract the source code of Takehome.' },
            ],
          },
          {
            title: '7. Data and privacy',
            content: `Your use of Takehome is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please read it carefully at gettakehome.xyz/privacy.`,
          },
          {
            title: '8. Intellectual property',
            content: `All content, design, code, and features of Takehome are the intellectual property of Takehome. You may not reproduce, distribute, or create derivative works from any part of the service without explicit written permission.`,
          },
          {
            title: '9. Disclaimers and limitation of liability',
            content: `Takehome is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that financial calculations will be perfectly accurate in all circumstances.\n\nTo the maximum extent permitted by UK law, Takehome shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to financial losses resulting from reliance on information provided by the app.\n\nNothing in these terms limits our liability for fraud, death, or personal injury caused by negligence, as required by UK law.`,
          },
          {
            title: '10. Changes to the service',
            content: `We reserve the right to modify, suspend, or discontinue any part of Takehome at any time. We will endeavour to give reasonable notice of significant changes. Continued use of the service after changes constitutes acceptance of the updated terms.`,
          },
          {
            title: '11. Termination',
            content: `You may delete your account at any time via Settings → Delete account. This will permanently remove all your data.\n\nWe reserve the right to suspend or terminate your account if you violate these terms, engage in fraudulent activity, or use the service in a way that could harm other users or the integrity of the platform.`,
          },
          {
            title: '12. Governing law',
            content: `These Terms of Service are governed by the laws of England and Wales. Any disputes arising from these terms or your use of Takehome shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
          },
          {
            title: '13. Contact',
            content: `If you have any questions about these Terms of Service, please contact us at: [contact email — coming soon]`,
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
          <Link href="/privacy" style={{ fontSize: 14, color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>← Back to Takehome</Link>
        </div>
      </div>
    </main>
  );
}