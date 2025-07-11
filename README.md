<<<<<<< HEAD
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
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 409ccc9 (Primer commit)
