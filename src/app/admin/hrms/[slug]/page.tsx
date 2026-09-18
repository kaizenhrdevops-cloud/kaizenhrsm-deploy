// src/app/admin/hrms/[slug]/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getHrmsModule } from "../actions";
import HrmsEditor from "./hrms-editor";

export default async function HrmsEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { module, features, message } = await getHrmsModule(slug);

  if (!module) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/hrms"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} /> Back to modules
        </Link>
        <div className="p-4 text-red-500">Error: {message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/hrms"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} /> Back to modules
      </Link>
      <HrmsEditor initialModule={module} initialFeatures={features} />
    </div>
  );
}
