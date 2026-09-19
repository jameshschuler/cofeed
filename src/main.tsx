import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouterProvider } from "./router";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
  if ("caches" in window) {
    void window.caches.keys().then((cacheNames) => {
      for (const cacheName of cacheNames) {
        void window.caches.delete(cacheName);
      }
    });
  }
}

if (!import.meta.env.DEV && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouterProvider />
  </React.StrictMode>,
);
