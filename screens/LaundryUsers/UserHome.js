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
  Platform,
  AppState,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import Vector from "../../assets/Vector.png";
import BackLogin from "../../assets/backLogin.png";
import LoaundryIMG from "../../assets/loaundrycom.png";
import SideMenuUser from "../../components/Menu/SideMenuUser";
import DropDown from "../../components/Menu/DropDown";
import { api, authGet, IMG_URL, connectUnseenCount } from "../../Services/api";
import { getAccessToken } from "../../Services/tokenStorage";
import { tokens } from "../../styles/theme";
import { useRegistration } from "../../context/RegistrationContext";

const PAGE_SIZE = 10;

const ORDERS = [
  { id: "o1", title: "Empty Orders", location: "N/A", status: "N/A", laundryImg: "" },
];

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Phone", value: "phone" },
  { label: "Services", value: "services" },
];

export default function UserHome({ navigation }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { userEmail } = useRegistration();
  const [orders, setOrders] = useState([]);
  const [laundries, setLaundries] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS[0]);
  const filterBtnRef = useRef(null);

  const [notifCount, setNotifCount] = useState(0);

  const route = useRoute();
  const routeToken = route?.params?.token ?? null;
  const [token, setToken] = useState(routeToken || null);

  const { name = "First Name", email, customerId } = route.params ?? {};
  const customerEmail = route?.params?.email || route?.params?.customerEmail || email || userEmail || "";

  const itemlength = tokens.screenconstants.cardwidth + tokens.screenconstants.cardgap;

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
      id: u?.id || u?.userId || String(Math.random()),
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
    laundryEmail: o?.laundryEmail,
  });

  const showOrders = search.trim().length === 0;

  const refreshNotifications = useCallback(async () => {
    if (!token || !customerEmail) return;
    try {
      const res = await authGet("/api/auth/unseenCount", token, {
        params: { email: customerEmail },
      });
      const payload = res?.data || {};
      setNotifCount(Number(payload?.unseen || 0));
    } catch { }
  }, [token, customerEmail]);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!routeToken) {
        const t = await getAccessToken().catch(() => null);
        if (mounted && t) setToken(t);
      }
    })();

    const sub1 = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNotifications();
    });

    async function fetchOrders() {
      if (!token || !customerEmail) return;
      try {
        const res = await authGet("/api/auth/retriveCustomerRelatedOrder", token, {
          params: { email: customerEmail },
        });
        if (!mounted) return;
        const payload = res?.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.orders || payload?.content || payload?.data || [];
        setOrders(list.map(mapApiOrderToUi));
      } catch { }
    }
    
    if (token) fetchLaundriesPage(0, false);

    fetchOrders();

    const ws = connectUnseenCount({
      email: customerEmail,
      token,
      onUpdate: (n) => setNotifCount(Number(n) || 0),
    });

    return () => {
      mounted = false;
      sub1.remove();
      ws?.close?.();
    };
  }, [routeToken, token, customerEmail, refreshNotifications]);

  const [allCache, setAllCache] = useState([]);     
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [searchPage, setSearchPage] = useState(0);  

  const dedupeById = (rows) => {
    const seen = new Set();
    const out = [];
    for (const r of rows) {
      const id = String(r.id);
      if (!seen.has(id)) { seen.add(id); out.push(r); }
    }
    return out;
  };

  const normalize = (v) => (v ?? "").toString().toLowerCase();

  const matchesFilter = (l, q, by) => {
    if (!q) return true;
    const fields = {
      name: normalize(l.name),
      address: normalize(l.address),
      phone: normalize(l.phone),
      services: normalize(Array.isArray(l.services) ? l.services.join(" ") : l.services),
    };
    if (!by || by === "") {
      return (
        fields.name.includes(q) ||
        fields.address.includes(q) ||
        fields.phone.includes(q) ||
        fields.services.includes(q)
      );
    }
    return fields[by]?.includes(q);
  };

  const fetchLaundriesPage = useCallback(
    async (pageToLoad, append) => {
      if (!token) return;
      try {
        append ? setLoadingMore(true) : setRefreshing(true);
        const res = await authGet("/api/auth/retrieveAllLaundries", token, {
          params: { page: pageToLoad, size: PAGE_SIZE },
        });

        const data = res?.data;
        const content = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data) 
            ? data.slice(pageToLoad * PAGE_SIZE, (pageToLoad + 1) * PAGE_SIZE)
            : data?.users || data?.data || [];

        const rows = content.map(mapUserToLaundry);

        setLaundries((prev) => (append ? [...prev, ...rows] : rows));
        setAllCache((prev) => dedupeById([...prev, ...rows]));

        if (typeof data?.last === "boolean") {
          setHasNext(!data.last);
        } else if (typeof data?.totalPages === "number") {
          setHasNext(pageToLoad + 1 < data.totalPages);
        } else {
          setHasNext(rows.length === PAGE_SIZE);
        }

        setPage(pageToLoad);
      } catch (e) {
        try {
          const res2 = await api.get("/api/auth/retriveLaundries", {
            params: { page: pageToLoad, size: PAGE_SIZE },
          });
          const d2 = res2?.data;
          const content2 = Array.isArray(d2?.content)
            ? d2.content
            : Array.isArray(d2)
              ? d2.slice(pageToLoad * PAGE_SIZE, (pageToLoad + 1) * PAGE_SIZE)
              : d2?.users || d2?.data || [];

          const rows = content2.map(mapUserToLaundry);
          setLaundries((prev) => (append ? [...prev, ...rows] : rows));
          setAllCache((prev) => dedupeById([...prev, ...rows]));

          if (typeof d2?.last === "boolean") {
            setHasNext(!d2.last);
          } else if (typeof d2?.totalPages === "number") {
            setHasNext(pageToLoad + 1 < d2.totalPages);
          } else {
            setHasNext(rows.length === PAGE_SIZE);
          }
          setPage(pageToLoad);
        } catch { }
      } finally {
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  const onRefresh = useCallback(() => {
    setHasNext(true);
    setSearchPage(0);
    fetchLaundriesPage(0, false);
  }, [fetchLaundriesPage]);

  const loadMoreLaundries = useCallback(() => {
    if (search.trim()) return;
    if (!hasNext || loadingMore) return;
    fetchLaundriesPage(page + 1, true);
  }, [hasNext, loadingMore, page, fetchLaundriesPage, search]);

  const ensureAllLoaded = useCallback(async () => {
    if (allLoaded || loadingAll || !token) return;
    setLoadingAll(true);
    try {
      let p = 0;
      let keepGoing = true;
      const acc = [];

      while (keepGoing) {
        const res = await authGet("/api/auth/retrieveAllLaundries", token, {
          params: { page: p, size: PAGE_SIZE },
        });
        const data = res?.data;
        const content = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
            ? data.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)
            : data?.users || data?.data || [];

        const rows = content.map(mapUserToLaundry);
        acc.push(...rows);

        if (typeof data?.last === "boolean") {
          keepGoing = !data.last;
        } else if (typeof data?.totalPages === "number") {
          keepGoing = p + 1 < data.totalPages;
        } else {
          keepGoing = rows.length === PAGE_SIZE;
        }
        p += 1;
      }

      setAllCache((prev) => dedupeById([...prev, ...acc]));
      setAllLoaded(true);
    } catch {
    } finally {
      setLoadingAll(false);
    }
  }, [token, allLoaded, loadingAll]);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchPage(0);
      return;
    }
    ensureAllLoaded();
    setSearchPage(0);
  }, [search, ensureAllLoaded]);

  useEffect(() => {
    setSearchPage(0);
  }, [selectedFilter]);

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimerRef = useRef(null);
  const isTouchingRef = useRef(false);

  const hasRealOrders = orders && orders.length > 0;
  const ordersData = hasRealOrders ? orders : ORDERS;

  const getItemLayout = (_data, index) => ({
    length: itemlength,
    offset: itemlength * index,
    index,
  });

  const startAutoplay = useCallback(() => {
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (isTouchingRef.current) return;
      const n = (currentIndex + 1) % ordersData.length;
      try {
        flatListRef.current?.scrollToIndex({ index: n, animated: true });
        setCurrentIndex(n);
      } catch {
        flatListRef.current?.scrollToOffset({ offset: n * itemlength, animated: true });
        setCurrentIndex(n);
      }
    }, 3000);
  }, [currentIndex, ordersData.length, itemlength]);

  const stopAutoplay = useCallback(() => {
    clearInterval(autoTimerRef.current);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      navigation.addListener("beforeRemove", onBackPress);
      return () => navigation.removeListener("beforeRemove", onBackPress);
    }, [navigation])
  );

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

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const q = search.trim().toLowerCase();
  const by = selectedFilter.value;

  const filteredAll = useMemo(() => {
    if (!q) return [];
    return (allCache || []).filter((l) => matchesFilter(l, q, by));
  }, [allCache, q, by]);

  const searchVisible = useMemo(() => {
    const end = (searchPage + 1) * PAGE_SIZE;
    return filteredAll.slice(0, end);
  }, [filteredAll, searchPage]);

  const searchHasNext = searchVisible.length < filteredAll.length;
  const loadMoreSearch = useCallback(() => {
    if (searchHasNext) setSearchPage((p) => p + 1);
  }, [searchHasNext]);

  const listToRender = q ? searchVisible : laundries;

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
            onPress={() => navigation.navigate("ProfileUser", { email: customerEmail, token })}
          >
            <Ionicons name="person-circle" size={28} color={tokens.colors.darkText} />
          </TouchableOpacity>
        </View>

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
            <Ionicons name="menu" style={styles.menuicon} size={28} color={tokens.colors.darkText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.srollesty, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeWrap}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome1}>Welcome to</Text>
              <Text style={styles.welcome2}>The Smart Laundry</Text>
            </View>
            <View style={styles.illustration}>
              <Image source={LoaundryIMG} width={30} height={30} />
            </View>
          </View>

          <View style={styles.searchRow}>
            <View className="searchBox" style={styles.searchBox}>
              <Ionicons name="search" size={18} color={tokens.colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Laundry..."
                placeholderTextColor={tokens.colors.placeholder}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>

            <Pressable ref={filterBtnRef} onPress={() => setFilterOpen(true)} style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color={tokens.colors.darkText} />
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
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12 }}
                getItemLayout={getItemLayout}
                initialScrollIndex={0}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => {
                  const card = (
                    <ImageBackground
                      source={item?.laundryImg ? { uri: `${IMG_URL}${item.laundryImg}` } : BackLogin}
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
                          <Ionicons name="checkmark" size={12} color={tokens.colors.darkText} />
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
                          customerId: customerId,
                          role: "CUSTOMER",
                        }),
                    }
                    : { activeOpacity: 0.9 };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      style={{ marginRight: tokens.screenconstants.cardgap }}
                      {...wrapperProps}
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

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("UserOrders", { token, email: customerEmail, name, customerId })}
          >
            <Text>Orders</Text>
          </TouchableOpacity>

          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { marginTop: 38 }]}>Laundries</Text>

            {(!q && refreshing && laundries.length === 0) ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : null}

            {(q && loadingAll && allCache.length === 0) ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : null}

            {listToRender.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.laundryRow}
                onPress={() =>
                  navigation.navigate("UserLaundry", {
                    token,
                    id: l.id,
                    customerEmail,
                  })
                }
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

            {!q && hasNext ? (
              <View style={{ paddingVertical: 16 }}>
                {loadingMore ? (
                  <ActivityIndicator />
                ) : (
                  <TouchableOpacity style={styles.loginButton} onPress={loadMoreLaundries}>
                    <Text>Load more</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {q && searchHasNext ? (
              <View style={{ paddingVertical: 16 }}>
                <TouchableOpacity style={styles.loginButton} onPress={loadMoreSearch}>
                  <Text>Load more results</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      {isMenuVisible && (
        <SideMenuUser onClose={() => setIsMenuVisible(false)} token={token} email={customerEmail} name={name} />
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
  srollesty: { marginBottom: 16 },
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

  searchRow: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 },
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

  sectionTitle: { marginTop: 16, marginBottom: 8, color: "#3C4234", fontSize: 16, fontWeight: "600" },

  orderCard: {
    width: tokens.screenconstants.cardwidth,
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  orderImg: { borderRadius: 16 },
  cardGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  orderCardBottom: { padding: 12 },
  orderTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  orderMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
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

  laundryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  laundryImg: { width: 54, height: 54, borderRadius: 12, backgroundColor: "#eee" },
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
    marginTop: 12,
  },
});
