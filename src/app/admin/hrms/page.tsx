// src/app/admin/hrms/page.tsx
import { getHrmsModules } from "./actions";
import HrmsListClient from "./hrms-list-client";

export default async function HrmsManagementPage() {
  const { modules, message } = await getHrmsModules();

  if (message && message !== "ok") {
    return (
      <div className="p-4 text-red-500">Error fetching modules: {message}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          HRMS Modules
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Edit the content of the /hrms/* pages. Publishing is instant (pages
          revalidate hourly). Modules with a static page file still serve the
          static file — see docs/hrms-cms.md to switch.
        </p>
      </div>
      <HrmsListClient modules={modules} />
    </div>
  );
}
