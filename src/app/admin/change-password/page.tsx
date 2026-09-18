// src/app/admin/change-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { changePassword } from "./actions";
import { getBrowserClient } from "@/lib/client";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Create Supabase browser client
  const supabase = getBrowserClient();

  // Validate new password
  useEffect(() => {
    if (!newPassword) {
      setValidationErrors([]);
      return;
    }

    const errors: string[] = [];
    if (newPassword.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(newPassword)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(newPassword)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(newPassword)) errors.push("One number");
    if (!/[^A-Za-z0-9]/.test(newPassword))
      errors.push("One symbol (e.g. !@#$)");

    setValidationErrors(errors);
  }, [newPassword]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [newPassword, confirmPassword]);

  // Countdown timer for redirect
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && countdown === 0) {
      handleSkipToLogin();
    }
  }, [showSuccessModal, countdown]);

  const isFormValid =
    oldPassword &&
    newPassword &&
    confirmPassword &&
    validationErrors.length === 0 &&
    passwordMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);

    const result = await changePassword(oldPassword, newPassword);

    if (result.success) {
      setShowSuccessModal(true);
    } else {
      toast.error(result.message);
      setIsSubmitting(false);
    }
  };

  const handleSkipToLogin = async () => {
    // Explicitly clear Supabase session on the client
    await supabase.auth.signOut();

    // Clear browser storage just in case
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login
    window.location.href = "/login?refresh=true";
  };

  // Success Modal
  if (showSuccessModal) {
    return (
      // FIX: Changed min-h-screen to h-full to fit within the layout container
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-xl dark:bg-slate-800">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/50">
            <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Password Changed Successfully!
          </h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Your password has been updated. You will be redirected to the login
            page.
          </p>
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-2xl font-bold text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/50 dark:text-blue-400">
            {countdown}
          </div>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Redirecting in {countdown} seconds...
          </p>

          <button
            onClick={handleSkipToLogin}
            className="w-full px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* FIX: Changed min-h-screen to h-full to avoid double scrolling */}
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl dark:bg-slate-800">
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900/50">
                <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Change Password
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Create a new password for your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Old Password */}
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Enter current password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showOldPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Enter new password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {newPassword && validationErrors.length > 0 && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Password must contain:{" "}
                    {validationErrors.join(", ").toLowerCase()}.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      !passwordMatch && confirmPassword
                        ? "border-red-500 dark:border-red-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                    placeholder="Confirm new password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {!passwordMatch && confirmPassword && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
