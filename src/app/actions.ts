"use server";

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Initialize Supabase client strictly on the server
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

interface SubmitData {
  role: string;
  message: string;
  solution?: string;
  turnstileToken: string;
}

export async function submitExperience(data: SubmitData) {
  try {
    const { role, message, solution, turnstileToken } = data;

    // 1. Basic validation
    if (!role || !message || !turnstileToken) {
      return { success: false, error: "Missing required fields." };
    }

    if (message.length > 5000) {
      return { success: false, error: "Message is too long." };
    }

    // 2. Turnstile Verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const formData = new FormData();
      formData.append("secret", turnstileSecret);
      formData.append("response", turnstileToken);

      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return { success: false, error: "Security check failed. Please try again." };
      }
    }

    // 3. Supabase Insertion
    // Validate role against allowed list to prevent garbage data
    const validRoles = ["patient", "family", "doctor", "nurse", "staff", "other"];
    const finalRole = validRoles.includes(role) ? role : "other";

    const { error: dbError } = await supabase.from("submissions").insert({
      id: randomUUID(),
      role: finalRole,
      problem_text: message,
      improvement_text: solution || null,
      source: "web_anonymous_discovery",
      consent_version: "v1",
      // created_at handled by Postgres defaults
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return { success: false, error: "Database error. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Submission error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
