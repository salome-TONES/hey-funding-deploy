import { supabase } from "./supabaseClient";

export function track(event_name: string, metadata?: Record<string, unknown>) {
  supabase.from("analytics_events").insert({ event_name, metadata }).then();
}
