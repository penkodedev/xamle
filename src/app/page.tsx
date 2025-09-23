// src/app/page.tsx
// HOME PAGE

'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [pageContent, setPageContent] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/pages?slug=inicio`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setPageContent(data[0].content.rendered);
      })
      .finally(() => setCargando(false));
  }, []);


  if (cargando) {
    return (
      <div className="loader-overlay">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className='layout-encuesta'>
    <article className="home-content">
      <div
        className="wordpress-content"
        dangerouslySetInnerHTML={{ __html: pageContent }}
      />
      </article>
      </div>
  );
}