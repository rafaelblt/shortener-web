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

import { createHttpServices } from "@/http/http-services";
import { createSimulatedServices } from "@/simulation/simulated-services";

import { contextWith } from "./router-context";
import { routes } from "./routes";
import { SimulationBanner } from "./SimulationBanner";

// The mode of Vite: npm run dev and the browser tests build the simulation, and npm run build the
// app that reaches the server. The build of one leaves the other out.
const simulated = import.meta.env.MODE === "simulation";

// Slow enough for the pending states of the pages to show, as they do with the back ends.
const SIMULATED_LATENCY = { minMs: 250, maxMs: 700 };

const services = simulated
  ? createSimulatedServices({ withDemoData: true, latency: SIMULATED_LATENCY })
  : createHttpServices();
const router = createBrowserRouter(routes, { getContext: contextWith(services, { simulated }) });

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    {simulated && <SimulationBanner />}
    <RouterProvider router={router} />
  </StrictMode>,
);
