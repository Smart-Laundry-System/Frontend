import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";
import { api, IMG_URL } from "../../../Services/api";
import DropDown from "../../../components/Menu/DropDown";
import Vector from "../../../assets/Vector.png";
import { getAccessToken } from "../../../Services/tokenStorage";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";
const PAGE_SIZE = 10;


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

  const [token, setToken] = useState(route?.params?.token ?? "");
  const email = route?.params?.email ?? "";
  const setUnseenBadge = route?.params?.setUnseen;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);

  const [paging, setPaging] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);

  const filterBtnRef = useRef(null);
  const mountedRef = useRef(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const toAbsImage = (rel) => {
    if (!rel) return null;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  const mapApiNotifToUi = useCallback((n) => {
    const when =
      n?.createdAt ||
      (n?.date && n?.time ? `${n.date} ${n.time}` : n?.date || n?.time || null);
    const [timeLabel, dateLabel] = formatDateTime(when);

    const relImg = n?.laundryImg || n?.avatar || n?.image || n?.icon || n?.thumbnail;
    const img = relImg
      ? toAbsImage(relImg)
      : "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=256";

    return {
      id: String(n?.id ?? n?.notificationId ?? n?._id ?? Math.random()),
      name: n?.laundryName || n?.title || "Name of the Laundry",
      address: n?.laundryAddress || n?.address || "",
      subject: n?.subject ?? "",
      message: n?.message || n?.subject || "Message",
      timeLabel,
      dateLabel,
      services: Array.isArray(n?.services) ? n.services : [],
      img,
      raw: n,
    };
  }, []);

  const fetchPage = useCallback(async (pageToLoad, append) => {
    try {
      setError("");
      if (!email) throw new Error("Missing email for notifications");
      if (!token) throw new Error("Missing auth token");

      if (append) setPaging(true);
      else if (!refreshing) setLoading(true);
      const res = await api.get("/api/auth/retrieveAllUserNotifications", {
        params: { email, page: pageToLoad, size: PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const payload = res?.data;
      const content = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.content) ? payload.content
          : (payload?.notifications || payload?.data || []));
      const last = Boolean(payload?.last); 

      const rows = content.map(mapApiNotifToUi);
      if (!mountedRef.current) return;
      setItems(prev => (append ? [...prev, ...rows] : rows));
      setHasNext(!last && rows.length >= PAGE_SIZE);
      setPage(pageToLoad);
    } catch (e) {
      if (mountedRef.current)
        setError(e?.response?.data?.message || e?.message || "Failed to load updates");
    } finally {
      if (!mountedRef.current) return;
      setPaging(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, token, refreshing, mapApiNotifToUi]);

  const markAllSeen = useCallback(async () => {
    if (!email || !token) return;
    try {
      await api.put("/api/auth/notifications/seen-all", null, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (typeof setUnseenBadge === "function") setUnseenBadge(0);
    } catch {
    }
  }, [email, token, setUnseenBadge]);

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
    }
  }, [email, token, setUnseenBadge]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      (async () => {
        await markAllSeen();
        await fetchPage(0, false);
        await syncUnseenCount();
      })();
      return () => {
        mountedRef.current = false;
      };
    }, [markAllSeen, fetchPage, syncUnseenCount])
  );

  useEffect(() => {
    let mounted = true;
    if (!token) {
      (async () => {
        try {
          const t = await getAccessToken();
          if (mounted) setToken(t);
        } catch { }
      })();
    }
    return () => { mounted = false; };
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    const has = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "name":
        return items.filter((x) => has(x.name));
      case "time":
        return items.filter((x) => has(x.timeLabel));           
      case "date":
        return items.filter((x) => has(x.dateLabel));
      case "subject":
        return items.filter((x) => has(x.subject) || has(x.message));
      default:
        return items.filter(
          (x) =>
            has(x.name) ||
            has(x.address) ||
            has(x.dateLabel) ||
            has(x.timeLabel) ||
            has(x.subject) ||
            has((x.services || []).join(" ")) ||
            has(x.message)
        );
    }
  }, [items, search, selectedFilter]);

  const renderRow = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.rowWrap}
      onPress={() => {
        setDetailItem(item);
        setDetailOpen(true);
      }}
    >
      <Image
        source={{ uri: item.img || "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=256" }}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{item.subject}</Text>
      </View>
      <View style={styles.rightMeta}>
        <Text style={styles.time}>{item.timeLabel}</Text>
        <Text style={styles.date}>{item.dateLabel}</Text>
      </View>
    </TouchableOpacity>
  );

   const ListFooter = () => {
   if (!hasNext || search.trim()) return null;
   return (
     <View style={{ paddingVertical: 16, alignItems: "center" }}>
       {paging ? (
         <ActivityIndicator />
       ) : (
         <TouchableOpacity
           style={{
             paddingHorizontal: 16,
             paddingVertical: 10,
             borderRadius: 12,
             backgroundColor: "#D2E3D1",
           }}
           onPress={() => fetchPage(page + 1, true)}
         >
           <Text style={{ color: TEXT, fontWeight: "700" }}>Load more</Text>
         </TouchableOpacity>
       )}
     </View>
   );
 };


  return (
    <PaperProvider>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Vector} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Updates</Text>
          <View style={{ width: 28 }} />
        </View>

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

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={TEXT} /></View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity
              style={styles.retry}
              onPress={() => {
                setRefreshing(true);
                markAllSeen()
                  .finally(() => fetchPage(0, false))
                  .finally(syncUnseenCount);
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
            ListFooterComponent={ListFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  markAllSeen()
                    .finally(() => fetchPage(0, false))
                    .finally(syncUnseenCount);
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}><Text style={{ color: MUTED }}>No updates</Text></View>
            }
          />
        )}
      </View>

      <Portal>
        <Modal
          visible={detailOpen}
          onDismiss={() => setDetailOpen(false)}
          contentContainerStyle={styles.detailCard}
          dismissable
        >
          {detailItem && (
            <View>
              <View style={styles.detailHeader}>
                <Image
                  source={{ uri: detailItem.img }}
                  style={styles.detailAvatar}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.detailTitle} numberOfLines={1}>
                    {detailItem.name}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {detailItem.timeLabel} · {detailItem.dateLabel}
                  </Text>
                  {!!detailItem.address && (
                    <Text style={styles.detailAddress} numberOfLines={1}>
                      {detailItem.address}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailSubheading}>Subject</Text>
                <Text style={styles.detailMessage}>
                  {detailItem.subject || "—"}
                </Text>

                <Text style={[styles.detailSubheading, { marginTop: 12 }]}>Message</Text>
                <Text style={styles.detailMessage}>
                  {detailItem.message || "—"}
                </Text>

                {!!(detailItem.services?.length) && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.detailSubheading}>Services</Text>
                    <View style={styles.chipsRow}>
                      {detailItem.services.map((s, i) => (
                        <View key={`${s}-${i}`} style={styles.chip}>
                          <Text style={styles.chipText}>
                            {String(s)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailOpen(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </Modal>
      </Portal>
    </PaperProvider>
  );
}

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

  detailCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  detailHeader: { flexDirection: "row", alignItems: "center" },
  detailAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  detailTitle: { color: TEXT, fontWeight: "800", fontSize: 16 },
  detailMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  detailAddress: { color: MUTED, fontSize: 12, marginTop: 2 },
  detailBody: { marginTop: 14 },
  detailMessage: { color: TEXT, fontSize: 14, lineHeight: 20 },
  detailSubheading: { color: TEXT, fontWeight: "700", marginBottom: 6 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F1F3F1",
  },
  chipText: { color: TEXT, fontSize: 12, fontWeight: "600" },
  closeBtn: {
    marginTop: 16,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: TEXT, fontWeight: "700" },
});
