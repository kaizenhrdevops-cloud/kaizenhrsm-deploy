// src/app/newsletter/unsubscribe/page.tsx
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { getServiceClient } from "@/lib/supabase-admin";
import UnsubscribeConfirmForm from "./unsubscribe-confirm";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local?.charAt(0) || "*";
  return `${head}***@${domain}`;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    message?: string;
    id?: string;
    confirm?: string;
  }>;
}) {
  // ✅ You MUST await this in Next.js 15
  const { status, message, id, confirm } = await searchParams;

  // Confirm screen: validate the token server-side and show which address
  // is affected (masked) before anything is mutated.
  if (id && confirm && !status) {
    const supabase = getServiceClient();
    const { data: subscriber } = await supabase
      .from("newsletter_subscribers")
      .select("email, status")
      .eq("unsubscribe_token", id)
      .single();

    if (!subscriber) {
      return (
        <UnsubscribeShell
          success={false}
          message="The unsubscribe link is invalid or has expired."
        />
      );
    }
    if (subscriber.status === "unsubscribed") {
      return <UnsubscribeShell success message={null} />;
    }
    return (
      <UnsubscribeShell success={null}>
        <UnsubscribeConfirmForm
          token={id}
          maskedEmail={maskEmail(subscriber.email)}
        />
      </UnsubscribeShell>
    );
  }

  // Result screen (redirect target of the API routes).
  const isSuccess = status === "success";
  return (
    <UnsubscribeShell
      success={isSuccess}
      message={isSuccess ? null : message || undefined}
    />
  );
}

function UnsubscribeShell({
  success,
  message,
  children,
}: {
  // null = neutral (confirm screen content supplied via children)
  success: boolean | null;
  message?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
        {children ?? (
          <div className="text-center">
            {success ? (
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
            )}

            <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-100">
              {success ? "Successfully Unsubscribed" : "Something Went Wrong"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {success
                ? "You will no longer receive newsletters from us."
                : message || "The unsubscribe link is invalid or has expired."}
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
