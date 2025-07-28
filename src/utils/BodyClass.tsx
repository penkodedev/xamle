// src/components/utils/BodyClass.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mapa ruta -> array de clases a aplicar al body
const routeBodyClassMap: Record<string, string[]> = {
  "/contacto": ["page-contacto"],
  "/encuesta": ["page-encuesta", "encuesta"],
};

const BodyClass = () => {
  const pathname = usePathname();
  const bodyClasses = routeBodyClassMap[pathname] || [];

  useEffect(() => {
    const body = document.body;

    // Añadir clases
    bodyClasses.forEach((cls) => body.classList.add(cls));

    // Limpiar al desmontar o cambiar ruta
    return () => {
      bodyClasses.forEach((cls) => body.classList.remove(cls));
    };
  }, [pathname]);

  return null;
};

export default BodyClass;
