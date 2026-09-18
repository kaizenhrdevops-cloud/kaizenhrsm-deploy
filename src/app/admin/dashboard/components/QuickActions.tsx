"use client";

import { PlusCircle, Mail, Send, UserCog, Settings } from "lucide-react";
import Button from "@/components/ui/Button";

export default function QuickActions({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Button variant="primary" href="/admin/blog">
        <PlusCircle size={18} />
        <span>New Post</span>
      </Button>

      {/* Only show extra actions on larger screens to save space */}
      <div className="hidden sm:flex gap-2">
        <Button href="/admin/contacts" title="View Inquiries" aria-label="View Inquiries">
          <Mail size={18} />
        </Button>

        {isSuperAdmin && (
          <>
            <Button href="/admin/newsletter" title="Newsletter Campaigns" aria-label="Newsletter Campaigns">
              <Send size={18} />
            </Button>
            <Button href="/admin/users" title="Manage Users" aria-label="Manage Users">
              <UserCog size={18} />
            </Button>
            <Button href="/admin/settings" title="System Settings" aria-label="System Settings">
              <Settings size={18} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
