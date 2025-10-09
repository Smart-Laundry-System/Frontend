import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Pressable, ActivityIndicator,
  Modal, ScrollView
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import DropDown from "../../../components/Menu/DropDown";
import { api } from "../../../Services/api";
import { useRegistration } from "../../../context/RegistrationContext";
import { getAccessToken } from "../../../Services/tokenStorage";

const PAGE_SIZE = 10;

const FILTERS = [
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
];

const AVATAR_COLORS = ["#444", "#666", "#a3ae95", "#555", "#3C4234", "#A3AE95"];
const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map(p => (p[0] || "").toUpperCase()).join("") || "U";
const colorFor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function Employees({ navigation }) {
  const { laundryId } = useRegistration();
  const route = useRoute();

  const [token, setToken] = useState(route?.params?.token || null);
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

  const id = route?.params?.id || laundryId || "";
  const refreshKey = route?.params?.refresh;

  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(FILTERS[0]);
  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const mapRow = (e, idx) => ({
    id: e?.id?.toString?.() ?? `${idx}`,
    name: e?.name || [e?.firstName, e?.lastName].filter(Boolean).join(" ") || e?.email || "Employee",
    address: e?.address || "",
    phone: e?.phone || "",
    email: e?.email || "",
    role: (e?.role || "").toString(),
    serviceIds: Array.isArray(e?.serviceIds) ? e.serviceIds : [],
  });

  const fetchPage = useCallback(async (pageToLoad, append) => {
    if (!id || !token) return;
    try {
      append ? setLoading(true) : setRefreshing(true);

      const res = await api.get(
        `/api/auth/laundries/${id}/allEmployees`,
        {
          params: { page: pageToLoad, size: PAGE_SIZE },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const content = Array.isArray(res?.data?.content) ? res.data.content : [];
      const last = res?.data?.last === true;
      const rows = content.map(mapRow);

      setList(prev => (append ? [...prev, ...rows] : rows));
      setHasNext(!last);
      setPage(pageToLoad);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load employees",
        text2: e?.response?.data || e?.message || "Network error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => { fetchPage(0, false); }, [fetchPage, refreshKey])
  );

  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;
    fetchPage(page + 1, true);
  }, [hasNext, loading, page, fetchPage]);

  const onRefresh = useCallback(() => {
    setHasNext(true);
    fetchPage(0, false);
  }, [fetchPage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    const by = filter.value;
    return list.filter((e) => {
      const field = by === "address" ? e.address : by === "phone" ? e.phone : by === "email" ? e.email : e.name;
      return (field || "").toLowerCase().includes(q);
    });
  }, [list, search, filter]);

  const openDetails = useCallback((emp) => {
    setSelected(emp);
    setDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelected(null);
  }, []);

  const renderRow = ({ item }) => (
    <TouchableOpacity onPress={() => openDetails(item)} activeOpacity={0.85}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colorFor(item.name) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.email || "—"}  •  {item.phone || "—"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#98A29D" />
      </View>
    </TouchableOpacity>
  );

  const Footer = () => {
    if (!hasNext || search.trim()) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        {loading ? (
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#3C4234" />
        </TouchableOpacity>
        <Text style={styles.h1}>Employees</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddEmployee", { token, laundryId: id })}>
          <Ionicons name="add" size={24} color="#3C4234" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#98A29D" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor="#98A29D"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Pressable ref={filterBtnRef} style={styles.filterBtn} onPress={() => setOpenFilter(true)}>
          <Ionicons name="options-outline" size={20} color="#3C4234" />
        </Pressable>

        <DropDown
          visible={openFilter}
          anchorRef={filterBtnRef}
          options={FILTERS}
          onSelect={(opt) => setFilter(opt)}
          onRequestClose={() => setOpenFilter(false)}
          width={220}
          offsetY={8}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderRow}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={Footer}
        removeClippedSubviews
        initialNumToRender={10}
      />

      <Modal
        visible={detailsOpen}
        animationType="slide"
        transparent
        onRequestClose={closeDetails}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Employee details</Text>
              <TouchableOpacity onPress={closeDetails}>
                <Ionicons name="close" size={22} color="#3C4234" />
              </TouchableOpacity>
            </View>

            {selected ? (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 12 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalTopRow}>
                  <View style={[styles.avatarLg, { backgroundColor: colorFor(selected.name) }]}>
                    <Text style={styles.avatarLgText}>{getInitials(selected.name)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.empTitle}>{selected.name}</Text>
                    <View style={styles.rolePill}>
                      <Ionicons name="briefcase-outline" size={13} color="#3C4234" />
                      <Text style={styles.rolePillText}>
                        {(selected.role || "").toString().replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.fieldRow}>
                    <Ionicons name="mail-outline" size={18} color="#98A29D" />
                    <Text style={styles.fieldValue}>{selected.email || "—"}</Text>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View style={styles.fieldRow}>
                    <Ionicons name="call-outline" size={18} color="#98A29D" />
                    <Text style={styles.fieldValue}>{selected.phone || "—"}</Text>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <View style={styles.fieldRow}>
                    <Ionicons name="location-outline" size={18} color="#98A29D" />
                    <Text style={styles.fieldValue}>{selected.address || "—"}</Text>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Service IDs</Text>
                  {Array.isArray(selected.serviceIds) && selected.serviceIds.length ? (
                    <View style={styles.chipsWrap}>
                      {selected.serviceIds.map((sid) => (
                        <View key={String(sid)} style={styles.chip}>
                          <Text style={styles.chipText}>#{sid}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.fieldValue, { opacity: 0.6 }]}>No services</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={closeDetails}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 24 }}>
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: { fontSize: 24, color: "#3C4234", fontWeight: "800" },

  searchRow: {
    marginTop: 16, flexDirection: "row", alignItems: "center",
    gap: 12, paddingHorizontal: 16,
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#F1F3F1", borderRadius: 14,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: "#3C4234", paddingVertical: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#A3AE95", alignItems: "center", justifyContent: "center",
  },

  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  name: { color: "#3C4234", fontSize: 14, fontWeight: "600" },
  meta: { color: "#98A29D", fontSize: 12, marginTop: 2 },

  loadMoreBtn: {
    alignSelf: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, backgroundColor: "#A3AE95",
  },
  loadMoreText: { color: "#fff", fontWeight: "700" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { color: "#3C4234", fontSize: 18, fontWeight: "800" },

  modalTopRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 12 },
  avatarLg: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  avatarLgText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empTitle: { color: "#3C4234", fontSize: 18, fontWeight: "800" },
  rolePill: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E6ECE1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rolePillText: { color: "#3C4234", fontWeight: "700", fontSize: 12 },

  fieldBlock: { marginTop: 10 },
  fieldLabel: { color: "#98A29D", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E0",
    paddingHorizontal: 10,
    minHeight: 42,
  },
  fieldValue: { color: "#3C4234", fontSize: 14, flexShrink: 1 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#F1F3F1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAE6",
  },
  chipText: { color: "#3C4234", fontWeight: "700", fontSize: 12 },

  closeBtn: {
    marginTop: 16,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#3C4234",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#3C4234", fontWeight: "700" },
});
