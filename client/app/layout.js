import "./globals.css";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "VoiceKhata - Bolke Rakho Hisaab",
  description: "AI-powered voice bookkeeping for Bharat merchants",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  themeColor: "#10b981",
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if(localStorage.getItem('theme')==='dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}` }} />
      </head>
      <body>
        <AuthProvider>
          <main className="relative min-h-screen">
            {children}
          </main>
          <BottomNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}
