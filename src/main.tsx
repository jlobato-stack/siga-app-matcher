import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

function restoreRedirectedPath() {
  if (typeof window === "undefined") {
    return;
  }

  const redirectPath = window.sessionStorage.getItem("siga-pages-redirect");
  if (!redirectPath) {
    return;
  }

  window.sessionStorage.removeItem("siga-pages-redirect");
  window.history.replaceState({}, "", redirectPath);
}

restoreRedirectedPath();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
