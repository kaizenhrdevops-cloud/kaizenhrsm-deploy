"use client";

import { useEffect, useState, useMemo } from "react";
import { getBrowserClient } from "@/lib/client";
import DataTable, { type Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Building2,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  ChevronDown,
  Eye,
  Trash2,
} from "lucide-react";
import ContactDetailModal from "@/components/admin/ContactDetailModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// --- Types ---
type ContactSubmission = {
  id: string;
  full_name: string;
  business_email: string;
  contact_number: string;
  company: string;
  company_size: string;
  message: string;
  status: "new" | "contacted" | "replied" | "closed";
  created_at: string;
  reply_note?: string;
  replied_at?: string;
  replied_by?: string;
};

// --- Helper Components ---

const StatCard = ({ title, count, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg flex-shrink-0 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {count}
      </h3>
    </div>
  </div>
);

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] =
    useState<ContactSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "super_admin" | null>(
    null
  );

  // -- Delete Modal State --
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] =
    useState<ContactSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  const supabase = getBrowserClient();

  useEffect(() => {
    fetchContacts();
    fetchUserRole();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.error(message);
  };

  const fetchUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = profile?.role;
      setUserRole(role === "admin" || role === "super_admin" ? role : null);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/contacts");
      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts || []);
      } else {
        console.error("Failed to fetch contacts:", data.error);
        showToast("Failed to load contacts", "error");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (contact: ContactSubmission) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/contacts?id=${contactToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("Contact deleted successfully", "success");
        fetchContacts();
      } else {
        showToast(data.error || "Failed to delete contact", "error");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      showToast("An error occurred while deleting", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    }
  };

  const uniqueSizes = useMemo(() => {
    const sizes = new Set(contacts.map((c) => c.company_size).filter(Boolean));
    return Array.from(sizes).sort();
  }, [contacts]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const newCount = contacts.filter((c) => c.status === "new").length;
    const contacted = contacts.filter((c) => c.status === "contacted").length;
    const replied = contacts.filter((c) => c.status === "replied").length;

    return { total, newCount, contacted, replied };
  }, [contacts]);

  const filteredData = useMemo(() => {
    return contacts.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchSize =
        sizeFilter === "all" || item.company_size === sizeFilter;
      return matchStatus && matchSize;
    });
  }, [contacts, statusFilter, sizeFilter]);

  const handleExport = () => {
    if (contacts.length === 0) return showToast("No data to export", "error");

    const csvContent = [
      ["Date", "Name", "Email", "Company", "Size", "Status", "Message"],
      ...filteredData.map((c) => [
        new Date(c.created_at).toLocaleDateString(),
        `"${c.full_name}"`,
        c.business_email,
        `"${c.company}"`,
        `"${c.company_size}"`,
        c.status,
        `"${c.message?.replace(/"/g, '""') || ""}"`,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const columns: Column<ContactSubmission>[] = [
    {
      key: "full_name",
      label: "Contact Person",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">
            {row.full_name}
          </span>
          <span className="text-xs text-slate-500">{row.business_email}</span>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-slate-400" />
          <span>{row.company}</span>
        </div>
      ),
    },
    {
      key: "company_size",
      label: "Size",
      sortable: true,
      render: (row) => (
        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
          {row.company_size}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const actions = (contact: ContactSubmission) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedContact(contact);
          setIsDetailOpen(true);
        }}
        className="p-2 text-blue-600 transition-colors rounded hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        title="View details"
      >
        <Eye size={18} />
      </button>
      {userRole === "super_admin" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDeleteModal(contact);
          }}
          className="p-2 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Delete contact"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );

  const filterControls = (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <div className="relative">
        <Filter
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={16}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40 pl-9 pr-10 py-2 text-sm border rounded-lg appearance-none bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="relative">
        <Building2
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={16}
        />
        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          className="w-full sm:w-48 pl-9 pr-10 py-2 text-sm border rounded-lg appearance-none bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        >
          <option value="all">All Sizes</option>
          {uniqueSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Contact Submissions
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage and track incoming inquiries from the website.
        </p>
      </div>

      {/* Info Cards */}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inquiries"
          count={stats.total}
          icon={Inbox}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          title="New / Unread"
          count={stats.newCount}
          icon={Clock}
          colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"
        />
        <StatCard
          title="Contacted"
          count={stats.contacted}
          icon={MessageSquare}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          title="Replied"
          count={stats.replied}
          icon={CheckCircle2}
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
        />
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        searchable={true}
        searchKeys={["full_name", "business_email", "company"]}
        pagination={true}
        itemsPerPage={10}
        actions={actions}
        filterControls={filterControls}
        headerActions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: "#00A63D" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#008e33")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#00A63D")
            }
          >
            <Download size={16} />
            Export CSV
          </button>
        }
        emptyMessage="No contact submissions found."
      />

      <ContactDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        contact={selectedContact as any}
        userRole={userRole}
        onStatusChange={(id, status) => {
          setContacts(
            contacts.map((c) =>
              c.id === id ? { ...c, status: status as any } : c
            )
          );
          fetchContacts();
        }}
        onRefresh={fetchContacts}
      />

      {/* --- NEW: Delete Confirmation Modal --- */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete the inquiry from ${contactToDelete?.full_name}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
