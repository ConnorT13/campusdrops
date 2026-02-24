import { useMemo, useState } from "react";
import { Button, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { AuthGate } from "../../components/AuthGate";
import { supabase } from "../../lib/supabase";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCampusTheme } from "@/components/CampusThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";


export default function Post() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const { theme } = useCampusTheme();
  const backgroundStyle =
    { backgroundColor: colorScheme === "dark" ? theme.bgDark : theme.bg };
  const [status, setStatus] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");

  const defaultStart = useMemo(() => new Date(Date.now() + 15 * 60 * 1000), []);
  const defaultEnd = useMemo(() => new Date(Date.now() + 75 * 60 * 1000), []);

  const [startTime, setStartTime] = useState<Date>(defaultStart);
  const [endTime, setEndTime] = useState<Date>(defaultEnd);
  const [activePicker, setActivePicker] = useState<"startDate" | "startTime" | "endDate" | "endTime" | null>(null);

  const [lat, setLat] = useState("40.1099");
  const [lng, setLng] = useState("-88.2272");
  const [tags, setTags] = useState("");

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validateForm() {
    if (!title.trim()) return "Title is required.";

    const start = startTime;
    const end = endTime;
    if (Number.isNaN(start.getTime())) return "Start time must be valid.";
    if (Number.isNaN(end.getTime())) return "End time must be valid.";
    if (end <= start) return "End time must be after start time.";

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return "Latitude/Longitude must be numbers.";
    if (latNum < -90 || latNum > 90) return "Latitude must be between -90 and 90.";
    if (lngNum < -180 || lngNum > 180) return "Longitude must be between -180 and 180.";

    return null;
  }

  async function createDrop() {
    const validationError = validateForm();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setStatus("Posting...");

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setStatus("Auth error: not signed in");
      return;
    }

    const userId = sessionData.session.user.id;

    const { error } = await supabase.from("drops").insert({
      created_by: userId,
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location_name: locationName.trim() ? locationName.trim() : null,
      latitude: Number(lat),
      longitude: Number(lng),
      tags: parseTags(tags),
    });

    if (error) {
      setStatus("Insert error: " + error.message);
      return;
    }

    setStatus("Posted ✅");
    setTitle("");
    setDescription("");
    setLocationName("");
    setTags("");
  }

  async function fillFromGPS() {
    setStatus("Requesting location...");
    const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus !== "granted") {
      setStatus("Location permission denied.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setLat(String(position.coords.latitude));
    setLng(String(position.coords.longitude));
    setStatus("Location filled ✅");
  }

  function setDatePart(current: Date, nextDate: Date) {
    const updated = new Date(current);
    updated.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    return updated;
  }

  function setTimePart(current: Date, nextTime: Date) {
    const updated = new Date(current);
    updated.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
    return updated;
  }

  return (
    <AuthGate>
      <ScrollView
        style={[styles.container, backgroundStyle]}
        contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>Post</Text>

        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <TextInput
            placeholder="Title (required)"
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[
              styles.input,
              styles.inputMultiline,
              { borderColor: theme.border, backgroundColor: theme.cardAlt },
            ]}
          />

          <TextInput
            placeholder="Location name (e.g., Main Quad)"
            value={locationName}
            onChangeText={setLocationName}
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />

          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Times</Text>
          {activePicker === "startDate" ? (
            <View style={[styles.pickerPanel, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerLabel, { color: theme.muted }]}>Start date</Text>
                {Platform.OS === "ios" ? (
                  <Pressable
                    onPress={() => setActivePicker(null)}
                    style={[styles.doneButton, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
              <DateTimePicker
                value={startTime}
                mode="date"
                display={Platform.select({ ios: "spinner", android: "default" })}
                onChange={(_, selected) => {
                  if (selected) setStartTime((prev) => setDatePart(prev, selected));
                  if (Platform.OS !== "ios") setActivePicker(null);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setActivePicker("startDate")}
              style={[
                styles.input,
                styles.pickerButton,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}>
              <Text style={styles.pickerText}>
                Start date: {startTime.toLocaleDateString([], { dateStyle: "medium" })}
              </Text>
            </Pressable>
          )}
          {activePicker === "startTime" ? (
            <View style={[styles.pickerPanel, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerLabel, { color: theme.muted }]}>Start time</Text>
                {Platform.OS === "ios" ? (
                  <Pressable
                    onPress={() => setActivePicker(null)}
                    style={[styles.doneButton, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.select({ ios: "spinner", android: "default" })}
                onChange={(_, selected) => {
                  if (selected) setStartTime((prev) => setTimePart(prev, selected));
                  if (Platform.OS !== "ios") setActivePicker(null);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setActivePicker("startTime")}
              style={[
                styles.input,
                styles.pickerButton,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}>
              <Text style={styles.pickerText}>
                Start time: {startTime.toLocaleTimeString([], { timeStyle: "short" })}
              </Text>
            </Pressable>
          )}
          {activePicker === "endDate" ? (
            <View style={[styles.pickerPanel, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerLabel, { color: theme.muted }]}>End date</Text>
                {Platform.OS === "ios" ? (
                  <Pressable
                    onPress={() => setActivePicker(null)}
                    style={[styles.doneButton, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
              <DateTimePicker
                value={endTime}
                mode="date"
                display={Platform.select({ ios: "spinner", android: "default" })}
                onChange={(_, selected) => {
                  if (selected) setEndTime((prev) => setDatePart(prev, selected));
                  if (Platform.OS !== "ios") setActivePicker(null);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setActivePicker("endDate")}
              style={[
                styles.input,
                styles.pickerButton,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}>
              <Text style={styles.pickerText}>
                End date: {endTime.toLocaleDateString([], { dateStyle: "medium" })}
              </Text>
            </Pressable>
          )}
          {activePicker === "endTime" ? (
            <View style={[styles.pickerPanel, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerLabel, { color: theme.muted }]}>End time</Text>
                {Platform.OS === "ios" ? (
                  <Pressable
                    onPress={() => setActivePicker(null)}
                    style={[styles.doneButton, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.select({ ios: "spinner", android: "default" })}
                onChange={(_, selected) => {
                  if (selected) setEndTime((prev) => setTimePart(prev, selected));
                  if (Platform.OS !== "ios") setActivePicker(null);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setActivePicker("endTime")}
              style={[
                styles.input,
                styles.pickerButton,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}>
              <Text style={styles.pickerText}>
                End time: {endTime.toLocaleTimeString([], { timeStyle: "short" })}
              </Text>
            </Pressable>
          )}

          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Coordinates</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="Latitude"
              value={lat}
              onChangeText={setLat}
              autoCapitalize="none"
              keyboardType="numeric"
              style={[
                styles.input,
                styles.inputHalf,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}
            />
            <TextInput
              placeholder="Longitude"
              value={lng}
              onChangeText={setLng}
              autoCapitalize="none"
              keyboardType="numeric"
              style={[
                styles.input,
                styles.inputHalf,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}
            />
          </View>
          <Button title="Use my location" onPress={fillFromGPS} />

          <TextInput
            placeholder="Tags (comma-separated)"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />

          <Button title="Post drop" onPress={createDrop} />
          {!!status && <Text>{status}</Text>}
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
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: Fonts.serif,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 20,
    gap: 10,
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
  inputMultiline: {
    minHeight: 70,
  },
  pickerButton: {
    justifyContent: "center",
  },
  pickerText: {
    fontFamily: Fonts.rounded,
  },
  pickerPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerLabel: {
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  sectionLabel: {
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
});
