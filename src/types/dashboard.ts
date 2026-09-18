// src/types/dashboard.ts

export type DashboardStat = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;   // e.g. "+12%"
  trendLabel?: string;   // <--- NEW FIELD: e.g. "vs last month"
  href: string;
  iconName: "FileText" | "Users" | "Mail" | "Activity" | "ShieldAlert" | "Server"; 
  color: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
};

export type ActivityItem = {
  id: string;
  type: "post" | "contact" | "campaign" | "audit_log";
  title: string;
  subtitle?: string;
  status: string;
  timestamp: string; // ISO string
  href: string;
};

export type SystemHealth = {
  emailQuota: {
    used: number;
    remaining: number;
    total: number;
  };
  auditLogRetention: number;
  maintenanceMode: boolean;
};

export type ContactQuickView = {
  id: string;
  full_name: string;
  company: string;
  status: string | null;
  created_at: string | null;
};

export type DashboardData = {
  stats: DashboardStat[];
  recentActivity: ActivityItem[];
  recentContacts: ContactQuickView[];
  systemHealth?: SystemHealth;
  userRole: "admin" | "super_admin";
  userName: string;
};