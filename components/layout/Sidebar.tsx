"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  User as UserIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { User } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: User["role"][];
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Executive",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin"],
      },
      {
        label: "Departments",
        href: "/department",
        icon: Building2,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    title: "My Work",
    items: [
      {
        label: "Submit KPIs",
        href: "/submit",
        icon: ClipboardList,
        roles: ["admin", "manager", "employee"],
      },
      {
        label: "My Dashboard",
        href: "/me",
        icon: UserIcon,
        roles: ["admin", "manager", "employee"],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        label: "KPI Settings",
        href: "/admin/kpis",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-[200px] shrink-0 flex-col border-r border-border bg-bg-surface">
      <div className="border-b border-border px-4 py-5">
        <span className="text-base font-semibold text-text-primary">FlexiPulse</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navSections.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              <p className="label-text mb-2 px-2 text-text-muted">{section.title}</p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent/15 text-accent font-medium"
                          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
            {user.full_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{user.full_name}</p>
            <p className="label-text text-text-muted capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-text-muted hover:text-text-primary"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
