import React from "react";
import App from "./App";
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { browserTracingIntegration } from "@sentry/browser";
// Import global design system styles for ui-new folder
import "./ui-new/design-system/global.css";

const ENABLE_SENTRY = import.meta.env.VITE_ENABLE_SENTRY === "true";
const ENV = import.meta.env.VITE_SENTRY_ENV;

if (ENABLE_SENTRY) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: ENV,
    integrations: [browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong!</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
