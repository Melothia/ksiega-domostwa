import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseUrl = "https://zhywdorfflurbkzwesiid.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeXdkb3JmbGx1cmJrd3plc2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTYzOTAsImV4cCI6MjA4NTA5MjM5MH0.-bCUjAYieHawvY0UJJr5ewoFkD-Ze96n1OXj_ImF93g";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Brak zmiennych środowiskowych Supabase", {
    supabaseUrl,
    supabaseAnonKey,
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
