import Link from "next/link";
import { BarChart2, Users, Activity, ClipboardList, ClipboardEdit } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex relative">
      <aside className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 z-50 pt-24 pb-6 flex flex-col">
        <div className="px-6 mb-8">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-cyan-400">
            Admin
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavLink href="/admin" icon={<BarChart2 size={17} />} label="Áttekintés" />
          <NavLink href="/admin/leads" icon={<Users size={17} />} label="Leadek" />

          <div className="pt-3 pb-1 px-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Kérdőív</p>
          </div>

          <NavLink href="/admin/surveys" icon={<ClipboardList size={17} />} label="Kitöltések" />
          <NavLink href="/admin/survey-editor" icon={<ClipboardEdit size={17} />} label="Kérdések" />

          <div className="pt-3 pb-1 px-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Analitika</p>
          </div>

          <NavLink href="/admin/visitors" icon={<Activity size={17} />} label="Látogatók" />
        </nav>
      </aside>

      <main className="flex-1 pl-64 min-w-0">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-foreground/60 hover:text-foreground transition-all text-sm font-medium"
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </Link>
  );
}
