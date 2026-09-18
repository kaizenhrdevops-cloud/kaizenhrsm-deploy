// src/app/admin/blog/posts-client.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/client";
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  CheckCheck,
  Edit3,
  Send,
} from "lucide-react";
import DataTable, { type Column } from "@/components/shared/DataTable";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import { createPost, deletePost } from "../posts/actions";
import ConfirmSendModal from "./ConfirmSendModal";

export type PostWithAuthor = {
  id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  status: string | null;
  published_at: string | null;
  author_id: string | null;
  newsletter_sent_at: string | null;
  excerpt: string | null;
  featured_image: string | null;
  author: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function PostsClient({ posts }: { posts: PostWithAuthor[] }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "myPosts">("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- 1. ADD STATE TO HOLD THE USER'S ROLE ---
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [postToSend, setPostToSend] = useState<PostWithAuthor | null>(null);

  const supabase = getBrowserClient();

  // --- 2. UPDATE THIS useEffect TO FETCH THE ROLE ---
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        // Also fetch the user's profile to get their role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentUserRole(profile?.role || null);
      }
    };
    getUser();
  }, [supabase, supabase.auth]); // Added supabase to dependency array

  // ... (handleCreatePost, handleOpenDeleteModal, handleOpenSendModal, handleDeleteConfirm... all stay the same) ...
  const handleCreatePost = async (category: "blog" | "development") => {
    setIsCreating(true);
    const result = await createPost(category);
    if (result.success && result.postId) {
      router.push(`/admin/editor/${result.postId}`);
    } else {
      toast.error(result.message || "Failed to create post.");
      setIsCreating(false);
    }
  };

  const handleOpenDeleteModal = (post: PostWithAuthor) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const handleOpenSendModal = (post: PostWithAuthor) => {
    setPostToSend(post);
    setIsSendModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    const result = await deletePost(postToDelete.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete post.");
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const finalFilteredPosts = useMemo(() => {
    const tabFiltered =
      activeTab === "all"
        ? posts
        : posts.filter((post) => post.author_id === currentUserId);

    return tabFiltered.filter((post) => {
      const statusMatch =
        statusFilter === "all" || post.status === statusFilter;
      const categoryMatch =
        categoryFilter === "all" || post.category === categoryFilter;
      return statusMatch && categoryMatch;
    });
  }, [posts, statusFilter, categoryFilter, activeTab, currentUserId]);

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter(
      (post) => post.status === "published"
    ).length;
    const drafts = posts.filter((post) => post.status === "draft").length;
    return { total, published, drafts };
  }, [posts]);

  const columns: Column<PostWithAuthor>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (post) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {post.title}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (post) => (
        <span className="capitalize">{post.category || "N/A"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (post) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            post.status === "published"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {post.status
            ? post.status.charAt(0).toUpperCase() + post.status.slice(1)
            : "N/A"}
        </span>
      ),
    },
    {
      key: "author",
      label: "Author",
      sortable: true,
      render: (post) => post.author?.full_name || post.author?.email || "N/A",
    },
    {
      key: "published_at",
      label: "Published Date",
      sortable: true,
      render: (post) =>
        post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-GB")
          : "Not Published",
    },
  ];

  const filterControls = (
    <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full sm:w-40 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
      >
        <option value="all">All Statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full sm:w-40 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
      >
        <option value="all">All Categories</option>
        <option value="blog">Blog</option>
        <option value="development">Development</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileText}
          title="Total Posts"
          value={stats.total}
          color="text-blue-400"
        />
        <StatCard
          icon={CheckCheck}
          title="Published"
          value={stats.published}
          color="text-green-400"
        />
        <StatCard
          icon={Edit3}
          title="Drafts"
          value={stats.drafts}
          color="text-yellow-400"
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message={`Are you sure you want to permanently delete "${
          postToDelete?.title || "this post"
        }"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {isSendModalOpen && (
        <ConfirmSendModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          post={postToSend}
          onSendComplete={() => {
            setIsSendModalOpen(false);
            router.refresh(); // This will re-fetch posts and update the "Send" button
          }}
        />
      )}

      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "border-b-2 border-blue-500 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setActiveTab("myPosts")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "myPosts"
              ? "border-b-2 border-blue-500 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          My Posts
        </button>
      </div>

      <DataTable
        data={finalFilteredPosts}
        columns={columns}
        searchable={true}
        searchKeys={["title", "category", "status"]}
        filterControls={filterControls}
        pagination={true}
        itemsPerPage={10}
        headerActions={
          <div className="flex gap-2">
            <button
              onClick={() => handleCreatePost("blog")}
              disabled={isCreating}
              className="inline-flex items-center justify-center px-4 py-2 space-x-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <PlusCircle size={20} />
              <span>New Blog Post</span>
            </button>
            <button
              onClick={() => handleCreatePost("development")}
              disabled={isCreating}
              className="inline-flex items-center justify-center px-4 py-2 space-x-2 text-sm font-semibold text-white transition-colors bg-purple-600 rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50"
            >
              <PlusCircle size={20} />
              <span>New Development Post</span>
            </button>
          </div>
        }
        actions={(post) => (
          // --- 3. WRAP THE "Send" BUTTON IN THE ROLE CHECK ---
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/editor/${post.id}`);
              }}
              className="p-2 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </button>

            {/* THIS IS THE NEW LOGIC */}
            {currentUserRole === "super_admin" &&
              post.status === "published" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenSendModal(post);
                  }}
                  disabled={!!post.newsletter_sent_at}
                  className="p-2 text-green-600 rounded hover:bg-green-50 dark:hover:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  title={
                    post.newsletter_sent_at
                      ? `Sent on ${new Date(
                          post.newsletter_sent_at
                        ).toLocaleDateString()}`
                      : "Send newsletter"
                  }
                >
                  <Send className="w-5 h-5" />
                </button>
              )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteModal(post);
              }}
              className="p-2 text-red-600 rounded hover:bg-red-50 dark:hover:bg-gray-700"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
        emptyMessage="No posts found. Create one to get started."
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 p-2 bg-gray-700 rounded-md ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-400">{title}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}
