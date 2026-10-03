"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase Auth Error:", error);
    if (error.name === "AuthRetryableFetchError" || error.message === "fetch failed") {
      return { error: "Network error: Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL." };
    }
    return { error: "Invalid credentials" };
  }

  if (!data.user) {
    return { error: "Invalid credentials" };
  }

  const adminSupabase = await createAdminClient();
  const { data: adminUser } = await adminSupabase
    .from("admin_users")
    .select("id")
    .eq("user_id", data.user.id)
    .single();

  if (!adminUser) {
    await supabase.auth.signOut();
    return { error: "Unauthorized admin account" };
  }

  // Session is now stored in cookies
  redirect("/admin");
}
