import { supabase } from "@/lib/supabase";
import type { Ad } from "@/lib/types";

export const AD_PLACEMENTS = {
  home_top: "Home page · Below hero",
  home_mid: "Home page · Between sections",
  directory_top: "Find a place · Above results"
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

export async function getActiveAds(placement: AdPlacement): Promise<Ad[]> {
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("ads")
    .select("*")
    .eq("placement", placement)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("created_at", { ascending: false });

  return (data || []) as Ad[];
}
