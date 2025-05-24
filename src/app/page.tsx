"use client";

import { SessionProvider } from "next-auth/react";
import DashboardPage from "./pages/Dashboard";
import { useState } from "react";

export default function DashboardClient() {

  return (
    <SessionProvider>
      <DashboardPage />
    </SessionProvider>
  );
}
