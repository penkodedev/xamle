// src/components/WpStyles.tsx

/**
 * Obtiene dinámicamente los estilos de bloques y los estilos globales/del tema
 * desde la instalación de WordPress y los inyecta en el <head>.
 *
 * Esto asegura que el frontend renderice el contenido de Gutenberg correctamente
 * (alineaciones de texto y de contenedores, colores, etc.) sin necesidad
 * de mantener CSS manualmente.
 *
 * Es un Server Component asíncrono.
 */
async function getWpThemeStyles() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/theme-styles`,
      { next: { revalidate: 3600 } } // Cache de 1 hora
    );
    if (!response.ok) return null;
    const data = await response.json();
    // La API devuelve el CSS dentro de una propiedad 'styles'
    return data.styles || null;
  } catch (error) {
    console.error("Error fetching WordPress theme styles:", error);
    return null;
  }
}

export default async function WpStyles() {
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(
    "/wp-json",
    ""
  );

  if (!wpUrl) {
    return null;
  }

  // 1. Obtener los estilos globales y del tema (variables, justificación, etc.)
  const themeStyles = await getWpThemeStyles();

  // 2. URLs de las hojas de estilo de los bloques
  const blockLibraryUrl = `${wpUrl}/wp-includes/css/dist/block-library/style.css`;

  return (
    <>
      {/* Hoja de estilos base de los bloques */}
      <link rel="stylesheet" href={blockLibraryUrl} />
      {/* Estilos inline (variables de color, etc.) */}
      {themeStyles && (
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      )}
    </>
  );
}