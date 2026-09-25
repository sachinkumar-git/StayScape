import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "flatpickr/dist/flatpickr.min.css";
import "leaflet/dist/leaflet.css";
import "bootstrap";
import "./styles/index.css";
import { SessionProvider } from "./context/SessionContext.jsx";
import { FlashProvider } from "./context/FlashContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <FlashProvider>
          <App />
        </FlashProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);
