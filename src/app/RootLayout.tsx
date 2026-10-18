import { Outlet, ScrollRestoration, useNavigation } from "react-router";

import { PendingBar } from "@/ui/PendingBar";

import { SimulationBanner } from "./SimulationBanner";

export function RootLayout() {
  const navigation = useNavigation();
  return (
    <>
      <PendingBar visible={navigation.state !== "idle"} />
      <SimulationBanner />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
