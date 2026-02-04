import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn, signOut, signUp } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "600" }}>CampusDrops</Text>
        {mode === "signup" ? (
          <TextInput
            placeholder="username (unique)"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
          />
        ) : null}
        <TextInput
          placeholder="email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />
        <TextInput
          placeholder="password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
        />

        {mode === "signin" ? (
          <>
            <Button
              title="Sign in"
              onPress={async () => {
                setStatus("Signing in...");
                const { error } = await signIn(email, password);
                setStatus(error ? error.message : "Signed in ✅");
              }}
            />
            <Button
              title="Create account"
              onPress={() => {
                setStatus("");
                setMode("signup");
              }}
            />
          </>
        ) : (
          <>
            <Button
              title="Create account"
              onPress={async () => {
                const cleanUsername = username.trim().toLowerCase();
                if (!cleanUsername) {
                  setStatus("Username is required.");
                  return;
                }
                if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
                  setStatus("Username must be 3-20 chars (a-z, 0-9, _).");
                  return;
                }

                setStatus("Creating account...");
                const { data, error } = await signUp(email, password);
                if (error) {
                  setStatus(error.message);
                  return;
                }

                const userId = data.user?.id;
                if (!userId) {
                  setStatus("Account created. Check your email to confirm, then set username.");
                  return;
                }

                const { error: profileError } = await supabase.from("profiles").upsert({
                  id: userId,
                  username: cleanUsername,
                  display_name: cleanUsername,
                });

                setStatus(profileError ? profileError.message : "Account created ✅");
              }}
            />
            <Button
              title="Back to sign in"
              onPress={() => {
                setStatus("");
                setMode("signin");
              }}
            />
          </>
        )}

        {!!status && <Text>{status}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, alignItems: "flex-end" }}>
        <Button title="Sign out" onPress={() => signOut()} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
