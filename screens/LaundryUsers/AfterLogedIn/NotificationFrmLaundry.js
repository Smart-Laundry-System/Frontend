// screens/notifications/UserNotifications.js
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Pressable,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { api, IMG_URL } from "../../../Services/api";
import DropDown from "../../../components/Menu/DropDown";
import Vector from "../../../assets/Vector.png";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Time", value: "time" },
  { label: "Date", value: "date" },
  { label: "Subject", value: "subject" },
];

export default function NotificationFrmLaundry() {
  const navigation = useNavigation();
  const route = useRoute();

  const token = route?.params?.token ?? "";
  const email = route?.params?.email ?? "";

  // optional: parent screen can pass a setter to update a badge
  const setUnseenBadge = route?.params?.setUnseen; // function(count:number)

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);
  const mountedRef = useRef(true);

  const toAbsImage = (rel) => {
    if (!rel) return null;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  const mapApiNotifToUi = useCallback((n) => {
    // Your NotificationDTO likely returns separate SQL date/time strings
    // Try to build a display-friendly pair.
    const when =
      n?.createdAt ||
      (n?.date && n?.time ? `${n.date} ${n.time}` : n?.date || n?.time || null);
    const [timeLabel, dateLabel] = formatDateTime(when);

    const relImg = n?.laundryImg || n?.avatar || n?.image || n?.icon || n?.thumbnail;
    const img =
      relImg
        ? toAbsImage(relImg)
        : "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=256";

    return {
      id: String(n?.id ?? n?.notificationId ?? n?._id ?? Math.random()),
      name: n?.laundryName || n?.title || "Name of the Laundry",
      address: n?.laundryAddress || n?.address || "",
      message: n?.message || n?.subject || "Message",
      timeLabel,
      dateLabel,
      services: Array.isArray(n?.services) ? n.services : [],
      img,
      raw: n,
    };
  }, []);

  /** GET /api/auth/retrieveUserNotifications?email=... */
  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      if (!refreshing) setLoading(true);
      if (!email) throw new Error("Missing email for notifications");
      if (!token) throw new Error("Missing auth token");

      const res = await api.get("/api/auth/retrieveUserNotifications", {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.notifications || payload?.content || payload?.data || [];

      if (mountedRef.current) setItems(list.map(mapApiNotifToUi));
    } catch (e) {
      if (mountedRef.current)
        setError(e?.response?.data?.message || e?.message || "Failed to load updates");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [email, token, refreshing, mapApiNotifToUi]);

  /** PUT /api/auth/notifications/seen-all?email=...  (mark all as seen) */
  const markAllSeen = useCallback(async () => {
    if (!email || !token) return;
    try {
      await api.put("/api/auth/notifications/seen-all", null, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      // unseen count is now 0 – inform parent badge if provided
      if (typeof setUnseenBadge === "function") setUnseenBadge(0);
    } catch {
      // ignore – don't block UI
    }
  }, [email, token, setUnseenBadge]);

  /** Optionally verify unseen count via GET /api/auth/unseenCount?email=... */
  const syncUnseenCount = useCallback(async () => {
    if (!email || !token || typeof setUnseenBadge !== "function") return;
    try {
      const r = await api.get("/api/auth/unseenCount", {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      const c = Number(r?.data?.unseen ?? 0);
      setUnseenBadge(isNaN(c) ? 0 : c);
    } catch {
      // ignore
    }
  }, [email, token, setUnseenBadge]);

  /**
   * IMPORTANT: Run when the screen becomes focused.
   * 1) Mark all as seen (zero unseen)
   * 2) Reload the list (now all "seen")
   * 3) Sync unseen count badge (optional)
   */
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      (async () => {
        await markAllSeen();
        await loadNotifications();
        await syncUnseenCount(); // makes the badge 0 if parent provided setter
      })();
      return () => {
        mountedRef.current = false;
      };
    }, [markAllSeen, loadNotifications, syncUnseenCount])
  );

  // ---- live search (no debounce) ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    const has = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "name":
        return items.filter((x) => has(x.name));
      case "address":
        return items.filter((x) => has(x.address));
      case "date":
        return items.filter((x) => has(x.dateLabel));
      case "services":
        return items.filter((x) => has((x.services || []).join(" ")));
      default:
        return items.filter(
          (x) =>
            has(x.name) ||
            has(x.address) ||
            has(x.dateLabel) ||
            has((x.services || []).join(" ")) ||
            has(x.message)
        );
    }
  }, [items, search, selectedFilter]);

  const renderRow = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.rowWrap}>
      <Image
        source={{ uri: item.img || "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=256" }}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{item.message}</Text>
      </View>
      <View style={styles.rightMeta}>
        <Text style={styles.time}>{item.timeLabel}</Text>
        <Text style={styles.date}>{item.dateLabel}</Text>
      </View>
    </TouchableOpacity>
  ); NotificationFrmLaundry

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Vector} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Updates</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search + Filter (dropdown anchored to button) */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Laundry..."
            placeholderTextColor={MUTED}
            style={styles.input}
            returnKeyType="search"
          />
        </View>

        <Pressable
          ref={filterBtnRef}
          style={styles.filterBtn}
          onPress={() => setFilterOpen(true)}
        >
          <Ionicons name="options-outline" size={20} color={TEXT} />
        </Pressable>

        <DropDown
          visible={filterOpen}
          anchorRef={filterBtnRef}
          options={FILTER_OPTIONS}
          onSelect={(opt) => {
            setSelectedFilter(opt);
            setFilterOpen(false);
          }}
          onRequestClose={() => setFilterOpen(false)}
          width={220}
          offsetY={8}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={TEXT} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setRefreshing(true);
              // also mark seen again just in case and reload
              markAllSeen().finally(loadNotifications).finally(syncUnseenCount);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                // during pull-to-refresh we mark all seen again and then reload
                markAllSeen().finally(loadNotifications).finally(syncUnseenCount);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}><Text style={{ color: MUTED }}>No updates</Text></View>
          }
        />
      )}
    </View>
  );
}

/* -------- helpers -------- */
function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}
function formatDateTime(d) {
  if (!d) return ["", ""];
  const date = new Date(d);
  if (isNaN(date.getTime())) return ["", ""];
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).toLowerCase();
  const day = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  return [time, day];
}

/* -------- styles -------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 54, android: 28 }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: TEXT, marginRight: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F1",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#D2E3D1",
    alignItems: "center",
    justifyContent: "center",
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  title: { color: TEXT, fontWeight: "700", fontSize: 14 },
  subtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  rightMeta: { marginLeft: 10, alignItems: "flex-end" },
  time: { color: TEXT, fontSize: 12, fontWeight: "600" },
  date: { color: MUTED, fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#B00020", marginBottom: 8 },
  retry: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#FFECEC", borderRadius: 10 },
  retryText: { color: "#B00020", fontWeight: "700" },
});
