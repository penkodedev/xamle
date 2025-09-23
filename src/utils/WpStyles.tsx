// src/components/WpStyles.tsx

/**
 * Obtiene dinámicamente los estilos de bloques y los estilos globales/del tema
 * desde la instalación de WordPress y los inyecta en el <head>.
 */

// Función para obtener los estilos globales usando el endpoint oficial de WordPress
async function getWpGlobalStyles() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/global-styles/themes/${process.env.WP_THEME_SLUG || 'twentytwentyfour'}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!response.ok) {
      // Fallback: intentar obtener los estilos globales del tema activo
      const fallbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/global-styles`,
        { next: { revalidate: 3600 } }
      );
      
      if (!fallbackResponse.ok) return null;
      const fallbackData = await fallbackResponse.json();
      return fallbackData[0] || null; // Tomar el primer elemento (tema activo)
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching WordPress global styles:", error);
    return null;
  }
}

// Función para generar CSS desde los estilos globales de WordPress
function generateCSSFromGlobalStyles(globalStyles: any) {
  if (!globalStyles) return '';
  
  let css = ':root {\n';
  
  // Extraer configuración de colores
  const colorSettings = globalStyles.settings?.color;
  if (colorSettings?.palette?.theme) {
    colorSettings.palette.theme.forEach((color: any) => {
      css += `  --wp--preset--color--${color.slug}: ${color.color};\n`;
    });
  }
  
  // Gradientes omitidos - no se utilizan
  
  // Tipografías omitidas - se manejan por SASS
  
  css += '}\n\n';
  
  // Generar clases auxiliares para colores
  if (colorSettings?.palette?.theme) {
    colorSettings.palette.theme.forEach((color: any) => {
      css += `
.has-${color.slug}-color {
  color: var(--wp--preset--color--${color.slug}) !important;
}

.has-${color.slug}-background-color {
  background-color: var(--wp--preset--color--${color.slug}) !important;
}

.has-${color.slug}-border-color {
  border-color: var(--wp--preset--color--${color.slug}) !important;
}
`;
    });
  }
  
  // Gradientes omitidos - no se utilizan
  
  return css;
}

// Función mejorada para obtener estilos del tema
async function getWpThemeStyles() {
  try {
    // Primero intentar el endpoint mejorado
    const enhancedResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/theme-styles-enhanced`,
      { next: { revalidate: 3600 } }
    );
    
    if (enhancedResponse.ok) {
      const data = await enhancedResponse.json();
      return data.styles || '';
    }
    
    // Fallback al endpoint original
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/theme-styles`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    const data = await response.json();

    const globalStyles = data.styles || '';
    const elementStyles = data.elements_styles || '';

    return globalStyles + elementStyles;
  } catch (error) {
    console.error("Error fetching WordPress theme styles:", error);
    return null;
  }
}

export default async function WpStyles() {
  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace("/wp-json", "");

  if (!wpUrl) {
    return null;
  }

  // 1. Obtener los estilos globales usando la API oficial de WordPress
  const globalStyles = await getWpGlobalStyles();
  const generatedCSS = generateCSSFromGlobalStyles(globalStyles);
  
  // 2. Fallback: obtener estilos del tema usando tu endpoint custom
  const themeStyles = await getWpThemeStyles();

  // 3. URLs de las hojas de estilo estándar de Gutenberg
  const blockLibraryUrl = `${wpUrl}/wp-includes/css/dist/block-library/style.css`;
  const themeLibraryUrl = `${wpUrl}/wp-includes/css/dist/block-library/theme.css`;
  const editorLibraryUrl = `${wpUrl}/wp-includes/css/dist/block-editor/style.css`;

  // 4. CSS base esencial para Gutenberg
  const essentialStyles = `
    /* Variables CSS base por si no se cargan desde WordPress */
    :root {
      --wp--preset--color--black: #000000;
      --wp--preset--color--cyan-bluish-gray: #abb8c3;
      --wp--preset--color--white: #ffffff;
      --wp--preset--color--pale-pink: #f78da7;
      --wp--preset--color--vivid-red: #cf2e2e;
      --wp--preset--color--luminous-vivid-orange: #ff6900;
      --wp--preset--color--luminous-vivid-amber: #fcb900;
      --wp--preset--color--light-green-cyan: #7bdcb5;
      --wp--preset--color--vivid-green-cyan: #00d084;
      --wp--preset--color--pale-cyan-blue: #8ed1fc;
      --wp--preset--color--vivid-cyan-blue: #0693e3;
      --wp--preset--color--vivid-purple: #9b51e0;
    }

    /* Clases esenciales para colores de texto */
    .has-text-color {
      color: inherit;
    }
    
    .has-background {
      background-color: inherit;
    }
    
    .has-link-color a {
      color: inherit;
    }

    /* Clases específicas que faltan */
    .has-black-color { color: var(--wp--preset--color--black) !important; }
    .has-white-color { color: var(--wp--preset--color--white) !important; }
    .has-black-background-color { background-color: var(--wp--preset--color--black) !important; }
    .has-white-background-color { background-color: var(--wp--preset--color--white) !important; }
    
    /* Asegurar que los elementos con fondo tengan padding */
    .has-background {
      padding: 1.25em 2.375em;
    }
    
    /* Estilos para párrafos con fondo */
    p.has-background {
      padding: 1em 1.5em;
    }
    
    /* Botones con colores */
    .wp-block-button__link.has-background {
      border: none;
      text-decoration: none;
    }
    
    /* Alineaciones de texto */
    .has-text-align-left { text-align: left; }
    .has-text-align-center { text-align: center; }
    .has-text-align-right { text-align: right; }
    .has-text-align-justify { text-align: justify; }
  `;

  return (
    <>
      {/* Hojas de estilo estándar de WordPress/Gutenberg */}
      <link rel="stylesheet" href={blockLibraryUrl} />
      <link rel="stylesheet" href={themeLibraryUrl} />
      <link rel="stylesheet" href={editorLibraryUrl} />
      
      {/* Estilos esenciales (incluyendo variables CSS base) */}
      <style dangerouslySetInnerHTML={{ __html: essentialStyles }} />
      
      {/* CSS generado desde los estilos globales de WordPress */}
      {generatedCSS && (
        <style dangerouslySetInnerHTML={{ __html: generatedCSS }} />
      )}
      
      {/* Estilos del tema (fallback) */}
      {themeStyles && (
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      )}
    </>
  );
}