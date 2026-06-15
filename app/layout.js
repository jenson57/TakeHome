import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Takehome — UK Salary & Budget Calculator",
  description: "Calculate your take-home pay, track spending, manage bills and get a personalised budget plan.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer style={{
          borderTop: '1px solid #e8f0fe',
          background: 'white',
          padding: '14px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: 'auto',
        }}>
          🔒 Your data is encrypted and protected. Takehome never sells your personal or financial information. &nbsp;·&nbsp; <a href="/privacy" style={{color:'#9ca3af', textDecoration:'none'}}>Privacy Policy</a> &nbsp;·&nbsp; <a href="/terms" style={{color:'#9ca3af', textDecoration:'none'}}>Terms of Service</a> &nbsp;·&nbsp; © {new Date().getFullYear()} Takehome
        </footer>
      </body>
    </html>
  );
}
