// src/components/utils/BodyClass.tsx
"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

const BodyClass = () => {
  const pathname = usePathname();

  // Genera clases dinámicamente a partir del pathname
  const bodyClasses = useMemo(() => {
    if (pathname === "/") {
      return ["page-home"];
    }
    // Convierte "/mi-ruta/sub-ruta" en "page-mi-ruta-sub-ruta"
    const className = `page-${pathname.substring(1).replace(/\//g, "-")}`;
    return [className];
  }, [pathname]);

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
