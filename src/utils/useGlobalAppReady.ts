"use client";

import { useEffect, useState } from "react";

// Simula una carga global (puedes añadir fetchs reales más tarde)
export function useGlobalAppReady() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0); // puedes ajustar el delay

    return () => clearTimeout(timer);
  }, []);

  return { loading };
}
