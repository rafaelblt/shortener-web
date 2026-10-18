import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/ui/styles/tokens.css";
import "@/ui/styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { createSimulatedServices } from "@/simulation/simulated-services";

import { contextWith } from "./router-context";
import { routes } from "./routes";

// Slow enough for the pending states of the pages to show, as they will with real back ends.
const SIMULATED_LATENCY = { minMs: 250, maxMs: 700 };

const services = createSimulatedServices({ withDemoData: true, latency: SIMULATED_LATENCY });
const router = createBrowserRouter(routes, { getContext: contextWith(services) });

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
