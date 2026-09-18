"use client";

import { Mail, Phone, Building, Users, MessageCircle } from "lucide-react";

export type ContactInfo = {
  full_name: string;
  business_email: string;
  contact_number: string;
  company: string;
  company_size: string;
  message: string;
};

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-900/50">
      <div className="flex items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

const VALUE_CLASS = "font-semibold text-gray-800 dark:text-white";

/**
 * Contact info grid + message. Extracted from ContactDetailModal.
 */
export default function ContactInfoGrid({ contact }: { contact: ContactInfo }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoTile
          icon={<Users className="w-4 h-4 mr-2" />}
          label="Full Name"
        >
          <p className={VALUE_CLASS}>{contact.full_name}</p>
        </InfoTile>

        <InfoTile icon={<Mail className="w-4 h-4 mr-2" />} label="Email">
          <a
            href={`mailto:${contact.business_email}`}
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {contact.business_email}
          </a>
        </InfoTile>

        <InfoTile
          icon={<Phone className="w-4 h-4 mr-2" />}
          label="Contact Number"
        >
          <a
            href={`tel:${contact.contact_number}`}
            className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {contact.contact_number}
          </a>
        </InfoTile>

        <InfoTile
          icon={<Building className="w-4 h-4 mr-2" />}
          label="Company"
        >
          <p className={VALUE_CLASS}>{contact.company}</p>
        </InfoTile>

        <div className="col-span-1 md:col-span-2">
          <InfoTile
            icon={<Users className="w-4 h-4 mr-2" />}
            label="Company Size"
          >
            <p className={VALUE_CLASS}>{contact.company_size} employees</p>
          </InfoTile>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-900/50">
        <div className="flex items-center mb-3 text-sm text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-4 h-4 mr-2" />
          Message
        </div>
        <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
          {contact.message || "No message provided."}
        </p>
      </div>
    </>
  );
}
