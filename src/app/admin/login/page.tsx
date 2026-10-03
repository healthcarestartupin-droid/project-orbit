"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const res = await login(formData);
      return res;
    },
    null
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-sm font-bold tracking-[0.2em] text-[#A1A1AA] uppercase mb-1">Project Health</h1>
          <h2 className="text-xl font-medium">Admin Workspace</h2>
        </div>
        
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#A1A1AA] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#A1A1AA] transition-colors"
            />
          </div>

          {state?.error && (
            <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-md">
              {state.error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-white text-black hover:bg-[#EAE8E1] transition-colors font-medium text-sm py-2 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? "Signing in..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
