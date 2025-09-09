// src/components/utils/BodyClass.tsx
"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

// Mapa ruta -> array de clases a aplicar al body
const routeBodyClassMap: Record<string, string[]> = {
  "/contacto": ["page-contacto"],
  "/encuesta": ["page-encuesta", "encuesta"],
};

const BodyClass = () => {
  const pathname = usePathname();
  const bodyClasses = useMemo(
    () => routeBodyClassMap[pathname] || [],
    [pathname]);

  useEffect(() => {
    const body = document.body;

    // Añadir clases
    bodyClasses.forEach((cls) => body.classList.add(cls));

    // Limpiar al desmontar o cambiar ruta
    return () => {
      bodyClasses.forEach((cls) => body.classList.remove(cls));
    };
  }, [bodyClasses]);

  return null;
};

export default BodyClass;
