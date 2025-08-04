# Xamle

**Xamle** es una plataforma moderna de encuesta/interacción basada en React (frontend) y WordPress (backend headless).  
Diseñada para ser escalable, flexible y fácil de personalizar.

---

## Características

- Frontend en React con TypeScript y animaciones con Framer Motion.
- Backend WordPress personalizado para manejar preguntas, respuestas y colaboradores.
- Consumo de API REST personalizada de WordPress.
- Arquitectura modular para fácil extensión y mantenimiento.
- UI responsiva y accesible.
- Sin dependencias innecesarias: control total del código.

---

## Instalación

### Backend (WordPress)

1. Configura WordPress (preferiblemente Local by Flywheel o similar).
2. Añade los Custom Post Types y endpoints REST personalizados según la documentación interna.
3. Activa solo los plugins necesarios (idealmente solo Yoast SEO y Contact Form 7).
4. Asegúrate que la API REST esté disponible en `http://tu-sitio.local/wp-json/custom/v1/`.

### Frontend (React)

```bash
git clone https://github.com/tuusuario/xamle.git
cd xamle
npm install
npm run dev
```


sequenceDiagram
    participant Usuario
    participant Navegador
    participant App
    participant WP_API as WordPress API

    Usuario->>Navegador: Accede a la web
    Navegador->>App: Monta la aplicación
    App->>WP_API: GET /custom/v1/preguntas
    WP_API-->>App: Devuelve preguntas y ámbitos
    App->>Usuario: Muestra primera pregunta

    loop Por cada ámbito
        Usuario->>App: Responde pregunta
        App->>App: Guarda respuesta
        App->>Usuario: Muestra siguiente pregunta o resultado del ámbito
        Usuario->>App: Click "Siguiente ámbito"
    end

    Usuario->>App: Click "Finalizar encuesta"
    App->>WP_API: POST /custom/v1/colaboradores (envía respuestas)
    WP_API-->>App: Confirma recepción
    App->>Usuario: Muestra mensaje final