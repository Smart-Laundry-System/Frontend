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
  ScrollView, // ⬅️ added
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
    laundryImg: "",
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

// === Card layout constants for FlatList getItemLayout/autoplay ===
const CARD_WIDTH = 320;
const CARD_GAP = 12;         // marginRight we use in renderItem
const ITEM_LENGTH = CARD_WIDTH + CARD_GAP; // 332

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
    laundryEmail: o?.laundryEmail, // used for navigation
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
    } catch { }
  }, [token, userEmail]);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  useEffect(() => {
    let mounted = true;
    if (!token || !userEmail) return;

    const sub1 = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNotifications();
    });

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
        } catch { }
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
      } catch { }
    }

    async function fetchNotifications() {
      try {
        const res = await authGet("/api/auth/unseenCount", token, {
          params: { email: userEmail },
        });
        if (!mounted) return;
        const payload = res?.data;
        setNotifCount(Number(payload?.unseen || 0));
      } catch { }
    }

    fetchUsers();
    fetchOrders();
    fetchNotifications();

    const sub = connectUnseenCount({
      email: userEmail,
      token,
      onUpdate: (n) => setNotifCount(Number(n) || 0),
    });

    return () => {
      sub1.remove();
      mounted = false;
      sub?.close?.();
    };
  }, [token, userEmail, refreshNotifications]);

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

  // ========= FlatList autoplay (auto movement) =========
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimerRef = useRef(null);
  const isTouchingRef = useRef(false);

  const hasRealOrders = orders && orders.length > 0;
  const ordersData = hasRealOrders ? orders : ORDERS;

  const getItemLayout = (_data, index) => ({
    length: ITEM_LENGTH,
    offset: ITEM_LENGTH * index,
    index,
  });

  const startAutoplay = useCallback(() => {
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (isTouchingRef.current) return; // don't advance while user is interacting
      const next = (currentIndex + 1) % ordersData.length;
      try {
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        setCurrentIndex(next);
      } catch {
        // fallback if initial layout not ready
        flatListRef.current?.scrollToOffset({
          offset: next * ITEM_LENGTH,
          animated: true,
        });
        setCurrentIndex(next);
      }
    }, 3000); // 3s per card (tweak as you like)
  }, [currentIndex, ordersData.length]);

  const stopAutoplay = useCallback(() => {
    clearInterval(autoTimerRef.current);
  }, []);

  // restart autoplay whenever data length changes or index updates
  useEffect(() => {
    if (!showOrders || ordersData.length <= 1) {
      stopAutoplay();
      return;
    }
    startAutoplay();
    return () => stopAutoplay();
  }, [showOrders, ordersData.length, currentIndex, startAutoplay, stopAutoplay]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const vi = viewableItems[0].index ?? 0;
      setCurrentIndex(vi);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // ========= Render =========
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
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

        {/* put the whole content in a vertical scroller to prevent overlap */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }} // ⬅️ added
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

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

          {/* Orders carousel */}
          {showOrders && (
            <>
              <Text style={styles.sectionTitle}>Your orders</Text>
              <FlatList
                ref={flatListRef}
                data={ordersData}
                keyExtractor={(it) => String(it.id)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12 }} // ⬅️ added bottom space
                getItemLayout={getItemLayout}
                initialScrollIndex={0}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => {
                  const card = (
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
                  );

                  const wrapperProps = hasRealOrders
                    ? {
                      onPress: () =>
                        navigation.navigate("OrderDetails", {
                          token,
                          orderId: item.id,
                          laundryEmail: item.laundryEmail,
                          role: "CUSTOMER",
                        }),
                    }
                    : { activeOpacity: 0.9 };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      style={{ marginRight: CARD_GAP }}
                      {...wrapperProps}
                      // pause autoplay while touching
                      onPressIn={() => {
                        isTouchingRef.current = true;
                        stopAutoplay();
                      }}
                      onPressOut={() => {
                        isTouchingRef.current = false;
                        startAutoplay();
                      }}
                    >
                      {card}
                    </TouchableOpacity>
                  );
                }}
                // also pause while dragging/swiping
                onScrollBeginDrag={() => {
                  isTouchingRef.current = true;
                  stopAutoplay();
                }}
                onScrollEndDrag={() => {
                  isTouchingRef.current = false;
                  startAutoplay();
                }}
              />
            </>
          )}

          {/* Orders button (now with normal spacing so it won't overlap) */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("UserOrders", { token, email, name })}
          >
            <Text>Orders</Text>
          </TouchableOpacity>

          {/* Laundries */}
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { marginTop: 38 }]}>Laundries</Text>
            {filteredLaundries.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.laundryRow}
                onPress={() => {
                  navigation.navigate("UserLaundry", {
                    token,
                    id: l.id,
                    userEmail
                  });
                }}
              >
                <Image
                  source={l?.laundryImg ? { uri: `${IMG_URL}${l.laundryImg}` } : BackLogin}
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
        </ScrollView>
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
  notificationWrapper: { position: "absolute", zIndex: 100 },
  badge: {
    // position: "relative",
    zIndex: 100,
    top: 34,
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
    top: 20,
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
    width: CARD_WIDTH, // 320
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

  loginButton: {
    width: "75%",
    height: 42,
    backgroundColor: "#A3AE95",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12, // ⬅️ changed (replaces old negative margin)
  },
});
