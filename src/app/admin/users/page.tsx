"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { getBrowserClient } from "@/lib/client";
import { PlusCircle, Edit, Trash2, Users, Shield, UserX } from "lucide-react";
import CreateUserModal from "@/components/admin/CreateUserModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import UpdateUserModal from "@/components/admin/UpdateUserModal";
import DataTable, { type Column } from "@/components/shared/DataTable";
import RoleBadge from "@/components/ui/RoleBadge";
import Button from "@/components/ui/Button";
import { type UserProfile } from "@/types/user";
import { deleteUser } from "./actions";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const StatusBadge = ({ status }: { status: string | null }) => {
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

// Stats Card Component
const StatCard = ({ title, count, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {count}
      </h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [userToUpdate, setUserToUpdate] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = getBrowserClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_users_with_profiles");
    if (error) {
      setError(
        "Could not fetch user data. You may not have the required permissions."
      );
      console.error("Error fetching users:", error);
    } else {
      setUsers(data as UserProfile[]);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Failed to verify your permissions.");
        setLoading(false);
        return;
      }

      if (profile.role !== "super_admin") {
        setError(
          "Access Denied. Only super administrators can access this page."
        );
        setLoading(false);
        return;
      }

      setCurrentUserRole(profile.role);
      await fetchUsers();
    };

    initializePage();
  }, [fetchUsers, supabase.auth, supabase, router]);

  // Derived Stats
  const stats = useMemo(() => {
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalSuperAdmins = users.filter(
      (u) => u.role === "super_admin"
    ).length;
    const totalSuspended = users.filter(
      (u) => u.status === "suspended" || u.status === "inactive"
    ).length;

    return { totalAdmins, totalSuperAdmins, totalSuspended };
  }, [users]);

  const handleOpenUpdateModal = (user: UserProfile) => {
    setUserToUpdate(user);
    setIsUpdateModalOpen(true);
  };

  const handleOpenDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const result = await deleteUser(userToDelete.id);
    if (result.success) {
      toast.success("User deleted.");
      fetchUsers();
    } else {
      toast.error(`Failed to delete user: ${result.message}`);
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Define table columns
  const columns: Column<UserProfile>[] = [
    {
      key: "full_name",
      label: "Full Name",
      sortable: true,
      render: (user) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {user.full_name || "N/A"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: "created_by_name",
      label: "Created By",
      sortable: true,
      render: (user) => (
        <span className="text-slate-600 dark:text-slate-400">
          {user.created_by_name || "System"}
        </span>
      ),
    },
    {
      key: "last_sign_in_at",
      label: "Last Login",
      sortable: true,
      render: (user) => (
        <span className="text-slate-600 dark:text-slate-400">
          {user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleString()
            : "Never"}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-xl dark:bg-slate-800">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
            Access Denied
          </h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{error}</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          User Management
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage admin and super admin users for the platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Super Admins"
          count={stats.totalSuperAdmins}
          icon={Shield}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
        />
        <StatCard
          title="Total Admins"
          count={stats.totalAdmins}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          title="Suspended / Inactive"
          count={stats.totalSuspended}
          icon={UserX}
          colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"
        />
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={fetchUsers}
      />

      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUserUpdated={fetchUsers}
        userToUpdate={userToUpdate}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${
          userToDelete?.full_name || userToDelete?.email
        }? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      <DataTable
        data={users}
        columns={columns}
        searchable={true}
        searchKeys={["full_name", "email", "role", "status"]}
        pagination={true}
        itemsPerPage={10}
        headerActions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={20} />
            <span>Create New User</span>
          </Button>
        }
        actions={(user) => (
          <>
            <button
              onClick={() => handleOpenUpdateModal(user)}
              className="font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
              aria-label={`Edit ${user.full_name}`}
            >
              <Edit className="w-5 h-5" />
            </button>
            {user.id !== currentUserId && (
              <button
                onClick={() => handleOpenDeleteModal(user)}
                className="font-medium text-red-600 transition-colors hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                aria-label={`Delete ${user.full_name}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </>
        )}
        emptyMessage="No users found"
      />
    </div>
  );
}
