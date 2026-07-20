import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppSueldo - Liquidación de Sueldos",
  description: "Calculadora de sueldos para seguridad privada - UPSRA CCT 507/07",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
