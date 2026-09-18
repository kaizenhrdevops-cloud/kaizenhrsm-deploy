"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/client";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Edit,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ProfileData } from "@/types/profile";
import EditProfileModal from "@/components/admin/EditProfileModal";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { updateProfile } from "./actions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses =
    "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
  switch (status) {
    case "active":
      return (
        <span
          className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}
        >
          Active
        </span>
      );
    case "inactive":
      return (
        <span
          className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}
        >
          Inactive
        </span>
      );
    case "suspended":
      return (
        <span
          className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}
        >
          Suspended
        </span>
      );
    default:
      return (
        <span
          className={`${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300`}
        >
          Unknown
        </span>
      );
  }
};

const RoleBadge = ({ role }: { role: string }) => {
  const baseClasses =
    "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";

  if (role === "super_admin") {
    return (
      <span
        className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300`}
      >
        Super Admin
      </span>
    );
  }

  return (
    <span
      className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}
    >
      Admin
    </span>
  );
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const supabase = getBrowserClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status, created_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Failed to load profile data.");
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.rpc(
        "get_user_last_sign_in",
        { user_id: user.id }
      );

      if (userError) {
        console.error("Error fetching last sign in:", userError);
      }

      setProfile({
        ...profileData,
        last_sign_in_at: userData || null,
      } as ProfileData);

      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  const handleSaveProfile = async (newName: string) => {
    setIsSaving(true);
    const result = await updateProfile(newName);
    setIsSaving(false);

    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, full_name: newName } : null));
      setIsEditModalOpen(false);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-xl dark:bg-slate-800">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
            Error Loading Profile
          </h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            {error || "Unable to load your profile data."}
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/admin/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profile
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow dark:bg-slate-800 p-6">
              {/* Profile Info */}
              <div className="flex flex-col items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white text-center">
                  {profile.full_name || "N/A"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {profile.email}
                </p>
                <div className="flex gap-2 mt-3">
                  <RoleBadge role={profile.role} />
                  <StatusBadge status={profile.status} />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Account Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <Activity className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Member since{" "}
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {profile.last_sign_in_at
                        ? `Active ${new Date(profile.last_sign_in_at).toLocaleDateString()}`
                        : "Never logged in"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 space-x-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow dark:bg-slate-800">
              {/* Personal Information Section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {profile.full_name || "N/A"}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Settings Section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Account Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Shield className="w-4 h-4 mr-2" />
                      Account Role
                    </label>
                    <RoleBadge role={profile.role} />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Activity className="w-4 h-4 mr-2" />
                      Account Status
                    </label>
                    <StatusBadge status={profile.status} />
                  </div>
                </div>
              </div>

              {/* Activity Section */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Activity Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Created */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Account Created
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {/* Last Login */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Last Login
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {profile.last_sign_in_at
                        ? new Date(profile.last_sign_in_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentName={profile.full_name || ""}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </>
  );
}
