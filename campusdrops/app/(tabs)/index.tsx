import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Button, FlatList, Pressable, Text, View } from "react-native";
import { AuthGate } from "../../components/AuthGate";
import { supabase } from "../../lib/supabase";
import { fetchDrops, Drop, distanceMeters } from "../../lib/drops";
import * as Location from "expo-location";
import { router } from "expo-router";


export default function Home() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [pastDrops, setPastDrops] = useState<Drop[]>([]);
  const [status, setStatus] = useState<string>("");
  const [savedDropIds, setSavedDropIds] = useState<Set<string>>(new Set());
  const [checkedInDropIds, setCheckedInDropIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [sortMode, setSortMode] = useState<"upcoming" | "nearby">("upcoming");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function loadSaved() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from("saves")
      .select("drop_id")
      .eq("user_id", userId);

    if (!error) {
      setSavedDropIds(new Set((data ?? []).map((r: any) => r.drop_id)));
    }
  }

  async function loadCheckins() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from("checkins")
      .select("drop_id")
      .eq("user_id", userId);

    if (!error) {
      setCheckedInDropIds(new Set((data ?? []).map((r: any) => r.drop_id)));
    }
  }


  async function loadDrops() {
    setStatus("Loading...");
    const { error, upcoming, past } = await fetchDrops({
      mode: sortMode === "nearby" ? "nearby" : "default",
      lat: coords?.lat,
      lng: coords?.lng,
    });
    if (error) {
      setStatus("Load error: " + error.message);
      return;
    }

    setDrops(upcoming);
    setPastDrops(past);
    await Promise.all([loadSaved(), loadCheckins()]);
    setStatus("");
  }

  useFocusEffect(
    useCallback(() => {
      loadDrops();
    }, [])
  );

  useEffect(() => {
    loadDrops();
  }, [sortMode, coords]);

  async function toggleSave(dropId: string) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setStatus("Auth error: not signed in");
      return;
    }
  
    const userId = sessionData.session.user.id;
    const isSaved = savedDropIds.has(dropId);
  
    if (!isSaved) {
      const { error } = await supabase.from("saves").insert({ user_id: userId, drop_id: dropId });
      if (error) {
        setStatus("Save error: " + error.message);
        return;
      }
      setSavedDropIds(new Set([...savedDropIds, dropId]));
    } else {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("user_id", userId)
        .eq("drop_id", dropId);
  
      if (error) {
        setStatus("Unsave error: " + error.message);
        return;
      }
  
      const next = new Set(savedDropIds);
      next.delete(dropId);
      setSavedDropIds(next);
    }
  }

  async function toggleCheckin(dropId: string) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setStatus("Auth error: not signed in");
      return;
    }

    const userId = sessionData.session.user.id;
    const isCheckedIn = checkedInDropIds.has(dropId);

    if (!isCheckedIn) {
      const { error } = await supabase
        .from("checkins")
        .insert({ user_id: userId, drop_id: dropId });
      if (error) {
        setStatus("Check-in error: " + error.message);
        return;
      }
      setCheckedInDropIds(new Set([...checkedInDropIds, dropId]));
    } else {
      const { error } = await supabase
        .from("checkins")
        .delete()
        .eq("user_id", userId)
        .eq("drop_id", dropId);

      if (error) {
        setStatus("Undo check-in error: " + error.message);
        return;
      }

      const next = new Set(checkedInDropIds);
      next.delete(dropId);
      setCheckedInDropIds(next);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDrops();
    setRefreshing(false);
  }

  async function setNearbyMode() {
    setStatus("Requesting location...");
    const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus !== "granted") {
      setStatus("Location permission denied.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    setSortMode("nearby");
    setStatus("");
  }

  function setUpcomingMode() {
    setSortMode("upcoming");
  }

  function formatTimeRange(startIso: string, endIso: string) {
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const formatTime = (iso: string) =>
      new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${formatDate(startIso)} · ${formatTime(startIso)} → ${formatTime(endIso)}`;
  }

  function formatDistanceMiles(meters: number) {
    const miles = meters / 1609.34;
    if (miles < 0.1) return "<0.1 mi";
    return `${miles.toFixed(1)} mi`;
  }
  

  return (
    <AuthGate>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>
          {sortMode === "nearby" ? "Near me" : "Upcoming"}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={setUpcomingMode}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderRadius: 999,
              backgroundColor: sortMode === "upcoming" ? "#0a7ea4" : "transparent",
            }}>
            <Text style={{ color: sortMode === "upcoming" ? "#fff" : "#0a7ea4" }}>
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            onPress={setNearbyMode}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderRadius: 999,
              backgroundColor: sortMode === "nearby" ? "#0a7ea4" : "transparent",
            }}>
            <Text style={{ color: sortMode === "nearby" ? "#fff" : "#0a7ea4" }}>Near me</Text>
          </Pressable>
        </View>
        {sortMode === "nearby" && coords ? (
          <Text style={{ opacity: 0.7 }}>Sorted by distance from you</Text>
        ) : null}
        {!!status && <Text>{status}</Text>}

        <FlatList
          data={[
            ...drops,
            { id: "__past__" },
            ...(showAllPast ? pastDrops : pastDrops.slice(0, 5)),
            ...(pastDrops.length > 5 ? [{ id: "__past_more__" }] : []),
          ]}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => {
            if (item.id === "__past__") {
              return (
                <Text style={{ fontSize: 24, fontWeight: "700", marginTop: 8 }}>
                  Past events
                </Text>
              );
            }
            if (item.id === "__past_more__") {
              return (
                <Pressable onPress={() => setShowAllPast((prev) => !prev)}>
                  <Text style={{ color: "#0a7ea4", fontWeight: "600" }}>
                    {showAllPast ? "Show less" : "Show more"}
                  </Text>
                </Pressable>
              );
            }

            const drop = item as Drop;
            const isPast = new Date(drop.end_time).getTime() < Date.now();
            const isCheckedIn = checkedInDropIds.has(drop.id);
            const showDistance =
              sortMode === "nearby" &&
              coords &&
              typeof drop.latitude === "number" &&
              typeof drop.longitude === "number";
            const distanceLabel = showDistance
              ? formatDistanceMiles(
                  distanceMeters(coords.lat, coords.lng, drop.latitude, drop.longitude)
                )
              : null;
            return (
              <Pressable
                onPress={() => router.push(`/drop/${drop.id}`)}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderRadius: 12,
                  opacity: isPast ? 0.6 : 1,
                }}>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>{drop.title}</Text>
                {!!drop.location_name && <Text>{drop.location_name}</Text>}
                <Text style={{ opacity: 0.7 }}>
                  {formatTimeRange(drop.start_time, drop.end_time)}
                </Text>
                {distanceLabel ? (
                  <Text style={{ opacity: 0.7, marginTop: 4 }}>{distanceLabel} away</Text>
                ) : null}
                {isPast && isCheckedIn ? (
                  <Text style={{ marginTop: 6, color: "#0a7ea4", fontWeight: "600" }}>
                    You checked in
                  </Text>
                ) : null}
                {!!drop.description && <Text style={{ marginTop: 6 }}>{drop.description}</Text>}
                {drop.tags?.length ? (
                  <Text style={{ marginTop: 6, opacity: 0.7 }}>
                    Tags: {drop.tags.join(", ")}
                  </Text>
                ) : null}
                <View style={{ marginTop: 10, gap: 8 }}>
                  <Button
                    title={savedDropIds.has(drop.id) ? "Saved ✓" : "Save"}
                    onPress={() => toggleSave(drop.id)}
                    disabled={isPast}
                  />
                  <Button
                    title={checkedInDropIds.has(drop.id) ? "Checked in ✓" : "Check in"}
                    onPress={() => toggleCheckin(drop.id)}
                    disabled={isPast}
                  />
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ opacity: 0.7, marginTop: 12 }}>
              No upcoming drops yet.
            </Text>
          }
        />
      </View>
    </AuthGate>
  );
}
