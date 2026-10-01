// src/app/admin/users/actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase-admin";
import { getPublicSettings } from "@/lib/public-settings";
import { validatePasswordStrength } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import { render } from "@react-email/render";
import PasswordResetEmail from "@/components/emails/PasswordResetEmail";

// Helper function to create admin supabase client
async function createAdminClient() {
  return getServiceClient();
}

// Helper function to check if current user is an ACTIVE super_admin.
// Both role and status are enforced: a suspended super_admin keeps no
// server-action power (mirrors src/lib/api-auth.ts).
async function checkSuperAdminAccess() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, message: "Not authenticated", userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" || profile?.status !== "active") {
    return {
      authorized: false,
      message: "Access denied. Active super admin role required.",
      userId: user.id,
    };
  }

  return { authorized: true, userId: user.id };
}

/**
 * Server-side user listing (service role). The get_all_users_with_profiles
 * RPC no longer allows `authenticated` callers, so the client page must go
 * through here instead of rpc() from the browser.
 */
export async function listUsers() {
  const authCheck = await checkSuperAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message, users: [] };
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("get_all_users_with_profiles");

  if (error) {
    console.error("Error listing users:", error.message);
    return { success: false, message: "Could not load users.", users: [] };
  }
  return { success: true, users: data || [] };
}

// Removed dynamic getBanDuration. Using static 100 years now.
const STATIC_BAN_DURATION = "876000h"; // ~100 years

// Create the new user function
export async function createUser(formData: FormData) {
  const authCheck = await checkSuperAdminAccess();
  if (!authCheck.authorized || !authCheck.userId) {
    return { success: false, message: authCheck.message };
  }

  const supabase = await createAdminClient();

  const fullName = ((formData.get("fullName") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const role = formData.get("role") as string;
  const status = formData.get("status") as string;

  if (!fullName) {
    return { success: false, message: "Full name is required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "A valid email address is required." };
  }
  if (role !== "admin" && role !== "super_admin") {
    return { success: false, message: "Invalid role." };
  }
  if (status !== "active" && status !== "inactive" && status !== "suspended") {
    return { success: false, message: "Invalid status." };
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { success: false, message: passwordError };
  }

  // Create the new user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError) return { success: false, message: authError.message };

  if (authData.user) {
    // Update Profile — verify the row exists (trigger creates it); a
    // zero-row update means the trigger is missing, so roll the auth user
    // back instead of leaving an orphan that can never log in.
    const { data: updatedRows, error: profileError } = await supabase
      .from("profiles")
      .update({ role: role, status: status, created_by: authCheck.userId })
      .eq("id", authData.user.id)
      .select("id");

    if (profileError || !updatedRows || updatedRows.length === 0) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        message:
          profileError?.message ||
          "Profile setup failed (missing trigger). User was rolled back — contact support.",
      };
    }

    // Ban user if not active
    if (status !== "active") {
      await supabase.auth.admin.updateUserById(authData.user.id, {
        ban_duration: STATIC_BAN_DURATION,
      });
    }

    // Audit Log
    await supabase.from("admin_audit_log").insert({
      admin_id: authCheck.userId,
      action: "user.create",
      target_user_id: authData.user.id,
      details: {
        message: `Created user ${email} with role ${role}`,
        email: email,
        role: role,
        status: status,
      },
    });
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User created successfully!" };
}

// Delete user function
export async function deleteUser(userId: string) {
  // Check authorization first
  const authCheck = await checkSuperAdminAccess();
  if (!authCheck.authorized || !authCheck.userId) {
    return { success: false, message: authCheck.message };
  }

  // ---------------------------------------------------------
  // ✅ SAFETY CHECK: Prevent Self-Deletion
  // ---------------------------------------------------------
  if (userId === authCheck.userId) {
    return { success: false, message: "You cannot delete your own account." };
  }
  // ---------------------------------------------------------

  const supabase = await createAdminClient();

  // Get user email *before* deleting, for the log message
  const { data: userToLog } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, message: error.message };
  }

  // Audit Log
  await supabase.from("admin_audit_log").insert({
    admin_id: authCheck.userId,
    action: "user.delete",
    target_user_id: userId,
    details: {
      message: `Deleted user ${userToLog?.email || userId}`,
      deleted_email: userToLog?.email || "unknown",
    },
  });

  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully!" };
}

// Update user function
export async function updateUser(formData: FormData) {
  const authCheck = await checkSuperAdminAccess();
  if (!authCheck.authorized || !authCheck.userId) {
    return { success: false, message: authCheck.message };
  }

  const supabase = await createAdminClient();
  const id = formData.get("id") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const status = formData.get("status") as string;

  const { data: oldData } = await supabase
    .from("profiles")
    .select("role, status, email, full_name")
    .eq("id", id)
    .single();

  // Safety Checks
  if (oldData?.role === "super_admin") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "super_admin");
    if (count === 1 && role !== "super_admin") {
      return { success: false, message: "Cannot demote the last super admin." };
    }
  }

  const { data: { user } } = await supabase.auth.admin.getUserById(id);
  if (!user) return { success: false, message: "User not found in auth system." };

  if (user.email !== email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, { email: email });
    if (authError) return { success: false, message: `Failed to update auth email: ${authError.message}` };
  }

  // Handle ban/unban with static 100 years
  if (status === "inactive" || status === "suspended") {
    const { error: banError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: STATIC_BAN_DURATION,
    });
    if (banError) console.error("Failed to ban user:", banError);
  } else if (status === "active") {
    const { error: unbanError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (unbanError) console.error("Failed to unban user:", unbanError);
  }

  // Update profile and Audit Log
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, email: email, role: role, status: status })
    .eq("id", id);

  if (profileError) return { success: false, message: profileError.message };

  const changes: string[] = [];
  if (oldData?.role !== role) changes.push(`role: ${oldData?.role} -> ${role}`);
  if (oldData?.status !== status) changes.push(`status: ${oldData?.status} -> ${status}`);
  if (oldData?.email !== email) changes.push(`email: ${oldData?.email} -> ${email}`);

  const message = `Updated user ${email}. Changes: ${changes.join(", ") || "Details updated"}`;

  await supabase.from("admin_audit_log").insert({
    admin_id: authCheck.userId,
    action: "user.update",
    target_user_id: id,
    details: {
        message: message,
        changes: changes
    }
  });

  revalidatePath("/admin/users");
  return { success: true, message: "User updated successfully!" };
}

// Action to send a password reset email (actually sends via Resend).
export async function resetUserPassword(email: string) {
  // Check authorization first
  const authCheck = await checkSuperAdminAccess();
  if (!authCheck.authorized || !authCheck.userId) {
    return { success: false, message: authCheck.message };
  }

  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, message: "A valid email address is required." };
  }

  // Throttle: reset mails cost Resend quota and enable harassment.
  const rate = await checkRateLimit({
    key: `pwdreset:${authCheck.userId}:${normalizedEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return {
      success: false,
      message: "Too many reset requests. Please try again later.",
    };
  }

  const supabase = await createAdminClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";

  // generateLink alone sends nothing — the returned action_link must be
  // emailed. Point it at our callback so the code becomes a session.
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password` },
  });

  if (error || !linkData?.properties?.action_link) {
    // Generic message: don't reveal whether the address exists.
    return {
      success: false,
      message: "Could not send reset link. Please try again.",
    };
  }

  // Deliver the link via Resend (Supabase does not send it for us).
  try {
    const settings = await getPublicSettings();
    // Fail-loud placeholder: "example.com" can never deliver, so a missing
    // sender fails loudly at Resend instead of silently sending from a test
    // address that only reaches the Resend account owner.
    const senderEmail =
      process.env.RESEND_FROM_EMAIL || "unconfigured-sender@example.com";
    if (senderEmail === "unconfigured-sender@example.com") {
      console.warn(
        "Email sender is not configured. Set RESEND_FROM_EMAIL (env) to a verified-domain address."
      );
    }
    const senderName = settings.email_sender_name || "KaizenHR";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = await render(
      PasswordResetEmail({ resetUrl: linkData.properties.action_link })
    );

    const { error: sendError } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: normalizedEmail,
      subject: "Reset your KaizenHR password",
      html,
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    await supabase.from("email_send_log").insert({
      email_type: "password_reset",
      status: "sent",
    });
  } catch (sendError) {
    console.error("Password reset email failed:", sendError);
    await supabase.from("email_send_log").insert({
      email_type: "password_reset",
      status: "failed",
      error_message:
        sendError instanceof Error ? sendError.message : "Unknown error",
    });
    return {
      success: false,
      message: "Could not send reset email. Please try again.",
    };
  }

  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  await supabase.from("admin_audit_log").insert({
    admin_id: authCheck.userId,
    action: "user.password_reset",
    target_user_id: targetUser?.id || null,
    details: {
      message: `Sent password reset link to ${normalizedEmail}`,
      email: normalizedEmail,
    },
  });

  return { success: true, message: "Password reset link sent successfully!" };
}