import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Button, RefreshControl, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AuthGate } from "../../components/AuthGate";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCampusTheme } from "@/components/CampusThemeProvider";

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
};

type SaveRow = {
  drop_id: string;
  drops: Drop | null;
};

type CheckinRow = {
  drop_id: string;
  drops: Drop | null;
};

type DropGroup = {
  label: string;
  items: Drop[];
};

export default function Me() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const { theme } = useCampusTheme();
  const backgroundStyle =
    { backgroundColor: colorScheme === "dark" ? theme.bgDark : theme.bg };
  const [savedDrops, setSavedDrops] = useState<Drop[]>([]);
  const [checkedInDrops, setCheckedInDrops] = useState<Drop[]>([]);
  const [myDrops, setMyDrops] = useState<Drop[]>([]);
  const [status, setStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  async function loadLists() {
    setStatus("Loading...");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setStatus("Auth error: not signed in");
      return;
    }

    const nextUserId = sessionData.session.user.id;
    setUserId(nextUserId);

    const [
      { data: saves, error: savesError },
      { data: checkins, error: checkinsError },
      { data: profile, error: profileError },
      { data: created, error: createdError },
    ] = await Promise.all([
      supabase
        .from("saves")
        .select("drop_id, drops(*)")
        .eq("user_id", nextUserId),
      supabase
        .from("checkins")
        .select("drop_id, drops(*)")
        .eq("user_id", nextUserId),
      supabase
        .from("profiles")
        .select("username")
        .eq("id", nextUserId)
        .maybeSingle(),
      supabase
        .from("drops")
        .select("*")
        .eq("created_by", nextUserId)
        .order("start_time", { ascending: true }),
    ]);

    if (savesError) {
      setStatus("Load saves error: " + savesError.message);
      return;
    }
    if (checkinsError) {
      setStatus("Load check-ins error: " + checkinsError.message);
      return;
    }
    if (profileError) {
      setStatus("Load profile error: " + profileError.message);
      return;
    }
    if (createdError) {
      setStatus("Load created drops error: " + createdError.message);
      return;
    }

    const savedRows = (saves ?? []) as unknown as SaveRow[];
    const checkinRows = (checkins ?? []) as unknown as CheckinRow[];

    const toDropList = (rows: { drops: Drop | Drop[] | null }[]) =>
      rows
        .map((r) => (Array.isArray(r.drops) ? r.drops[0] : r.drops))
        .filter((d): d is Drop => Boolean(d));

    const saved = toDropList(savedRows);
    const checkedIn = toDropList(checkinRows);
    const createdDrops = (created ?? []) as Drop[];

    saved.sort((a, b) => a.start_time.localeCompare(b.start_time));
    checkedIn.sort((a, b) => a.start_time.localeCompare(b.start_time));
    createdDrops.sort((a, b) => a.start_time.localeCompare(b.start_time));

    setSavedDrops(saved);
    setCheckedInDrops(
      checkedIn
    );
    setMyDrops(createdDrops);
    setUsername(profile?.username ?? "");
    setProfileLoaded(true);
    setStatus("");
  }

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadLists();
    setRefreshing(false);
  }

  async function updateUsername() {
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setStatus("Username is required.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setStatus("Username must be 3-20 chars (a-z, 0-9, _).");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: clean,
      display_name: clean,
    });

    setStatus(error ? error.message : "Username updated ✅");
  }

  async function removeSave(dropId: string) {
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }

    const { error } = await supabase
      .from("saves")
      .delete()
      .eq("user_id", userId)
      .eq("drop_id", dropId);

    if (error) {
      setStatus("Remove save error: " + error.message);
      return;
    }

    setSavedDrops((prev) => prev.filter((d) => d.id !== dropId));
  }

  async function removeCheckin(dropId: string) {
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }

    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("user_id", userId)
      .eq("drop_id", dropId);

    if (error) {
      setStatus("Remove check-in error: " + error.message);
      return;
    }

    setCheckedInDrops((prev) => prev.filter((d) => d.id !== dropId));
  }

  function formatTimeRange(startIso: string, endIso: string) {
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const formatTime = (iso: string) =>
      new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${formatDate(startIso)} · ${formatTime(startIso)} → ${formatTime(endIso)}`;
  }

  function groupByDate(drops: Drop[]): DropGroup[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const groups = new Map<string, Drop[]>();

    for (const drop of drops) {
      const start = new Date(drop.start_time);
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());

      let label = start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      if (day.getTime() === today.getTime()) label = "Today";
      else if (day.getTime() === tomorrow.getTime()) label = "Tomorrow";

      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(drop);
    }

    const orderedLabels: string[] = [];
    const maybeAdd = (label: string) => {
      if (groups.has(label)) orderedLabels.push(label);
    };
    maybeAdd("Today");
    maybeAdd("Tomorrow");
    for (const label of groups.keys()) {
      if (label !== "Today" && label !== "Tomorrow") orderedLabels.push(label);
    }

    return orderedLabels.map((label) => ({
      label,
      items: (groups.get(label) ?? []).sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      ),
    }));
  }

  async function deleteDrop(dropId: string) {
    if (!userId) {
      setStatus("Auth error: not signed in");
      return;
    }

    const { error } = await supabase
      .from("drops")
      .delete()
      .eq("id", dropId)
      .eq("created_by", userId);

    if (error) {
      setStatus("Delete error: " + error.message);
      return;
    }

    setMyDrops((prev) => prev.filter((d) => d.id !== dropId));
  }

  function renderDrop(item: Drop, actions?: React.ReactNode) {
    return (
      <Pressable
        onPress={() => router.push(`/drop/${item.id}`)}
        style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {!!item.location_name && <Text>{item.location_name}</Text>}
        <Text style={[styles.subtle, { color: theme.muted }]}>
          {formatTimeRange(item.start_time, item.end_time)}
        </Text>
        {!!item.description && <Text style={{ marginTop: 6 }}>{item.description}</Text>}
        {item.tags?.length ? (
          <Text style={[styles.subtle, { marginTop: 6, color: theme.muted }]}>
            Tags: {item.tags.join(", ")}
          </Text>
        ) : null}
        {actions}
      </Pressable>
    );
  }

  function renderGroup(group: DropGroup, renderItem: (item: Drop) => React.ReactNode) {
    return (
      <View key={group.label} style={{ gap: 10 }}>
        <Text style={styles.groupLabel}>{group.label}</Text>
        {group.items.map((item) => (
          <View key={item.id} style={{ marginTop: 12 }}>
            {renderItem(item)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <AuthGate>
      <ScrollView
        style={[styles.container, backgroundStyle]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={[styles.title, { color: palette.text }]}>My Stuff</Text>
        {!!status && <Text>{status}</Text>}

        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TextInput
            placeholder="username (unique)"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />
          <Button title="Update username" onPress={updateUsername} disabled={!profileLoaded} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Created by me ({myDrops.length})
          </Text>
          {myDrops.length === 0 ? (
            <Text style={{ opacity: 0.7, marginTop: 6 }}>No drops created yet.</Text>
          ) : (
            groupByDate(myDrops).map((group) =>
              renderGroup(group, (item) =>
                renderDrop(
                  item,
                  <Text
                    onPress={() => deleteDrop(item.id)}
                    style={{ marginTop: 8, color: theme.accentWarm, fontWeight: "600" }}>
                    Delete
                  </Text>
                )
              )
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Saved ({savedDrops.length})
          </Text>
          {savedDrops.length === 0 ? (
            <Text style={{ opacity: 0.7, marginTop: 6 }}>No saved drops yet.</Text>
          ) : (
            groupByDate(savedDrops).map((group) =>
              renderGroup(group, (item) =>
                renderDrop(
                  item,
                  <Text
                    onPress={() => removeSave(item.id)}
                    style={{ marginTop: 8, color: theme.accent, fontWeight: "600" }}>
                    Remove save
                  </Text>
                )
              )
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Checked in ({checkedInDrops.length})
          </Text>
          {checkedInDrops.length === 0 ? (
            <Text style={{ opacity: 0.7, marginTop: 6 }}>No check-ins yet.</Text>
          ) : (
            groupByDate(checkedInDrops).map((group) =>
              renderGroup(group, (item) =>
                renderDrop(
                  item,
                  <Text
                    onPress={() => removeCheckin(item.id)}
                    style={{ marginTop: 8, color: theme.accent, fontWeight: "600" }}>
                    Remove check-in
                  </Text>
                )
              )
            )
          )}
        </View>
      </ScrollView>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: Fonts.serif,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  section: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  subtle: {
    opacity: 0.7,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
    fontFamily: Fonts.rounded,
  },
});
