import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Check if user is in admin_users table
  const adminSupabase = await createAdminClient();
  const { data: adminUser, error } = await adminSupabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error || !adminUser) {
    // Authenticated but not an admin. Sign them out and redirect.
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] font-sans selection:bg-[#333] selection:text-white flex flex-col md:flex-row">
      {/* Mobile Nav Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0B0B0B]">
        <span className="text-xs font-semibold tracking-widest text-[#A1A1AA] uppercase">Project Health</span>
        {/* Mobile menu toggle could go here if we want to expand */}
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside className="hidden md:flex w-64 border-r border-[rgba(255,255,255,0.08)] bg-[#0B0B0B] flex-col justify-between">
        <div className="p-6">
          <div className="mb-12">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#A1A1AA] uppercase">Project Health</h2>
            <p className="text-[10px] text-[#71717A] mt-1 tracking-wider uppercase">Private Workspace</p>
          </div>
          
          <nav className="space-y-1">
            <a href="/admin" className="block px-3 py-2 text-sm font-medium bg-[#171717] rounded-md text-white border border-[rgba(255,255,255,0.04)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]">Overview</a>
            {/* Additional nav links can be added here */}
          </nav>
        </div>

        <div className="p-6 border-t border-[rgba(255,255,255,0.08)]">
          <div className="text-xs text-[#71717A] mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-[#A1A1AA] hover:text-white transition-colors w-full text-left">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[rgba(255,255,255,0.08)] bg-[#050505] flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-medium">Overview</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#171717] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-xs text-[#A1A1AA]">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
