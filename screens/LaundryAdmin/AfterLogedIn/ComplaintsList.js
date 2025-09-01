// screens/complaints/ComplaintsList.js
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
  Keyboard,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { api, IMG_URL } from "../../../Services/api";
import Vector from "../../../assets/Vector.png";
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";
import DropDown from "../../../components/Menu/DropDown";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";
const GREEN = "#A3AE95";

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
];

const ENDPOINTS = {
  complaints: "/api/auth/retrieveComplaints", // expects ?email=...
};

export default function ComplaintsList() {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route?.params?.token ?? "";
  const email = route?.params?.email ?? "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);
  const mountedRef = useRef(true);

  // modal for full complaint
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const toAbsImage = (rel) => {
    if (!rel) return null;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  // Map arbitrary backend complaint → UI row
  const mapApiToUi = useCallback((c) => {
    const when = c?.createdAt || (c?.date && c?.time ? `${c.date} ${c.time}` : c?.date || c?.time || null);
    const [timeLabel, dateLabel] = formatDateTime(when);

    const imgRel = c?.laundryImg || c?.image || c?.avatar;
    return {
      id: String(c?.id ?? c?._id ?? Math.random()),
      subject: c?.subject || "Subject",
      message: c?.message || c?.body || "-",
      name: c?.laundryName || c?.name || "Laundry",
      address: c?.laundryAddress || c?.address || "",
      phone: c?.laundryPhone || c?.phone || "",
      email: c?.laundryEmail || c?.email || "",
      dateLabel,
      timeLabel,
      img: imgRel ? toAbsImage(imgRel) : "https://images.unsplash.com/photo-1581578731508-23341e0dd4bc?q=80&w=256",
      raw: c,
    };
  }, []);

  const loadComplaints = useCallback(async () => {
    try {
      setError("");
      if (!refreshing) setLoading(true);
      if (!token || !email) throw new Error("Missing auth/email");

      const res = await api.get(ENDPOINTS.complaints, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.complaints || payload?.content || payload?.data || [];
      if (mountedRef.current) setItems(list.map(mapApiToUi));
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data?.message || e?.message || "Failed to load complaints");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [email, token, refreshing, mapApiToUi]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      loadComplaints();
      return () => { mountedRef.current = false; };
    }, [loadComplaints])
  );

  // search/filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const has = (v) => (v || "").toString().toLowerCase().includes(q);

    switch (selectedFilter.value) {
      case "name": return items.filter((x) => has(x.name));
      case "address": return items.filter((x) => has(x.address));
      case "phone": return items.filter((x) => has(x.phone));
      case "email": return items.filter((x) => has(x.email));
      default:
        return items.filter(
          (x) => has(x.name) || has(x.address) || has(x.phone) || has(x.email) || has(x.subject) || has(x.message)
        );
    }
  }, [items, search, selectedFilter]);

  const openModal = (item) => {
    if (filterOpen) setFilterOpen(false);
    Keyboard.dismiss();
    setActiveItem(item);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setActiveItem(null);
  };

  const renderRow = ({ item }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.9} onPress={() => openModal(item)}>
      <Image source={{ uri: item.img }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{item.dateLabel}</Text>
      </View>
      <Text style={styles.time}>{item.timeLabel}</Text>
    </TouchableOpacity>
  );

  return (
    <PaperProvider>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Vector} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complaints</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search complaint..."
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
            onSelect={(opt) => { setSelectedFilter(opt); setFilterOpen(false); }}
            onRequestClose={() => setFilterOpen(false)}
            width={220}
            offsetY={8}
          />
        </View>

        <Text style={styles.section}>Your complaints</Text>

        {/* List */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={TEXT} /></View>
        ) : error ? (
          <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it) => it.id}
            renderItem={renderRow}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadComplaints(); }} />
            }
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<View style={styles.center}><Text style={{ color: MUTED }}>No complaints</Text></View>}
          />
        )}

        {/* Modal (full complaint) */}
        <Portal>
          <Modal visible={modalVisible} onDismiss={closeModal} dismissable contentContainerStyle={styles.sheet}>
            <Text style={styles.modalTitle}>{activeItem?.subject || "Complaint"}</Text>
            <View style={styles.sheetInner}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={TEXT} />
                <Text style={styles.infoText}>{activeItem?.name}</Text>
              </View>
              {!!activeItem?.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={TEXT} />
                  <Text style={styles.infoText}>{activeItem?.address}</Text>
                </View>
              )}
              {!!activeItem?.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={TEXT} />
                  <Text style={styles.infoText}>{activeItem?.phone}</Text>
                </View>
              )}
              {!!activeItem?.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color={TEXT} />
                  <Text style={styles.infoText}>{activeItem?.email}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={TEXT} />
                <Text style={styles.infoText}>
                  {activeItem?.dateLabel}  •  {activeItem?.timeLabel}
                </Text>
              </View>

              <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={TEXT} style={{ marginTop: 2 }} />
                <Text style={[styles.infoText, { flex: 1 }]}>{activeItem?.message}</Text>
              </View>

              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </Portal>
      </View>
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
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const day = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  return [time, day];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: Platform.select({ ios: 54, android: 28 }) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: TEXT },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F1F3F1", borderRadius: 14, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#D2E3D1", alignItems: "center", justifyContent: "center" },
  section: { marginTop: 16, marginBottom: 8, color: TEXT, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 10, marginRight: 10, backgroundColor: "#eee" },
  title: { color: TEXT, fontWeight: "700", fontSize: 14 },
  subtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  time: { color: MUTED, fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#B00020" },

  sheet: { marginHorizontal: 16, borderRadius: 16, backgroundColor: GREEN, padding: 20 },
  modalTitle: { fontSize: 18, marginBottom: 10, color: TEXT, fontWeight: "700" },
  sheetInner: { backgroundColor: "rgba(242,235,188,0.4)", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 6 },
  infoText: { color: TEXT, fontSize: 14, flexShrink: 1 },
  closeBtn: { alignSelf: "center", marginTop: 16, height: 42, borderRadius: 10, borderColor: "#000", borderWidth: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: TEXT, fontWeight: "700" },
});
