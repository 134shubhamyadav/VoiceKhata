import "./globals.css";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "VoiceKhata - Bolke Rakho Hisaab",
  description: "AI-powered voice bookkeeping for Bharat merchants",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
