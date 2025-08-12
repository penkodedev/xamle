# XAMLE - Anti-racist Self-Assessment Tool

This is a web application designed to provide an anti-racist self-assessment for professionals in the education sector. Users can take a survey to reflect on and transform their teaching practices. The project was developed for MAD África.

## ✨ Features

*   **Multi-Scope Survey**: The survey is divided into different scopes or areas, each with its own set of questions.
*   **Scoring System**: Responses are weighted to calculate a score for each scope and a final overall score.
*   **Detailed Results**: Users receive a detailed evaluation for each completed scope.
*   **Final Evaluation**: After completing all scopes, a final evaluation is presented with an overall assessment.
*   **PDF Report Generation**: Users can download a detailed PDF report of their answers and final score.
*   **Granular Cookie Consent**: A comprehensive cookie consent manager allows users to choose which cookie categories to enable.
*   **Dynamic Content**: Survey questions and other site information are fetched from a WordPress backend, allowing for easy content management.
*   **Interactive UI**: Includes components like a "Scroll to Top" button and animated backgrounds for an engaging user experience.

## 🛠️ Tech Stack

*   **Frontend**: [Next.js](https://nextjs.org/) (React Framework)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: CSS (The project seems to use global CSS and potentially CSS Modules).
*   **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
*   **Backend**: [WordPress](https://wordpress.org/) (as a headless CMS)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and a package manager (like npm or yarn) installed.

*   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/xamle-project.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables. Create a `.env.local` file in the root of the project and add the necessary variables.

    ```env
    NEXT_PUBLIC_WP_API_URL=http://your-wordpress-site.com/wp-json
    NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
    NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXXXXXXXX
    ```

4.  Run the development server:
    ```sh
    npm run dev
    ```

Open http://localhost:3000 with your browser to see the result.

## 📜 Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts a Next.js production server.
*   `npm run lint`: Runs the linter to check for code quality issues.

## 📁 Project Structure

The project follows the standard Next.js App Router structure.

```
/src
├── app/                  # Main application routes
│   ├── encuesta/         # Survey page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── assets/               # Static assets like images
├── components/           # Reusable React components
│   ├── Encuesta.tsx      # Main survey logic component
│   ├── CookieConsent.tsx # Cookie consent banner
│   ├── Footer.tsx        # Site footer
│   └── ...
└── utils/                # Utility functions and custom hooks
    ├── useCookieConsent.ts # Hook for managing cookie logic
    └── generarPDF.ts     # PDF generation utility
```