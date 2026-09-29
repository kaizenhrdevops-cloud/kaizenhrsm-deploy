import {
  Users,
  Calculator,
  Calendar,
  Plane,
  FileText,
  Clock,
  UserPlus,
  DollarSign,
  Percent,
  Shield,
  TrendingUp,
  Briefcase,
  BarChart3,
  BookOpen,
  User,
  Smartphone,
  PieChart,
  Code,
  Building2,
  Newspaper,
  CheckSquare,
  Phone,
  BookDown, // <-- CHANGED ICON
} from "lucide-react";

// HRMS menu (No changes)
export const hrmsSubmenus = [
  // ... (all 20 modules remain the same)
  {
    icon: Users,
    name: "Personnel Hub",
    description: "Keeping every employee record accessible and organized",
    path: "/hrms/personnel-hub",
  },
  {
    icon: Calculator,
    name: "Payroll Management",
    description: "Streamlined payroll workflows ensuring timely payments",
    path: "/hrms/payroll-management",
  },
  {
    icon: Calendar,
    name: "Leave Management",
    description: "Centralized leave records with policy compliance",
    path: "/hrms/leave-management",
  },
  {
    icon: Plane,
    name: "Leave Passage",
    description: "Rewarding employees with paid vacation entitlements",
    path: "/hrms/leave-passage",
  },
  {
    icon: FileText,
    name: "Claims Management",
    description: "Streamlining expense claim processing with approvals",
    path: "/hrms/claims-management",
  },
  {
    icon: Clock,
    name: "Time & Attendance",
    description: "Real-time attendance with clock-in/out integration",
    path: "/hrms/time-attendance",
  },
  {
    icon: UserPlus,
    name: "Recruitment",
    description: "Managing budget, recruitment cost with analytics",
    path: "/hrms/recruitment",
  },
  {
    icon: DollarSign,
    name: "Loan Management",
    description: "Employee loan benefits, enhancing financial wellbeing",
    path: "/hrms/loan-management",
  },
  {
    icon: Percent,
    name: "Loan Interest Subsidy",
    description: "Managing employer-subsidized loan interest benefits",
    path: "/hrms/loan-interest-subsidy",
  },
  {
    icon: Shield,
    name: "GIS & GHS",
    description: "Managing Group Insurance & Hospitalization benefits",
    path: "/hrms/gis-ghs",
  },
  {
    icon: TrendingUp,
    name: "ESOS Management",
    description: "Streamlined stock option grants and vesting management",
    path: "/hrms/esos-management",
  },
  {
    icon: Briefcase,
    name: "ESPP Management",
    description: "Facilitating participation in foreign listed company shares",
    path: "/hrms/espp-management",
  },
  {
    icon: BookOpen,
    name: "Training Management",
    description: "Comprehensive training administration with analytics",
    path: "/hrms/training-management",
  },
  {
    icon: BarChart3,
    name: "Competency Management",
    description: "Track employee skills, competencies and Gap assessment",
    path: "/hrms/competency-management",
  },
  {
    icon: FileText,
    name: "Training Needs Analysis",
    description: "Identify and align training requirements based on skill gaps",
    path: "/hrms/training-needs-analysis",
  },
  {
    icon: TrendingUp,
    name: "Performance Management",
    description: "Aligning goals and performance with organizational strategy",
    path: "/hrms/performance-management",
  },
  {
    icon: User,
    name: "Employee Self Service",
    description: "Reduce HR workload with employee self-service features",
    path: "/hrms/employee-self-service",
  },
  {
    icon: Smartphone,
    name: "Mobile App",
    description: "Access HR services anytime, anywhere conveniently",
    path: "/hrms/mobile-app",
  },
  {
    icon: PieChart,
    name: "BI Dashboard Analytics",
    description: "Transform HR data into actionable business intelligence",
    path: "/hrms/bi-dashboard-analytics",
  },
  {
    icon: Code,
    name: "Module Configurator",
    description: "Build Your Own HR Modules Instantly",
    path: "/hrms/module-configurator",
  },
];

// Resources menu (MODIFIED)
export const resourcesSubmenus = [
  {
    icon: BookDown, // <-- 1. UPDATED ICON
    name: "Brochure",
    description: "Download our official product brochure.",
    path: "/kaizen-hrms-modules-brochure.pdf", // <-- 2. UPDATED PATH (points to public folder)
  },
  {
    icon: CheckSquare,
    name: "HR Checklist",
    description: "Comprehensive HR modules checklist made simple",
    path: "/resources/hr-checklist",
  },
];

// Company menu (MODIFIED - no change from last time)
export const companySubmenus = [
  {
    icon: Building2,
    name: "About Us",
    description: "Award-winning HR solution, 28 years in the market",
    path: "/company/about-us",
  },
  {
    icon: Phone,
    name: "Contact Us",
    description: "Let's get in touch. No commitments. You have nothing to lose",
    path: "/company/contact-us",
  },
];