"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  PlusCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Eye,
  Check,
  ListOrdered,
  Table as TableIcon,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DataTable, { type Column } from "@/components/shared/DataTable";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { createHrmsModule, deleteHrmsModule, reorderHrmsModules } from "./actions";

type ModuleRow = {
  slug: string;
  name: string;
  status: string;
  feature_count: number;
  updated_at: string | null;
  order_index?: number;
};

// Sortable individual row component
function SortableModuleRow({
  module,
  index,
  total,
  onMove,
  onMoveToExtremity,
  onEdit,
  onDelete,
  isPending,
  mounted,
}: {
  module: ModuleRow;
  index: number;
  total: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onMoveToExtremity: (fromIndex: number, toPosition: "first" | "last") => void;
  onEdit: (slug: string) => void;
  onDelete: (module: ModuleRow) => void;
  isPending: boolean;
  mounted: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const dragProps = mounted ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl border transition-all ${
        isDragging
          ? "border-blue-500 shadow-xl opacity-90 scale-[1.01] ring-2 ring-blue-500/20"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
      }`}
    >
      {/* Left: Drag Handle, Rank Badge, Title, Path */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          {...dragProps}
          type="button"
          aria-label={`Reorder ${module.name}`}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
          #{index + 1}
        </div>

        <div
          onClick={() => onEdit(module.slug)}
          className="min-w-0 cursor-pointer group"
        >
          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span className="truncate">{module.name}</span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
            /hrms/{module.slug}
          </div>
        </div>
      </div>

      {/* Center: Status & Sections count */}
      <div className="hidden sm:flex items-center gap-4 px-4">
        <StatusBadge status={module.status} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {module.feature_count} {module.feature_count === 1 ? "section" : "sections"}
        </span>
      </div>

      {/* Right: Quick Move Controls & Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Move to Top */}
        <button
          type="button"
          onClick={() => onMoveToExtremity(index, "first")}
          disabled={index === 0 || isPending}
          title="Move to first position (top)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
        >
          <ChevronsUp size={16} />
        </button>

        {/* Move Up 1 */}
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0 || isPending}
          title="Move up one position"
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
        >
          <ArrowUp size={16} />
        </button>

        {/* Move Down 1 */}
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1 || isPending}
          title="Move down one position"
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
        >
          <ArrowDown size={16} />
        </button>

        {/* Move to Bottom */}
        <button
          type="button"
          onClick={() => onMoveToExtremity(index, "last")}
          disabled={index === total - 1 || isPending}
          title="Move to last position (bottom)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
        >
          <ChevronsDown size={16} />
        </button>

        {/* Quick Position Select */}
        <select
          value={index + 1}
          disabled={isPending}
          onChange={(e) => onMove(index, Number(e.target.value) - 1)}
          aria-label={`Position of ${module.name}`}
          className="ml-1 text-xs py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Array.from({ length: total }).map((_, pos) => (
            <option key={pos + 1} value={pos + 1}>
              #{pos + 1}
            </option>
          ))}
        </select>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEdit(module.slug)}
          className="ml-2 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
        >
          Edit
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(module)}
          className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function HrmsListClient({ modules }: { modules: ModuleRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ModuleRow[]>(modules);
  const [viewMode, setViewMode] = useState<"order" | "table">("order");
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state if server props change (unless currently saving)
  useEffect(() => {
    if (!isSavingRef.current) {
      setItems(modules);
    }
  }, [modules]);

  // Setup DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Persist order to server
  const saveNewOrder = async (reordered: ModuleRow[]) => {
    isSavingRef.current = true;
    setSaveStatus("saving");
    const slugs = reordered.map((m) => m.slug);
    startTransition(async () => {
      try {
        const res = await reorderHrmsModules(slugs);
        if (res.success) {
          setSaveStatus("saved");
          toast.success("Module order updated! Public navbar synchronized.");
        } else {
          setSaveStatus("idle");
          toast.error(res.message || "Failed to update order.");
        }
      } catch {
        setSaveStatus("idle");
        toast.error("Failed to update order.");
      } finally {
        isSavingRef.current = false;
      }
    });
  };

  // DnD End handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.slug === active.id);
    const newIndex = items.findIndex((i) => i.slug === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      saveNewOrder(reordered);
    }
  };

  // Single step move handler
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const reordered = arrayMove(items, fromIndex, toIndex);
    setItems(reordered);
    saveNewOrder(reordered);
  };

  // Move to extremity (Top or Bottom)
  const handleMoveToExtremity = (fromIndex: number, toPosition: "first" | "last") => {
    const targetIndex = toPosition === "first" ? 0 : items.length - 1;
    if (fromIndex === targetIndex) return;
    const reordered = arrayMove(items, fromIndex, targetIndex);
    setItems(reordered);
    saveNewOrder(reordered);
  };

  // Create module
  const handleCreate = async () => {
    setIsCreating(true);
    const result = await createHrmsModule(newSlug, newName);
    if (result.success && result.slug) {
      toast.success("Module created.");
      router.push(`/admin/hrms/${result.slug}`);
      router.refresh();
    } else {
      toast.error(result.message || "Failed to create module.");
      setIsCreating(false);
    }
  };

  // Delete module
  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;
    setIsDeleting(true);
    const result = await deleteHrmsModule(moduleToDelete.slug);
    if (result.success) {
      toast.success("Module deleted.");
      setItems((prev) => prev.filter((m) => m.slug !== moduleToDelete.slug));
      router.refresh();
    } else {
      toast.error(result.message || "Failed to delete module.");
    }
    setIsDeleting(false);
    setModuleToDelete(null);
  };

  // Table columns for alternate view
  const columns: Column<ModuleRow>[] = [
    {
      key: "order_index",
      label: "#",
      sortable: true,
      render: (m) => (
        <span className="font-bold text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          #{typeof m.order_index === "number" ? m.order_index + 1 : 1}
        </span>
      ),
    },
    {
      key: "name",
      label: "Module",
      sortable: true,
      render: (m) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">
            {m.name}
          </div>
          <div className="text-xs text-slate-500">/hrms/{m.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "feature_count",
      label: "Sections",
      sortable: true,
      render: (m) => (
        <span className="text-slate-600 dark:text-slate-400">{m.feature_count}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Create New Module Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
          New module
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="slug e.g. payroll-management"
            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name"
            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
          />
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={isCreating || !newSlug.trim() || !newName.trim()}
            loading={isCreating}
          >
            <PlusCircle size={18} />
            Create draft
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          New slugs go live instantly. Drafts return 404 until published.
        </p>
      </div>

      {/* Control Bar: View Switcher, Save Status & Live Preview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("order")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "order"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <ListOrdered size={16} />
            Navbar Display Order ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <TableIcon size={16} />
            Table & Search
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Indicator */}
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Saving order...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check size={14} />
              Public navbar synchronized
            </span>
          )}

          {/* Preview Dropdown Button */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye size={15} className="text-blue-500" />
            Preview Mega Menu Layout
          </button>
        </div>
      </div>

      {/* Reorderable List View (Default) */}
      {viewMode === "order" ? (
        <div className="space-y-2">
          <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Drag items or use the arrows / position selector to change navbar order. Top items appear first in the dropdown.
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {items.length} modules total
            </span>
          </div>

          <DndContext
            id="hrms-module-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.slug)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((module, index) => (
                  <SortableModuleRow
                    key={module.slug}
                    module={module}
                    index={index}
                    total={items.length}
                    onMove={handleMove}
                    onMoveToExtremity={handleMoveToExtremity}
                    onEdit={(slug) => router.push(`/admin/hrms/${slug}`)}
                    onDelete={(m) => setModuleToDelete(m)}
                    isPending={isPending}
                    mounted={mounted}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        /* Alternate Table View */
        <DataTable
          data={items}
          columns={columns}
          searchable
          searchKeys={["name", "slug"]}
          pagination
          itemsPerPage={15}
          onRowClick={(m) => router.push(`/admin/hrms/${m.slug}`)}
          actions={(m) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModuleToDelete(m);
              }}
              className="font-medium text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 text-sm"
            >
              Delete
            </button>
          )}
          emptyMessage="No modules yet. Create one above."
        />
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-500" />
                  Public Navbar Mega Menu Preview (3 Columns)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This is how the modules flow across 3 columns in the desktop HRMS dropdown.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-semibold px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items
                  .filter((m) => m.status === "published")
                  .map((m, idx) => (
                    <div
                      key={m.slug}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          /hrms/{m.slug}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {items.filter((m) => m.status === "published").length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No published modules to display.
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500">
              <span>
                Draft modules are excluded from the public navbar until published.
              </span>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open public site <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!moduleToDelete}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete module"
        message={`Delete "${moduleToDelete?.name}" and all its sections? The public URL will 404 (or fall back to a static file if one exists). This cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
