// src/app/layout.tsx

import "@/sass/main.scss";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import BodyClass from "@/utils/BodyClass";
import CookieConsent from "@/components/CookieConsent";
import CookieManager from "@/components/CookieManager";
import WpStyles from "@/utils/WpStyles";

export const metadata = {
  icons: {
    icon: '/favicon.png',
  },
  
  title: "XAMLE | Encuesta formación en educación",
  description: "Nivel de formación en educación antirracista y conciencia de su necesidad",
  keywords: ["educación", "antirracismo", "encuesta", "formación", "XAMLE"],
  author: "Paulo Ramalho | penkode.com",
  robots: "index, follow",
  metadataBase: new URL("https://xamle.madafrica.es"),
  openGraph: {
    title: "XAMLE | Encuesta formación en educación",
    description: "Participa en nuestra encuesta sobre formación en educación antirracista.",
    url: "https://xamle.madafrica.es",
    type: "website",
    images: [
      {
        // Usar el favicon como imagen para redes sociales
        url: "/favicon.png", 
        width: 1200,
        height: 630,
        alt: "Logo de XAMLE y MAD África"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "XAMLE | Encuesta formación en educación",
    description: "Participa en nuestra encuesta sobre formación en educación antirracista.",
    images: ["/favicon.png"] // La misma imagen para Twitter
  }
};

// Exporta viewport por separado (Next.js 13+)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      {/* Carga los estilos de WordPress aquí para que tengan prioridad */}
      <head>
        <WpStyles />
      </head>

      <body>
        <BodyClass />
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
