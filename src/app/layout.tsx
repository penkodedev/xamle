// src/app/layout.tsx

import type { ReactNode } from "react";
import "@/sass/main.scss";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import CookieManager from "@/components/CookieManager";

export const metadata = {
  title: "XAMLE | Encuesta formación en educación",
  description: "Nivel de formación en educación antirracista y conciencia de su necesidad",
  keywords: ["educación", "antirracismo", "encuesta", "formación", "XAMLE"],
  author: "Paulo Ramalho | penkode.com",
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "XAMLE | Encuesta formación en educación",
    description: "Participa en nuestra encuesta sobre formación en educación antirracista.",
    url: "https://xamle.com",
    type: "website",
    images: [
      {
        url: "/logo-xamle-mad-footer.png",
        width: 1200,
        height: 630,  // Ancho y alto de la imagen
        alt: "Logo XAMLE"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "XAMLE | Encuesta formación en educación",
    description: "Participa en nuestra encuesta sobre formación en educación antirracista.",
    images: [
      "/logo-xamle-mad-footer.png"
    ]
  },
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {

// *************** Empieza el return del layout general *************** //
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <ScrollToTop />
        <Footer />
        <CookieConsent />
        <CookieManager />
      </body>
    </html>
  );
}
