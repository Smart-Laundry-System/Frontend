// UserHome.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ImageBackground,
  Pressable,
  SafeAreaView,
  Platform,
  AppState,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import Vector from "../../assets/Vector.png";
import BackLogin from "../../assets/backLogin.png";
import LoaundryIMG from "../../assets/loaundrycom.png";
import SideMenuUser from "../../components/Menu/SideMenuUser";
import DropDown from "../../components/Menu/DropDown";

import { api, authGet, IMG_URL, connectUnseenCount } from "../../Services/api";

const ORDERS = [
  {
    id: "o1",
    title: "Empty Orders",
    location: "N/A",
    status: "N/A",
    img: {
      uri: "https://images.unsplash.com/photo-1563225409-127c299532d7?q=80&w=1200",
    },
  },
];

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Services", value: "services" },
];

const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";
const SURFACE = "#f8f8f8";

export default function UserHome({ navigation }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);

  const [notifCount, setNotifCount] = useState(0);
  const [laundries, setLaundries] = useState([]);

  const route = useRoute();
  const { name = "First Name", email, token } = route.params ?? {};
  const userEmail = route?.params?.email || route?.params?.userEmail || email || "";

  const mapUserToLaundry = (u) => {
    const fullName =
      u?.name ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
      u?.fullName ||
      "Laundry";
    const address =
      u?.address ||
      u?.location ||
      u?.place ||
      (u?.addressObj
        ? [u.addressObj?.line1, u.addressObj?.city].filter(Boolean).join(", ")
        : "Location");
    const phone = u?.phone || u?.phoneNumber || "";
    const services = Array.isArray(u?.services)
      ? u.services
      : (u?.services || "")
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const imgPath = u?.laundryImg || u?.image || "";

    return {
      id: u?.id || u?.userId || u?.email || String(Math.random()),
      name: fullName,
      address,
      phone,
      services,
      rating: Number(u?.rating ?? 4.3),
      laundryImg: imgPath,
    };
  };

  const mapApiOrderToUi = (o) => ({
    id: o?.id?.toString?.() || o?.ord_id?.toString?.() || String(Math.random()),
    title: o?.laundryName || "Shop name",
    location: o?.laundryAddress || o?.address || "Location",
    status: o?.status || "Booked for Laundry",
    laundryImg: o?.laundryImg || "",
  });

  const showOrders = search.trim().length === 0;

  const refreshNotifications = useCallback(async () => {
    if (!token || !userEmail) return;
    try {
      const res = await authGet("/api/auth/unseenCount", token, {
        params: { email: userEmail },
      });
      const payload = res?.data || {};
      setNotifCount(Number(payload?.unseen || 0));
    } catch {}
  }, [token, userEmail]);

  useEffect(() => {
    let mounted = true;
    if (!token) return;

    async function fetchUsers() {
      try {
        const res = await authGet("/api/auth/retriveLaundries", token);
        if (!mounted) return;
        const payload = res?.data;
        const rawList = Array.isArray(payload)
          ? payload
          : payload?.users || payload?.content || payload?.data || [];
        setLaundries(rawList.map(mapUserToLaundry));
      } catch {
        try {
          const res2 = await api.get("/api/auth/retriveLaundries");
          if (!mounted) return;
          const p2 = res2?.data;
          const raw2 = Array.isArray(p2)
            ? p2
            : p2?.users || p2?.content || p2?.data || [];
          setLaundries(raw2.map(mapUserToLaundry));
        } catch {}
      }
    }

    async function fetchOrders() {
      try {
        const res = await authGet("/api/auth/retriveCustomerRelatedOrder", token, {
          params: { email: userEmail },
        });
        if (!mounted) return;
        const payload = res?.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.orders || payload?.content || payload?.data || [];
        setOrders(list.map(mapApiOrderToUi));
      } catch {}
    }

    async function fetchNotifications() {
      try {
        const res = await authGet("/api/auth/unseenCount", token, {
          params: { email: userEmail },
        });
        if (!mounted) return;
        const payload = res?.data;
        setNotifCount(Number(payload?.unseen || 0));
      } catch {}
    }

    fetchUsers();
    fetchOrders();
    fetchNotifications();
    return () => {
      mounted = false;
    };
  }, [token, userEmail]);

  // Live SSE (with polling fallback). This is the bit that makes the badge update in real time.
  useEffect(() => {
    if (!token || !userEmail) return;
    const sub = connectUnseenCount({
      email: userEmail,
      token,
      onUpdate: (n) => setNotifCount(Number(n) || 0),
      // pollEveryMs: 12000, // optional tweak
    });
    return () => sub?.close?.();
  }, [token, userEmail]);

  // Keep your existing focus/app-resume refreshes (nice as a safety net)
  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNotifications();
    });
    return () => sub.remove();
  }, [refreshNotifications]);

  const filteredLaundries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return laundries;

    switch (selectedFilter.value) {
      case "address":
        return laundries.filter((l) => (l.address || "").toLowerCase().includes(q));
      case "phone":
        return laundries.filter((l) => (l.phone || "").toLowerCase().includes(q));
      case "services":
        return laundries.filter((l) =>
          (l.services || []).join(" ").toLowerCase().includes(q)
        );
      case "name":
      default:
        return laundries.filter((l) => (l.name || "").toLowerCase().includes(q));
    }
  }, [laundries, search, selectedFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Left hamburger with tiny ringed badge */}
        <View>
          <TouchableOpacity
            style={styles.notificationWrapper}
            onPress={() => setIsMenuVisible(true)}
          >
            {notifCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount}</Text>
              </View>
            ) : null}
            <Ionicons name="menu" style={styles.menuicon} size={28} color={TEXT} />
          </TouchableOpacity>
        </View>

        {/* Top row: back + centered name + profile */}
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

        {/* Welcome */}
        <View style={styles.welcomeWrap}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome1}>Welcome to</Text>
            <Text style={styles.welcome2}>The Smart Laundry</Text>
          </View>
          <View style={styles.illustration}>
            <Image source={LoaundryIMG} width={30} height={30} />
          </View>
        </View>

        {/* Search + filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Laundry..."
              placeholderTextColor={MUTED}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>

          <Pressable
            ref={filterBtnRef}
            onPress={() => setFilterOpen(true)}
            style={styles.filterBtn}
          >
            <Ionicons name="options-outline" size={20} color={TEXT} />
          </Pressable>

          <DropDown
            visible={filterOpen}
            anchorRef={filterBtnRef}
            options={FILTER_OPTIONS}
            onSelect={(opt) => setSelectedFilter(opt)}
            onRequestClose={() => setFilterOpen(false)}
            width={220}
            offsetY={8}
          />
        </View>

        {/* Orders */}
        {showOrders && (
          <>
            <Text style={styles.sectionTitle}>Your orders</Text>
            <FlatList
              data={orders && orders.length ? orders : ORDERS}
              keyExtractor={(it) => it.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} style={{ marginRight: 12 }}>
                  <ImageBackground
                    source={
                      item?.laundryImg
                        ? { uri: `${IMG_URL}${item.laundryImg}` }
                        : BackLogin
                    }
                    imageStyle={styles.orderImg}
                    style={styles.orderCard}
                    resizeMode="cover"
                  >
                    <View style={styles.cardGlass} />
                    <View style={styles.orderCardBottom}>
                      <Text style={styles.orderTitle}>{item.title}</Text>
                      <View style={styles.orderMetaRow}>
                        <Ionicons name="location-outline" size={14} color="#fff" />
                        <Text style={styles.orderMeta}>{item.location}</Text>
                      </View>

                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{item.status}</Text>
                        <Ionicons name="checkmark" size={12} color={TEXT} />
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("UserOrders", { token, email, name })}
        >
          <Text>Orders</Text>
        </TouchableOpacity>

        {/* Laundries */}
        <View style={{ marginBottom: -18 }}>
          <Text style={[styles.sectionTitle, { marginTop: 38 }]}>Laundries</Text>
          {filteredLaundries.map((l) => (
            <TouchableOpacity key={l.id} style={styles.laundryRow}>
              <Image
                source={
                  l?.laundryImg ? { uri: `${IMG_URL}${l.laundryImg}` } : BackLogin
                }
                style={styles.laundryImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.laundryName}>{l.name}</Text>
                <Text style={styles.laundryLoc}>{l.address}</Text>
              </View>
              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={14} />
                <Text style={styles.ratingText}>{Number(l.rating).toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 64 }} />
      </View>

      {isMenuVisible && (
        <SideMenuUser onClose={() => setIsMenuVisible(false)} token={token} email={email} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 4, android: 8 }),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9000,
  },
  notificationWrapper: { position: "absolute" },
  badge: {
    position: "relative",
    zIndex: 100,
    top: 54,
    right: -13,
    backgroundColor: "#f2ebbc",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    borderColor: "red",
    borderWidth: 2,
  },
  badgeText: { fontSize: 12, marginTop: 2 },
  menuicon: {
    color: "#3C4234",
    top: 40,
    backgroundColor: "#a3ae95",
    paddingRight: 10,
    paddingLeft: 30,
    marginLeft: -35,
    borderRadius: 20,
  },
  profileBtn: { padding: 2, borderRadius: 16 },
  greeting: { fontSize: 18, color: "#3C4234", fontWeight: "600" },

  welcomeWrap: { marginTop: 75, flexDirection: "row", alignItems: "center" },
  welcome1: { fontSize: 22, color: "#3C4234", fontWeight: "700" },
  welcome2: { fontSize: 22, color: "#3C4234", fontWeight: "700" },
  illustration: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F1",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, color: "#3C4234", paddingVertical: 0 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#A3AE95",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: "#3C4234",
    fontSize: 16,
    fontWeight: "600",
  },

  orderCard: {
    width: 320,
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  orderImg: { borderRadius: 16 },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  orderCardBottom: { padding: 12 },
  orderTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  orderMeta: { color: "#fff", fontSize: 12 },
  statusPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#E6ECE1",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusPillText: { color: "#3C4234", fontSize: 12, fontWeight: "600" },

  laundryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  laundryImg: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  laundryName: { color: "#3C4234", fontSize: 14, fontWeight: "600" },
  laundryLoc: { color: "#98A29D", fontSize: 12, marginTop: 2 },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, color: "#3C4234" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: "#C6CEBB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  loginButton: {
    width: "75%",
    height: 42,
    backgroundColor: "#A3AE95",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: -15,
  },
});
