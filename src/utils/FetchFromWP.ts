// src/utils/fetchFromWP.ts
export async function fetchFromWP<T>(endpoint: string): Promise<T> {
    const base = process.env.NEXT_PUBLIC_WP_API;
    const res = await fetch(`${base}${endpoint}`);
    if (!res.ok) throw new Error("Error al cargar datos de WordPress");
    return res.json();
  }
  