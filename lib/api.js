// lib/api.js
// Centralized API calls - all Supabase queries in one place

import { supabase } from "./supabase";

// ============================================
// PLAYERS
// ============================================

export async function fetchPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("nick");

  if (error) throw error;
  return data ?? [];
}

export async function fetchPlayerTitle(playerId) {
  const { data, error } = await supabase
    .from("players")
    .select("active_title")
    .eq("id", playerId)
    .single();

  if (error) throw error;
  return data?.active_title ?? null;
}

export async function updatePlayerTitle(playerId, title) {
  const { error } = await supabase
    .from("players")
    .update({ active_title: title })
    .eq("id", playerId);

  if (error) throw error;
}

// ============================================
// MONTHLY PROGRESS
// ============================================

export async function fetchProgress(playerId) {
  // Pobierz globalny poziom z players
  const { data: playerData, error: playerError } = await supabase
    .from("players")
    .select("level, total_xp, xp_required")
    .eq("id", playerId)
    .single();

  if (playerError && playerError.code !== "PGRST116") throw playerError;

  // Pobierz miesięczny XP z monthly_progress
  const { data: monthlyData, error: monthlyError } = await supabase
    .from("monthly_progress")
    .select("xp")
    .eq("player_id", playerId)
    .single();

  if (monthlyError && monthlyError.code !== "PGRST116") throw monthlyError;

  return {
    level: playerData?.level ?? 1,
    xp: playerData?.total_xp ?? 0,
    xp_required: playerData?.xp_required ?? 100,
    monthly_xp: monthlyData?.xp ?? 0,
  };
}

export async function fetchRanking() {
  const { data, error } = await supabase
    .from("monthly_progress")
    .select("players(nick), xp")
    .order("xp", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    nick: r.players?.nick,
    xp: r.xp,
  }));
}

// ============================================
// MONTHLY WINNER
// ============================================

export async function fetchLastWinner() {
  const { data, error } = await supabase.rpc("last_month_winner");
  if (error) throw error;
  return data ?? "—";
}

export async function resetMonthIfNeeded() {
  const { data, error } = await supabase.rpc("reset_month_if_needed");
  if (error) console.warn("Reset month error:", error);
  return data;
}

// ============================================
// QUESTS
// ============================================

export async function fetchQuests() {
  const { data, error } = await supabase.rpc("get_quests_for_today");
  if (error) throw error;
  return {
    emergency: data?.emergency ?? [],
    active: data?.active ?? [],
    upcoming: data?.upcoming ?? [],
  };
}

export async function completeQuest(playerId, questId) {
  const { error } = await supabase.rpc("complete_quest", {
    p_player_id: playerId,
    p_quest_id: questId,
  });
  if (error) throw error;
}

export async function completeGroupQuest(player1Id, player2Id, questId) {
  const { error } = await supabase.rpc("complete_group_quest", {
    p_player_1: player1Id,
    p_player_2: player2Id,
    p_quest_id: questId,
  });
  if (error) throw error;
}

// ============================================
// ACHIEVEMENTS
// ============================================

export async function fetchAllAchievements() {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("title");

  if (error) throw error;
  return data ?? [];
}

export async function fetchPlayerAchievements(playerId) {
  const { data, error } = await supabase
    .from("player_achievements")
    .select("achievement_id")
    .eq("player_id", playerId);

  if (error) throw error;
  return new Set((data ?? []).map((pa) => pa.achievement_id));
}

// ============================================
// CHRONICLE
// ============================================

export async function fetchChronicle(limit = 100) {
  const { data, error } = await supabase
    .from("chronicle")
    .select("*, players!chronicle_player_id_fkey ( nick )")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ============================================
// RECEIPTS
// ============================================

export async function fetchReceipts() {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const { data, error } = await supabase
    .from("receipts")
    .select("id, amount, store, added_at, players ( nick )")
    .gte("added_at", startOfMonth)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchReceiptsSummary() {
  const { data, error } = await supabase.rpc("current_month_receipts_summary");
  if (error) throw error;
  return data ?? [];
}

export async function addReceipt(playerId, store, amount) {
  const { error } = await supabase.rpc("add_receipt", {
    p_player_id: playerId,
    p_store: store,
    p_amount: Number(amount),
  });
  if (error) throw error;
}
