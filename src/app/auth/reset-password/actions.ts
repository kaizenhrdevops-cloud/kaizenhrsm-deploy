// src/app/auth/reset-password/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { validatePasswordStrength } from "@/lib/password";
import { getServiceClient } from "@/lib/supabase-admin";

/**
 * Sets a new password for the currently-recovered session (no old password
 * needed — possession of the single-use recovery link is the proof).
 * Strength is enforced server-side with the shared policy.
 */
export async function resetPassword(newPassword: string) {
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return { success: false, message: strengthError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Session expired. Please request a new reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, message: error.message };
  }

  try {
    // Global sign-out: the whole point of a reset may be locking someone
    // else out — prior sessions must not survive it.
    await getServiceClient().auth.admin.signOut(user.id);
  } catch (err) {
    console.error("Global sign-out after password reset failed:", err);
  }

  try {
    await getServiceClient().from("admin_audit_log").insert({
      admin_id: user.id,
      action: "auth.password_reset_completed",
      details: { message: "Password set via recovery link" },
    });
  } catch (err) {
    console.error("Password-reset audit log failed:", err);
  }

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}
