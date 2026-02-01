import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
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
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";
import { api } from "../../../Services/api";
import Vector from "../../../assets/Vector.png";
import DropDown from "../../../components/Menu/DropDown";
import { getAccessToken } from "../../../Services/tokenStorage";
import { useRegistration } from "../../../context/RegistrationContext";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";
const GREEN = "#A3AE95";

const PAGE_SIZE = 10;

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Customer", value: "customer" },
  { label: "Subject", value: "subject" },
  { label: "Email", value: "email" },
  { label: "Order Status", value: "status" },
];

const AVATAR_COLORS = ["#444", "#666", "#a3ae95", "#555", "#3C4234", "#A3AE95"];
const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => (p[0] || "").toUpperCase())
    .join("") || "U";

const colorFor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return "";
  return `${pad2(Number(d))}/${pad2(Number(m))}/${y}`;
}

export default function ComplaintsList() {
  const { laundryId } = useRegistration();
  const navigation = useNavigation();
  const route = useRoute();

  const [token, setToken] = useState(route?.params?.token ?? "");
  const laundryid = route?.params?.laundryId ?? route?.params?.id ?? laundryId ?? "";

  const [items, setItems] = useState([]);      
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paging, setPaging] = useState(false); 
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);
  const mountedRef = useRef(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);


  const mapApiToUi = useCallback((c) => {
    const customerName = c?.customerName || "Customer";
    const timeLabel = c?.time || "";              
    const dateLabel = formatDateLabel(c?.date);  

    return {
      id: String(c?.id ?? Math.random()),
      subject: c?.subject || "Subject",
      message: c?.message || "-",
      customerName,
      customerEmail: c?.customerEmail || "",
      laundryName: c?.laundryName || "",
      orderStatus: c?.orderStatus || "",
      orderId: c?.orderId ?? null,

      timeLabel,
      dateLabel,

      color: colorFor(customerName),
      initials: getInitials(customerName),
      raw: c,
    };
  }, []);

  const fetchPage = useCallback(
    async (pageToLoad, append) => {
      try {
        setError("");
        if (!laundryid) throw new Error("Missing laundryId");
        if (!token) throw new Error("Missing auth token");

        if (append) setPaging(true);
        else if (!refreshing) setLoading(true);

        const res = await api.get("/api/auth/getAllComplain", {
          params: { laundryId: laundryid, page: pageToLoad, size: PAGE_SIZE },
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = res?.data;
        const content = Array.isArray(payload?.content) ? payload.content : [];
        const last = Boolean(payload?.last);

        const rows = content.map(mapApiToUi);
        if (!mountedRef.current) return;

        setItems((prev) => (append ? [...prev, ...rows] : rows));
        setHasNext(!last && rows.length >= PAGE_SIZE);
        setPage(pageToLoad);
      } catch (e) {
        if (mountedRef.current)
          setError(e?.response?.data || e?.message || "Failed to load complaints");
      } finally {
        if (!mountedRef.current) return;
        setPaging(false);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [laundryid, token, refreshing, mapApiToUi]
  );

  useEffect(() => {
    let mounted = true;
    if (!token) {
      (async () => {
        try {
          const t = await getAccessToken();
          if (mounted) setToken(t);
        } catch {
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      fetchPage(0, false);
      return () => {
        mountedRef.current = false;
      };
    }, [fetchPage])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasNext(true);
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasNext || paging || loading) return;
    fetchPage(page + 1, true);
  }, [hasNext, paging, loading, page, fetchPage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const has = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "customer":
        return items.filter((x) => has(x.customerName) || has(x.customerEmail));
      case "subject":
        return items.filter((x) => has(x.subject) || has(x.message));
      case "email":
        return items.filter((x) => has(x.customerEmail));
      case "status":
        return items.filter((x) => has(x.orderStatus));
      default:
        return items.filter(
          (x) =>
            has(x.customerName) ||
            has(x.customerEmail) ||
            has(x.subject) ||
            has(x.message) ||
            has(x.orderStatus) ||
            has(x.laundryName)
        );
    }
  }, [items, search, selectedFilter]);

  const openModal = (item) => {
    if (filterOpen) setFilterOpen(false);
    Keyboard.dismiss();
    setDetailItem(item);
    setDetailOpen(true);
  };
  const closeModal = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  const renderRow = ({ item }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.9} onPress={() => openModal(item)}>
      <View style={[styles.avatar, { backgroundColor: item.color }]}>
        <Text style={styles.avatarText}>{item.initials}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.subject}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.customerName}
          {item.orderStatus ? `  •  ${item.orderStatus}` : ""}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
        {!!item.timeLabel && <Text style={styles.time}>{item.timeLabel}</Text>}
        {!!item.dateLabel && <Text style={styles.date}>{item.dateLabel}</Text>}
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
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load more</Text>
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
          <Text style={styles.headerTitle}>Complaints</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search complaints..."
              placeholderTextColor={MUTED}
              style={styles.input}
              returnKeyType="search"
            />
          </View>

          <Pressable ref={filterBtnRef} style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
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
          <View style={styles.center}>
            <ActivityIndicator size="large" color={TEXT} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity
              style={styles.retry}
              onPress={() => {
                setRefreshing(true);
                fetchPage(0, false);
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
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListFooterComponent={ListFooter}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: MUTED }}>No complaints</Text>
              </View>
            }
            removeClippedSubviews
            initialNumToRender={10}
          />
        )}

        <Portal>
          <Modal
            visible={detailOpen}
            onDismiss={closeModal}
            dismissable
            contentContainerStyle={styles.detailCard}
          >
            {detailItem && (
              <View>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailAvatar, { backgroundColor: detailItem.color }]}>
                    <Text style={styles.detailAvatarText}>{detailItem.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.detailTitle} numberOfLines={1}>
                      {detailItem.customerName}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {(detailItem.timeLabel || "—")}
                      {detailItem.dateLabel ? `  ·  ${detailItem.dateLabel}` : ""}
                    </Text>
                    {!!detailItem.customerEmail && (
                      <Text style={styles.detailAddress} numberOfLines={1}>
                        {detailItem.customerEmail}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailBody}>
                  <Text style={styles.detailLabel}>Subject</Text>
                  <Text style={styles.detailValue}>{detailItem.subject || "—"}</Text>

                  <Text style={[styles.detailLabel, { marginTop: 12 }]}>Message</Text>
                  <Text style={styles.detailValue}>{detailItem.message || "—"}</Text>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.detailLabel}>Order No</Text>
                    <Text style={styles.detailValue}>
                      {detailItem.orderId != null ? `#${detailItem.orderId}` : "—"}
                      {detailItem.orderStatus ? `  :-  ${detailItem.orderStatus} status` : ""}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </Modal>
        </Portal>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: Platform.select({ ios: 54, android: 28 }) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: TEXT },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F1F3F1", borderRadius: 14, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#D2E3D1", alignItems: "center", justifyContent: "center" },

  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  title: { color: TEXT, fontWeight: "700", fontSize: 14 },
  subtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  time: { color: MUTED, fontSize: 12 },
  date: { color: MUTED, fontSize: 12, marginTop: 2 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#B00020", marginBottom: 8 },
  retry: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#FFECEC", borderRadius: 10 },
  retryText: { color: "#B00020", fontWeight: "700" },

  loadMoreBtn: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#D2E3D1" },
  loadMoreText: { color: TEXT, fontWeight: "700" },

  sheet: { marginHorizontal: 16, borderRadius: 16, backgroundColor: GREEN, padding: 20 },

  detailCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,      
    alignItems: "center",
    justifyContent: "center",
  },
  detailAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  detailTitle: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 16,
  },
  detailMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  detailAddress: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  detailBody: {
    marginTop: 14,
  },
  detailLabel: {
    color: TEXT,
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  detailValue: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    alignSelf: "center",
    marginTop: 16,
    height: 42,
    borderRadius: 10,
    borderColor: TEXT,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: TEXT,
    fontWeight: "700",
  },
});
