import { useEffect, useState } from "react";
import { Button, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn, signOut, signUp } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Fonts } from "@/constants/theme";
import { useCampusTheme } from "@/components/CampusThemeProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { theme } = useCampusTheme();
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
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

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setNeedsUsername(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        return;
      }
      const current = data?.username ?? "";
      setPendingUsername(current);
      setNeedsUsername(!current);
    }

    loadProfile();
  }, [session]);

  if (!session) {
    return (
      <View style={[styles.authContainer, { backgroundColor: theme.bg }]}>
        <View style={[styles.authCard, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
          <Text style={styles.authTitle}>CampusDrops</Text>
          <Text style={[styles.authSubtitle, { color: theme.muted }]}>Campus drops, in the moment.</Text>
        {mode === "signup" ? (
          <TextInput
            placeholder="username (unique)"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />
        ) : null}
        <TextInput
          placeholder="email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
        />
        <TextInput
          placeholder="password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
        />

        {mode === "signin" ? (
          <>
            <Pressable
              onPress={async () => {
                setStatus("Signing in...");
                const { error } = await signIn(email, password);
                setStatus(error ? error.message : "Signed in ✅");
              }}
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setStatus("");
                setMode("signup");
              }}
              style={[styles.secondaryButton, { borderColor: theme.border }]}>
              <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Create account</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
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
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.primaryButtonText}>Create account</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setStatus("");
                setMode("signin");
              }}
              style={[styles.secondaryButton, { borderColor: theme.border }]}>
              <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Back to sign in</Text>
            </Pressable>
          </>
        )}

        {!!status && <Text>{status}</Text>}
        </View>
      </View>
    );
  }

  if (needsUsername) {
    return (
      <View style={[styles.authContainer, { backgroundColor: theme.bg }]}>
        <View style={[styles.authCard, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
          <Text style={styles.authTitle}>Pick a username</Text>
        <TextInput
          placeholder="username (unique)"
          autoCapitalize="none"
          value={pendingUsername}
          onChangeText={setPendingUsername}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
        />
        <Pressable
          onPress={async () => {
            const clean = pendingUsername.trim().toLowerCase();
            if (!clean) {
              setStatus("Username is required.");
              return;
            }
            if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
              setStatus("Username must be 3-20 chars (a-z, 0-9, _).");
              return;
            }

            const { error } = await supabase.from("profiles").upsert({
              id: session.user.id,
              username: clean,
              display_name: clean,
            });

            if (error) {
              setStatus(error.message);
              return;
            }
            setNeedsUsername(false);
            setStatus("");
          }}
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}>
          <Text style={styles.primaryButtonText}>Save username</Text>
        </Pressable>
        {!!status && <Text>{status}</Text>}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, alignItems: "flex-end" }}>
        <Pressable
          onPress={() => signOut()}
          style={[styles.signOut, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.signOutText, { color: theme.accent }]}>Sign out</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: Fonts.serif,
  },
  authSubtitle: {
    fontFamily: Fonts.rounded,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  primaryButton: {
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
  signOut: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  signOutText: {
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
});
