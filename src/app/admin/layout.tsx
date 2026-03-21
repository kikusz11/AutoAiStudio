import Link from "next/link";
import { Users, Activity } from "lucide-react";

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
            Műszerfal
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all"
          >
            <Users size={18} />
            <span className="font-medium text-sm">Leadek</span>
          </Link>
          <Link
            href="/admin/visitors"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all"
          >
            <Activity size={18} />
            <span className="font-medium text-sm">Látogatók</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 pl-64 min-w-0">
        {children}
      </main>
    </div>
  );
}
