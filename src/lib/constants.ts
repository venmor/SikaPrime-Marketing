import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Lightbulb,
  LibraryBig,
  Megaphone,
  Newspaper,
  Share2,
  type LucideIcon,
} from "lucide-react";

export const appName = "Sika Prime Marketing Agent";

export const navigationItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/trends", label: "Trends", icon: Newspaper },
  { href: "/content", label: "Content Lab", icon: FileText },
  { href: "/workflow", label: "Workflow", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/publishing", label: "Publishing", icon: Share2 },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/knowledge", label: "Knowledge Base", icon: Megaphone },
];

export const demoCredentials = [
  "admin@sikaprime.local / SikaPrime123!",
  "strategist@sikaprime.local / SikaPrime123!",
  "creator@sikaprime.local / SikaPrime123!",
  "reviewer@sikaprime.local / SikaPrime123!",
  "analyst@sikaprime.local / SikaPrime123!",
];
