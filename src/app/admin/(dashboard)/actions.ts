"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function checkIsAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const adminSupabase = await createAdminClient();
  const { data: adminUser } = await adminSupabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return !!adminUser;
}

export async function getDashboardStats() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  // Get total responses
  const { count: totalResponses } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true });

  // Get new responses
  const { count: newResponses } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  // Get reviewed responses
  const { count: reviewedResponses } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "reviewed");

  // Get today's responses
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayResponses } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Role breakdown (this requires fetching all or using a group by which is not easily supported in postgrest without rpc, so we fetch roles and count)
  // For small to medium scale, fetching just 'role' is fine.
  const { data: rolesData } = await supabase
    .from("submissions")
    .select("role");

  const roleCounts: Record<string, number> = {
    patient: 0,
    family: 0,
    doctor: 0,
    nurse: 0,
    staff: 0,
    other: 0,
  };

  if (rolesData) {
    rolesData.forEach((row) => {
      const r = row.role;
      if (roleCounts[r] !== undefined) {
        roleCounts[r]++;
      } else {
        roleCounts.other++;
      }
    });
  }

  return {
    totalResponses: totalResponses || 0,
    newResponses: newResponses || 0,
    reviewedResponses: reviewedResponses || 0,
    todayResponses: todayResponses || 0,
    roleCounts,
  };
}

export type Submission = {
  id: string;
  role: string;
  problem_text: string;
  improvement_text: string | null;
  source: string | null;
  status: string;
  created_at: string;
};

export async function getSubmissions({
  page = 1,
  limit = 20,
  role = "all",
  status = "all",
  date = "all",
  search = "",
}: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  date?: string;
  search?: string;
}) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  let query = supabase
    .from("submissions")
    .select("*", { count: "exact" });

  if (role && role !== "all") {
    query = query.eq("role", role);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (date && date !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date === "today") {
      query = query.gte("created_at", today.toISOString());
    } else if (date === "7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
    } else if (date === "30days") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte("created_at", thirtyDaysAgo.toISOString());
    }
  }

  if (search && search.trim() !== "") {
    query = query.or(`problem_text.ilike.%${search}%,improvement_text.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error(error);
    throw new Error("Failed to fetch submissions");
  }

  return {
    data: (data || []) as Submission[],
    count: count || 0,
  };
}

export async function updateSubmissionStatus(id: string, status: "new" | "reviewed") {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error("Failed to update status");
  }

  return { success: true };
}
