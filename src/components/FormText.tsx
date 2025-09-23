// src/components/FormText.tsx

'use client';

import { useEffect, useState } from 'react';

export default function TextForm() {
  const [pageContent, setPageContent] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/pages?slug=texto-formulario`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setPageContent(data[0].content.rendered);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) { // condición para el spinner antes del return
    return (
      <div className="loader-overlay">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div
      className="form-text"
      dangerouslySetInnerHTML={{ __html: pageContent }}
    />
  );
}
