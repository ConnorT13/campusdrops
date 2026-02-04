import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { AuthGate } from "../../components/AuthGate";
import { supabase } from "../../lib/supabase";

type Drop = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  tags: string[];
  created_by: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

export default function DropDetails() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [drop, setDrop] = useState<Drop | null>(null);
  const [status, setStatus] = useState("");
  const [saveCount, setSaveCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");

  useEffect(() => {
    async function loadDrop() {
      if (!id) return;
      setStatus("Loading...");
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user?.id ?? null;
      setUserId(currentUserId);

      const [
        { data, error },
        savesRes,
        checkinsRes,
        userSaveRes,
        userCheckinRes,
      ] =
        await Promise.all([
          supabase.from("drops").select("*").eq("id", id).single(),
          supabase.from("saves").select("id", { count: "exact", head: true }).eq("drop_id", id),
          supabase.from("checkins").select("id", { count: "exact", head: true }).eq("drop_id", id),
          currentUserId
            ? supabase
                .from("saves")
                .select("id")
                .eq("drop_id", id)
                .eq("user_id", currentUserId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          currentUserId
            ? supabase
                .from("checkins")
                .select("id")
                .eq("drop_id", id)
                .eq("user_id", currentUserId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      if (error) {
        setStatus("Load error: " + error.message);
        return;
      }
      setDrop(data as Drop);
      if (data?.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, username")
          .eq("id", data.created_by)
          .maybeSingle();

        const profileData = profile as Profile | null;
        const fallback = data.created_by.slice(0, 8);
        setCreatorName(profileData?.display_name || profileData?.username || fallback);
      } else {
        setCreatorName("");
      }
      setSaveCount(savesRes.count ?? 0);
      setCheckinCount(checkinsRes.count ?? 0);
      setIsSaved(Boolean((userSaveRes as any)?.data));
      setIsCheckedIn(Boolean((userCheckinRes as any)?.data));
      setStatus("");
    }

    loadDrop();
  }, [id]);

  function formatTimeRange(startIso: string, endIso: string) {
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const formatTime = (iso: string) =>
      new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${formatDate(startIso)} · ${formatTime(startIso)} → ${formatTime(endIso)}`;
  }

  async function toggleSave() {
    if (!drop) return;
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }

    if (!isSaved) {
      const { error } = await supabase.from("saves").insert({ user_id: userId, drop_id: drop.id });
      if (error) {
        setStatus("Save error: " + error.message);
        return;
      }
      setIsSaved(true);
      setSaveCount((c) => c + 1);
    } else {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("user_id", userId)
        .eq("drop_id", drop.id);
      if (error) {
        setStatus("Unsave error: " + error.message);
        return;
      }
      setIsSaved(false);
      setSaveCount((c) => Math.max(0, c - 1));
    }
  }

  async function toggleCheckin() {
    if (!drop) return;
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }

    if (!isCheckedIn) {
      const { error } = await supabase
        .from("checkins")
        .insert({ user_id: userId, drop_id: drop.id });
      if (error) {
        setStatus("Check-in error: " + error.message);
        return;
      }
      setIsCheckedIn(true);
      setCheckinCount((c) => c + 1);
    } else {
      const { error } = await supabase
        .from("checkins")
        .delete()
        .eq("user_id", userId)
        .eq("drop_id", drop.id);
      if (error) {
        setStatus("Undo check-in error: " + error.message);
        return;
      }
      setIsCheckedIn(false);
      setCheckinCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <AuthGate>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {!!status && <Text>{status}</Text>}
        {!status && !drop && <Text>Drop not found.</Text>}
        {drop ? (
          <View style={{ padding: 16, borderWidth: 1, borderRadius: 12, gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: "700" }}>{drop.title}</Text>
            {!!drop.location_name && <Text>{drop.location_name}</Text>}
            <Text style={{ opacity: 0.7 }}>{formatTimeRange(drop.start_time, drop.end_time)}</Text>
            {!!creatorName && <Text style={{ opacity: 0.7 }}>Created by: {creatorName}</Text>}
            <Text style={{ opacity: 0.7 }}>
              {saveCount} saves · {checkinCount} check-ins
            </Text>
            {!!drop.description && <Text style={{ marginTop: 6 }}>{drop.description}</Text>}
            {drop.tags?.length ? (
              <Text style={{ marginTop: 6, opacity: 0.7 }}>Tags: {drop.tags.join(", ")}</Text>
            ) : null}
            <View style={{ marginTop: 8, gap: 8 }}>
              <Button title={isSaved ? "Saved ✓" : "Save"} onPress={toggleSave} />
              <Button title={isCheckedIn ? "Checked in ✓" : "Check in"} onPress={toggleCheckin} />
            </View>
          </View>
        ) : null}
      </View>
    </AuthGate>
  );
}
