import { supabase } from "./supabase";

export type Drop = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  tags: string[];
  created_by?: string;
};

export type FetchDropsParams = {
  nowIso?: string;
  upcomingLimit?: number;
  pastLimit?: number;
  // Future: switch to server-side geo query without touching UI code.
  mode?: "default" | "nearby";
  lat?: number;
  lng?: number;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export async function fetchDrops(params: FetchDropsParams = {}) {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const upcomingLimit = params.upcomingLimit ?? 50;
  const pastLimit = params.pastLimit ?? 30;

  const [upcomingRes, pastRes] = await Promise.all([
    supabase
      .from("drops")
      .select("*")
      .gte("end_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(upcomingLimit),
    supabase
      .from("drops")
      .select("*")
      .lt("end_time", nowIso)
      .order("start_time", { ascending: false })
      .limit(pastLimit),
  ]);

  if (upcomingRes.error) {
    return { error: upcomingRes.error, upcoming: [] as Drop[], past: [] as Drop[] };
  }
  if (pastRes.error) {
    return { error: pastRes.error, upcoming: [] as Drop[], past: [] as Drop[] };
  }

  let upcoming = (upcomingRes.data ?? []) as Drop[];
  const past = (pastRes.data ?? []) as Drop[];

  if (
    params.mode === "nearby" &&
    typeof params.lat === "number" &&
    typeof params.lng === "number"
  ) {
    upcoming = [...upcoming].sort((a, b) => {
      const distA = distanceMeters(params.lat!, params.lng!, a.latitude, a.longitude);
      const distB = distanceMeters(params.lat!, params.lng!, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  // Later: replace this entire function with a server-side geo query (RPC/view).
  return {
    error: null,
    upcoming,
    past,
  };
}
