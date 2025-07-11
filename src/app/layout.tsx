// src/app/layout.tsx

import type { ReactNode } from "react";
import "../sass/main.scss";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";

export const metadata = {
  title: "MAD África | Encuesta formación en educación",
  description: "Nivel de formación en educación antirracista y conciencia de su necesidad",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <ScrollToTop />
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
