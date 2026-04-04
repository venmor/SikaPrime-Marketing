import {
  BarChart3,
  BookOpen,
  FileText,
  Lightbulb,
  LayoutDashboard,
  Megaphone,
  Share2,
  type LucideIcon,
} from "lucide-react";

export const appName = "Sika Prime Marketing Agent";

export type NavigationChild = {
  href: string;
  label: string;
  summary: string;
};

export type NavigationSection = {
  id: string;
  href: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  placement?: "primary" | "secondary";
  children?: NavigationChild[];
};

export const navigationSections: NavigationSection[] = [
  {
    id: "overview",
    href: "/dashboard",
    label: "Overview",
    summary: "See priorities, queue health, and what needs attention now.",
    icon: LayoutDashboard,
  },
  {
    id: "plan",
    href: "/recommendations",
    label: "Plan",
    summary: "Decide what to post next using recommendations, trends, and schedule context.",
    icon: Lightbulb,
    children: [
      {
        href: "/recommendations",
        label: "Plan",
        summary: "Choose the next content moves based on goals, trends, and results.",
      },
      {
        href: "/trends",
        label: "Trend watch",
        summary: "Review current signals before turning them into marketing content.",
      },
      {
        href: "/calendar",
        label: "Schedule",
        summary: "Plan a balanced posting rhythm across channels and campaigns.",
      },
    ],
  },
  {
    id: "create",
    href: "/content",
    label: "Create",
    summary: "Generate ideas and drafts for the next campaign.",
    icon: FileText,
    children: [
      {
        href: "/content",
        label: "Content lab",
        summary: "Generate ideas and text-first drafts for campaign work.",
      },
      {
        href: "/flyers",
        label: "Flyer studio",
        summary: "Upload branded references and generate flyer concepts with previews.",
      },
    ],
  },
  {
    id: "review",
    href: "/workflow",
    label: "Review",
    summary: "Approve, revise, and track content moving through the workflow.",
    icon: BookOpen,
  },
  {
    id: "publish",
    href: "/publishing",
    label: "Publish",
    summary: "Send approved content to channels and monitor delivery.",
    icon: Share2,
  },
  {
    id: "measure",
    href: "/analytics",
    label: "Measure",
    summary: "Understand what performed well and what should be reused.",
    icon: BarChart3,
    children: [
      {
        href: "/analytics",
        label: "Performance",
        summary: "See channel, timing, and theme performance.",
      },
      {
        href: "/library",
        label: "Published",
        summary: "Reuse successful posts and archive weaker ones.",
      },
    ],
  },
  {
    id: "brand",
    href: "/knowledge",
    label: "Brand",
    summary: "Maintain products, offers, audiences, and compliance rules.",
    icon: Megaphone,
    placement: "secondary",
    children: [
      {
        href: "/knowledge",
        label: "Knowledge",
        summary: "Maintain products, offers, audiences, and compliance rules.",
      },
      {
        href: "/access",
        label: "Access",
        summary: "Manage invites, password recovery, sessions, and user status.",
      },
      {
        href: "/integrations",
        label: "Integrations",
        summary: "Update AI, image, and social listening settings without editing code.",
      },
    ],
  },
];

type DynamicNavigationPage = {
  sectionId: string;
  label: string;
  summary: string;
  matches: (pathname: string) => boolean;
};

const dynamicNavigationPages: DynamicNavigationPage[] = [
  {
    sectionId: "create",
    label: "Content item",
    summary: "Review copy, workflow notes, and publishing history for one item.",
    matches: (pathname) => pathname.startsWith("/content/"),
  },
];

export function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavigationState(pathname: string) {
  const activeSection =
    navigationSections.find((section) => {
      if (section.children?.some((child) => child.href === pathname)) {
        return true;
      }

      return isPathActive(pathname, section.href);
    }) ?? navigationSections[0];

  const currentChild =
    activeSection.children?.find((child) => child.href === pathname) ?? null;

  const dynamicPage =
    currentChild
      ? null
      : dynamicNavigationPages.find(
          (page) => page.sectionId === activeSection.id && page.matches(pathname),
        ) ?? null;

  const currentPage = currentChild
    ? currentChild
    : dynamicPage
      ? {
          href: pathname,
          label: dynamicPage.label,
          summary: dynamicPage.summary,
        }
      : {
          href: activeSection.href,
          label: activeSection.label,
          summary: activeSection.summary,
        };

  const breadcrumbs = [
    { href: "/dashboard", label: "Overview" },
    ...(activeSection.id === "overview"
      ? []
      : [{ href: activeSection.href, label: activeSection.label }]),
    ...(currentPage.label !== activeSection.label
      ? [{ href: currentPage.href, label: currentPage.label }]
      : []),
  ];

  return {
    activeSection,
    currentPage,
    breadcrumbs,
    primarySections: navigationSections.filter(
      (section) => (section.placement ?? "primary") === "primary",
    ) as NavigationSection[],
    secondarySections: navigationSections.filter(
      (section) => section.placement === "secondary",
    ) as NavigationSection[],
    localNavigation: [...(activeSection.children ?? [])],
  };
}

export const demoCredentials = [
  "admin@sikaprime.local / SikaPrime123!",
  "strategist@sikaprime.local / SikaPrime123!",
  "creator@sikaprime.local / SikaPrime123!",
  "reviewer@sikaprime.local / SikaPrime123!",
  "analyst@sikaprime.local / SikaPrime123!",
];

export const trendSourcePage = "/trends";
export const planningPage = "/recommendations";
export const contentPage = "/content";
