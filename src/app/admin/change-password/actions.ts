// src/app/admin/change-password/actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validatePasswordStrength } from "@/lib/password";
import { getServiceClient } from "@/lib/supabase-admin";

async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const supabase = await createAuthClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  // Server-enforced strength (client checks are bypassable).
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return { success: false, message: strengthError };
  }
  if (typeof oldPassword !== "string" || !oldPassword) {
    return { success: false, message: "Current password is required" };
  }

  // Verify old password by trying to sign in with it
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: oldPassword,
  });

  if (signInError) {
    return { success: false, message: "Current password is incorrect" };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  try {
    // Global sign-out: a changed password must not leave other sessions
    // (possibly attacker-held) alive.
    await getServiceClient().auth.admin.signOut(user.id);
  } catch (err) {
    console.error("Global sign-out after password change failed:", err);
  }

  try {
    await getServiceClient().from("admin_audit_log").insert({
      admin_id: user.id,
      action: "auth.password_changed",
      details: { message: "Password changed via change-password page" },
    });
  } catch (err) {
    console.error("Password-change audit log failed:", err);
  }

  // Sign out the current session (cookies now persist via setAll).
  await supabase.auth.signOut();

  return { success: true, message: "Password changed successfully!" };
}
