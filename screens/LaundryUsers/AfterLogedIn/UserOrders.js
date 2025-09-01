// screens/orders/OrderPage.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Pressable,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Debounce } from "../../../utils/Debounce";
import { api, IMG_URL } from "../../../Services/api"; 
import Vector from "../../../assets/Vector.png";
import DropDown from "../../../components/Menu/DropDown";

const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";
const CARD_BG = "#FFFBEA";
const BG = "#F8FAF7";

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Date", value: "date" },
  { label: "Phone", value: "phone" },
  { label: "Services", value: "services" },
];

export default function UserOrders() {
  const navigation = useNavigation();
  const route = useRoute();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rawQuery, setRawQuery] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);

  const token = route?.params?.token ?? "";
  const email = route?.params?.email ?? "";
  const name = route?.params?.name ?? "";
  const mountedRef = useRef(true);

  // ---------- API → UI map ----------
  const mapApiOrderToUi = useCallback((o) => {
    const relImg = o?.laundryImg; // e.g. "/files/1756...png"
    const img = relImg
      ? `${(IMG_URL || "").replace(/\/$/, "")}${relImg.startsWith("/") ? "" : "/"}${relImg}`
      : Image.resolveAssetSource(require("../../../assets/backLogin.png")).uri;

    return {
      id: String(o?.id ?? o?.orderId ?? o?._id ?? Math.random()),
      name: o?.laundryName || "Laundry name",
      location: o?.laundryAddress || o?.customerAddress || "Location",
      phone: o?.laundryPhone || "",
      date: o?.createdAt ?? o?.orderDate ?? o?.date ?? null,
      dateLabel: formatDate(o?.createdAt ?? o?.orderDate ?? o?.date),
      services: Array.isArray(o?.serviceIds) ? o.serviceIds.map(String) : [],
      img,
      rating: Number(o?.rating ?? 4.7),
      raw: o,
    };
  }, []);

  // ---------- Fetch ----------
  const fetchOrders = useCallback(async () => {
    try {
      setError("");
      if (!refreshing) setLoading(true);

      if (!email) throw new Error("Missing email param for orders");
      if (!token) throw new Error("Missing auth token");

      const res = await api.get("/api/auth/retrieveUserOrder", {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!mountedRef.current) return;

      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.orders || payload?.content || payload?.data || (payload ? [payload] : []);

      setOrders(list.map(mapApiOrderToUi));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load orders");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, token, refreshing, mapApiOrderToUi]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchOrders]);

  const onChangeSearch = (text) => {
    setRawQuery(text);
    debouncedSetQuery(text);
  };
  const debouncedSetQuery = useMemo(
    () => Debounce((t) => setQuery((t || "").trim().toLowerCase()), 250),
    []
  );

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;

    const contains = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "name":
        return orders.filter((o) => contains(o.name));
      case "date":
        return orders.filter((o) => contains(o.dateLabel));
      case "phone":
        return orders.filter((o) => contains(o.phone));
      case "services":
        return orders.filter((o) => contains((o.services || []).join(" ")));
      default:
        return orders.filter(
          (o) =>
            contains(o.name) ||
            contains(o.phone) ||
            contains(o.dateLabel) ||
            contains((o.services || []).join(" "))
        );
    }
  }, [orders, query, selectedFilter]);

  // ---------- UI ----------
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate("OrderDetails", { order: item.raw })}
    >
      <Image source={{ uri: item.img }} style={styles.cardImage} />
      <View style={styles.ratingPill}>
        <Ionicons name="star" size={12} />
        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Vector} />
        </TouchableOpacity>

        <Text style={styles.greeting}>Hi {name}</Text>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate("ProfileUser", { email, token })}
        >
          <Ionicons name="person-circle" size={28} color={TEXT} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Welcome to{"\n"}The Smart Laundry</Text>

      {/* Search + DropDown filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
          <TextInput
            value={rawQuery}
            onChangeText={onChangeSearch}
            placeholder={`Search by ${selectedFilter.label || "All"}...`}
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

      <Text style={styles.sectionLabel}>My orders</Text>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={TEXT} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(it) => it.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
            />
          }
          ListEmptyComponent={
            <View style={{ paddingTop: 32, alignItems: "center" }}>
              <Text style={styles.muted}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

/* ------------------------ helpers ------------------------ */
function formatDate(d) {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

/* ------------------------ styles ------------------------ */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 54, android: 28 }),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9000,
  },
  greeting: { fontSize: 18, color: TEXT, fontWeight: "600" },
  profileBtn: { padding: 2, borderRadius: 16 },
  title: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 26,
    lineHeight: 30,
    color: TEXT,
    fontWeight: "800",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EFE3",
  },
  sectionLabel: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: TEXT,
    fontWeight: "700",
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: { width: "100%", height: 130 },
  ratingPill: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: CARD_BG,
    borderRadius: 999,
  },
  ratingText: { fontSize: 12, color: TEXT, fontWeight: "700" },
  cardMeta: { padding: 12 },
  cardTitle: { fontWeight: "800", fontSize: 14, color: TEXT },
  cardSub: { marginTop: 2, color: MUTED, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  metaText: { color: MUTED, fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#B00020", marginBottom: 8 },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFECEC",
    borderRadius: 10,
  },
  retryText: { color: "#B00020", fontWeight: "700" },
  muted: { color: MUTED },
});