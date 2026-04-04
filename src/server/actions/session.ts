"use server";

import { redirect } from "next/navigation";

import { clearPendingAuthSession, clearSession } from "@/lib/auth/session";

export async function signOutAction() {
  await clearPendingAuthSession();
  await clearSession();
  redirect("/login");
}
