import type { Metadata } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuoLar",
  description: "SaaS inteligente para rotina doméstica, compras e finanças do casal."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
