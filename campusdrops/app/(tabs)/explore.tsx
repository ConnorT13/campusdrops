import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCampusTheme } from "@/components/CampusThemeProvider";

const featured = [
  { title: "Late‑night boba pop‑up", org: "Kappa Social", time: "Tonight · 9:00 PM" },
  { title: "Vintage sweatshirt drop", org: "Studio 52", time: "Tomorrow · 12:30 PM" },
  { title: "Study‑jam set + snacks", org: "CS Lounge", time: "Fri · 6:15 PM" },
];

const categories = [
  "Food",
  "Merch",
  "Parties",
  "Clubs",
  "Workshops",
  "Giveaways",
];

const quickPicks = [
  { title: "K‑Town dumpling cart", subtitle: "Main Quad · 0.3 mi" },
  { title: "Sustainable market", subtitle: "Union South · 0.6 mi" },
  { title: "Open mic night", subtitle: "Cafe 24 · 0.9 mi" },
];

export default function Explore() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];
  const { theme } = useCampusTheme();

  const background = useMemo(
    () => ({
      backgroundColor: colorScheme === "dark" ? theme.bgDark : theme.bg,
    }),
    [colorScheme, theme.bg, theme.bgDark]
  );

  return (
    <SafeAreaView style={[styles.container, background]}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <View style={styles.heroGlow} />
        <Text style={[styles.heroTitle, { color: palette.text }]}>Explore</Text>
        <Text style={[styles.heroSubtitle, { color: palette.icon }]}>
          Discover what’s popping on campus—right now.
        </Text>
        <View style={styles.heroPills}>
          <View
            style={[
              styles.pill,
              styles.pillFilled,
              { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}>
            <Text style={styles.pillFilledText}>Trending</Text>
          </View>
          <View style={[styles.pill, styles.pillOutline, { borderColor: theme.border }]}>
            <Text style={[styles.pillOutlineText, { color: palette.text }]}>Tonight</Text>
          </View>
          <View style={[styles.pill, styles.pillOutline, { borderColor: theme.border }]}>
            <Text style={[styles.pillOutlineText, { color: palette.text }]}>Free</Text>
          </View>
        </View>
      </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Categories</Text>
          <View style={styles.tagGrid}>
          {categories.map((label) => (
            <View key={label} style={[styles.tag, { borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: palette.text }]}>{label}</Text>
            </View>
          ))}
        </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Featured Drops</Text>
          <View style={styles.featuredStack}>
            {featured.map((item, index) => (
              <View
                key={item.title}
              style={[
                styles.featuredCard,
                { backgroundColor: index % 2 === 0 ? theme.accent : theme.accentWarm },
              ]}>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <Text style={styles.featuredMeta}>{item.org}</Text>
                <Text style={styles.featuredMeta}>{item.time}</Text>
                <Pressable style={styles.cta}>
                  <Text style={styles.ctaText}>See details</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Quick picks near you</Text>
          <View style={styles.quickList}>
            {quickPicks.map((item) => (
            <View
              key={item.title}
              style={[
                styles.quickCard,
                { borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}>
              <Text style={[styles.quickTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[styles.quickSubtitle, { color: palette.icon }]}>{item.subtitle}</Text>
            </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 20,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#CDE9F2",
    top: -80,
    right: -60,
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: Fonts.serif,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.rounded,
  },
  heroPills: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillFilled: {
  },
  pillFilledText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  pillOutline: {
    backgroundColor: "transparent",
  },
  pillOutlineText: {
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagText: {
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
  featuredStack: {
    gap: 12,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: Fonts.rounded,
  },
  featuredMeta: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontFamily: Fonts.rounded,
  },
  cta: {
    marginTop: 14,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  ctaText: {
    color: "#111",
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  quickList: {
    gap: 10,
  },
  quickCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  quickSubtitle: {
    marginTop: 4,
    fontFamily: Fonts.mono,
  },
});
