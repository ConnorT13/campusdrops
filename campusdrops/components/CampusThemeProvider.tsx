import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";

export type CampusKey = "uiuc" | "gatech";

export type CampusTheme = {
  bg: string;
  bgDark: string;
  card: string;
  cardAlt: string;
  border: string;
  accent: string;
  accentWarm: string;
  muted: string;
  pillText: string;
};

const uiuc: CampusTheme = {
  bg: "#F5F7FA",
  bgDark: "#0B1115",
  card: "#FFFFFF",
  cardAlt: "#FFFFFF",
  border: "#D6DDE6",
  accent: "#13294B",
  accentWarm: "#E84A27",
  muted: "#4B5B73",
  pillText: "#13294B",
};

const gatech: CampusTheme = {
  bg: "#F6F4EF",
  bgDark: "#0B1115",
  card: "#FFFFFF",
  cardAlt: "#FFFFFF",
  border: "#DDD5C7",
  accent: "#003057",
  accentWarm: "#B3A369",
  muted: "#4F4B42",
  pillText: "#003057",
};

const campusThemes: Record<CampusKey, CampusTheme> = {
  uiuc,
  gatech,
};

type CampusThemeContextValue = {
  campusKey: CampusKey;
  theme: CampusTheme;
};

const CampusThemeContext = createContext<CampusThemeContextValue>({
  campusKey: "uiuc",
  theme: uiuc,
});

function inBounds(
  lat: number,
  lng: number,
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number }
) {
  return lat >= bounds.latMin && lat <= bounds.latMax && lng >= bounds.lngMin && lng <= bounds.lngMax;
}

function detectCampus(lat: number, lng: number): CampusKey {
  // UIUC bounding box (approx)
  const uiucBounds = { latMin: 40.090, latMax: 40.125, lngMin: -88.250, lngMax: -88.200 };
  // Georgia Tech bounding box (approx)
  const gatechBounds = { latMin: 33.760, latMax: 33.785, lngMin: -84.410, lngMax: -84.380 };

  if (inBounds(lat, lng, uiucBounds)) return "uiuc";
  if (inBounds(lat, lng, gatechBounds)) return "gatech";
  return "uiuc";
}

export function CampusThemeProvider({ children }: { children: React.ReactNode }) {
  const [campusKey, setCampusKey] = useState<CampusKey>("uiuc");

  useEffect(() => {
    let isMounted = true;
    async function resolveCampus() {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      const status =
        existingStatus === "granted"
          ? existingStatus
          : (await Location.requestForegroundPermissionsAsync()).status;

      if (status !== "granted") {
        if (isMounted) setCampusKey("uiuc");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      if (!isMounted) return;
      setCampusKey(detectCampus(position.coords.latitude, position.coords.longitude));
    }

    resolveCampus();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      campusKey,
      theme: campusThemes[campusKey],
    }),
    [campusKey]
  );

  return <CampusThemeContext.Provider value={value}>{children}</CampusThemeContext.Provider>;
}

export function useCampusTheme() {
  return useContext(CampusThemeContext);
}
