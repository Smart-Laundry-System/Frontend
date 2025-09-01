// screens/orders/OrderHistoryCustomers.js
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
import Vector from "../../../assets/Vector.png";
import DropDown from "../../../components/Menu/DropDown";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
];

const ENDPOINTS = {
  orderHistoryCustomers: `/api/auth/retriveLaundryRelatedOrder`, // ?email=<laundryOwnerEmail>
};

export default function OrderHistoryCustomers() {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route?.params?.token ?? "";
  const email = route?.params?.email ?? ""; // laundry owner email

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);
  const mountedRef = useRef(true);

  const toAbs = (rel) => {
    if (!rel) return null;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  // Map API -> UI row (treat each row as an order owned by this laundry)
  const mapRow = (o) => ({
    id: String(o?.id ?? o?.orderId ?? Math.random()),
    name:
      o?.customerName ||
      [o?.firstName, o?.lastName].filter(Boolean).join(" ") ||
      "First name + last name",
    email: o?.customerEmail || "",
    phone: o?.customerPhone || "",
    address: o?.customerAddress || "",
    avatar: toAbs(o?.laundryImg) || "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=256",
    raw: o,
  });

  const loadCustomers = useCallback(async () => {
    try {
      setError("");
      if (!refreshing) setLoading(true);
      if (!token || !email) throw new Error("Missing auth/email");

      const res = await api.get(ENDPOINTS.orderHistoryCustomers, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = res?.data;
      // backend can return list of orders or a wrapper
      const list = Array.isArray(payload)
        ? payload
        : payload?.orders || payload?.customers || payload?.content || payload?.data || [];

      if (mountedRef.current) setItems(list.map(mapRow));
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data?.message || e?.message || "Failed to load customers");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [email, token, refreshing]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      loadCustomers();
      return () => { mountedRef.current = false; };
    }, [loadCustomers])
  );

  // live search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const has = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "name": return items.filter((x) => has(x.name));
      case "address": return items.filter((x) => has(x.address));
      case "phone": return items.filter((x) => has(x.phone));
      case "email": return items.filter((x) => has(x.email));
      default: return items.filter((x) => has(x.name) || has(x.address) || has(x.phone) || has(x.email));
    }
  }, [items, search, selectedFilter]);

  // what to show as the main line depending on current filter
  const displayLabel = (item) => {
    switch (selectedFilter.value) {
      case "address": return item.address || item.name;
      case "phone": return item.phone || item.name;
      case "email": return item.email || item.name;
      case "name":
      default: return item.name;
    }
  };

  const renderRow = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.row}
      onPress={() =>
        navigation.navigate("CustomerOrder", {
          token,
          orderId: item.id,        // unique id -> open detail screen
          email,                   // laundry owner email
          role: "LAUNDRY",
        })
      }
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text numberOfLines={1} style={styles.name}>{displayLabel(item)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Vector} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search by ${selectedFilter.label || "All"}...`}
            placeholderTextColor={MUTED}
            style={styles.input}
            returnKeyType="search"
          />
        </View>

        <Pressable ref={filterBtnRef} onPress={() => setFilterOpen(true)} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={TEXT} />
        </Pressable>

        <DropDown
          visible={filterOpen}
          anchorRef={filterBtnRef}
          options={FILTER_OPTIONS}
          onSelect={(opt) => { setSelectedFilter(opt); setFilterOpen(false); }}
          onRequestClose={() => setFilterOpen(false)}
          width={220}
          offsetY={8}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={TEXT} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={{ color: "#B00020" }}>{error}</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCustomers(); }} />
          }
          ListEmptyComponent={<View style={styles.center}><Text style={{ color: MUTED }}>No customers</Text></View>}
        />
      )}
    </View>
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

  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  name: { color: TEXT, fontSize: 16, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
