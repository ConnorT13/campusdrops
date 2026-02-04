import { useMemo, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { AuthGate } from "../../components/AuthGate";
import { supabase } from "../../lib/supabase";


export default function Post() {
  const [status, setStatus] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");

  const defaultStart = useMemo(() => new Date(Date.now() + 15 * 60 * 1000).toISOString(), []);
  const defaultEnd = useMemo(() => new Date(Date.now() + 75 * 60 * 1000).toISOString(), []);

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

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

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime())) return "Start time must be a valid ISO timestamp.";
    if (Number.isNaN(end.getTime())) return "End time must be a valid ISO timestamp.";
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
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
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

  return (
    <AuthGate>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Post</Text>

        <View style={{ padding: 14, borderWidth: 1, borderRadius: 12, gap: 10 }}>
          <TextInput
            placeholder="Title (required)"
            value={title}
            onChangeText={setTitle}
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ borderWidth: 1, padding: 10, borderRadius: 10, minHeight: 70 }}
          />

          <TextInput
            placeholder="Location name (e.g., Main Quad)"
            value={locationName}
            onChangeText={setLocationName}
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />

          <Text style={{ fontWeight: "600" }}>Times (ISO format for now)</Text>
          <TextInput
            placeholder="Start time (ISO)"
            value={startTime}
            onChangeText={setStartTime}
            autoCapitalize="none"
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />
          <TextInput
            placeholder="End time (ISO)"
            value={endTime}
            onChangeText={setEndTime}
            autoCapitalize="none"
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />

          <Text style={{ fontWeight: "600" }}>Coordinates</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              placeholder="Latitude"
              value={lat}
              onChangeText={setLat}
              autoCapitalize="none"
              keyboardType="numeric"
              style={{ flex: 1, borderWidth: 1, padding: 10, borderRadius: 10 }}
            />
            <TextInput
              placeholder="Longitude"
              value={lng}
              onChangeText={setLng}
              autoCapitalize="none"
              keyboardType="numeric"
              style={{ flex: 1, borderWidth: 1, padding: 10, borderRadius: 10 }}
            />
          </View>
          <Button title="Use my location" onPress={fillFromGPS} />

          <TextInput
            placeholder="Tags (comma-separated)"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
            style={{ borderWidth: 1, padding: 10, borderRadius: 10 }}
          />

          <Button title="Post drop" onPress={createDrop} />
          {!!status && <Text>{status}</Text>}
        </View>
      </View>
    </AuthGate>
  );
}
