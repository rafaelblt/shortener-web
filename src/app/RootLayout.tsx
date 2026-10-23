import { Outlet, ScrollRestoration, useNavigation } from "react-router";

import { PendingBar } from "@/ui/PendingBar";

export function RootLayout() {
  const navigation = useNavigation();
  return (
    <>
      <PendingBar visible={navigation.state !== "idle"} />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
