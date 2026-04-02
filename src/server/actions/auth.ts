"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { createSession, clearSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await compare(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  redirect("/dashboard");
}

export async function signOutAction() {
  await clearSession();
  redirect("/login");
}
