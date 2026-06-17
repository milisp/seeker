import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from '@/components/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/lib/i18n';

const AboutView = lazy(() => import('@/views/about-view'));
const isAboutWindow = window.location.pathname === '/about';

// i18n is fully initialized via top-level await in i18n.ts before this runs.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        {isAboutWindow ? <AboutView /> : <App />}
      </I18nextProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
