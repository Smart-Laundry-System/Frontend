// screens/items/LaundryItems.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api, IMG_URL } from "../../../Services/api";
import Vector from "../../../assets/Vector.png";
import BackLogin from "../../../assets/backLogin.png";

const TEXT = "#3C4234";
const MUTED = "#98A29D";
const BG = "#FFFFFF";
const GREEN = "#A3AE95";

const ENDPOINTS = {
  items: "/api/auth/retrieveLaundryItems", // expects ?email=... (laundry)
};

export default function LaundryItems() {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route?.params?.token ?? "";
  const email = route?.params?.email ?? ""; // laundry email (owner)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]); // ["Service 1","Service 2",...]
  const [selectedCat, setSelectedCat] = useState(null);
  const [items, setItems] = useState([]);

  const toAbs = (rel) => {
    if (!rel) return null;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  const mapItem = (it) => ({
    id: String(it?.id ?? Math.random()),
    name: it?.title || it?.name || "Item",
    unit: it?.unit || it?.category || "Per each item",
    price: Number(it?.price ?? 0),
    img: toAbs(it?.image || it?.laundryImg) || null,
    category: it?.category || it?.service || "Service 1",
  });

  const loadItems = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      if (!token || !email) throw new Error("Missing auth/email");
      const res = await api.get(ENDPOINTS.items, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
      const ui = list.map(mapItem);
      setItems(ui);
      const cats = [...new Set(ui.map((x) => x.category))];
      setCategories(cats);
      setSelectedCat(cats[0] || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [token, email]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = items;
    if (selectedCat) arr = arr.filter((x) => (x.category || "") === selectedCat);
    if (!q) return arr;
    return arr.filter((x) => (x.name || "").toLowerCase().includes(q));
  }, [items, search, selectedCat]);

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <ImageBackground
        source={item.img ? { uri: item.img } : BackLogin}
        style={styles.cardImg}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        resizeMode="cover"
      />
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>{item.unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ImageBackground source={Vector} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laundry Items</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditLaundryItems", { token, email })}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search item..."
            placeholderTextColor={MUTED}
            style={styles.input}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categories Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingHorizontal: 8, paddingBottom: 10 }}
        style={{ marginTop: 12 }}
      >
        {categories.map((c) => {
          const active = c === selectedCat;
          return (
            <TouchableOpacity key={c} onPress={() => setSelectedCat(c)}>
              <Text style={[styles.tab, active && styles.tabActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={TEXT} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={{ color: "#B00020" }}>{error}</Text></View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(it) => it.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 6, gap: 14 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: Platform.select({ ios: 54, android: 28 }) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: TEXT },
  editBtn: { backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editText: { color: "#fff", fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F1F3F1", borderRadius: 14, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, color: TEXT, fontSize: 14 },
  tab: { fontSize: 16, color: MUTED, fontWeight: "700" },
  tabActive: { color: "#9AA37F", textDecorationLine: "underline", textDecorationStyle: "solid" },

  card: { flex: 1, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImg: { width: "100%", height: 130 },
  cardBottom: { paddingVertical: 10, paddingHorizontal: 10 },
  cardTitle: { color: TEXT, fontWeight: "700" },
  cardSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
