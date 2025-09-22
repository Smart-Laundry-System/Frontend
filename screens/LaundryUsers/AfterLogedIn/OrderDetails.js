// screens/orders/OrderDetails.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable, // <-- added
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { api, IMG_URL } from "../../../Services/api";
import Vector from "../../../assets/Vector.png";
import UserComplainModel from "../../../components/Notification/UserComplainModel";

/* ----------------------------- design tokens ----------------------------- */
const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";
const RED = "#B00020";
const BLACK = "#000";
const BLACKOP = "rgba(0,0,0,0.35)";
const YELLOW = "#D4A017";
const WHITE = "#fff";
const WHITEBIRGE = "#E6ECE1";
const STATUSBOX = "#F2F2F0";
const STATUSBOXAC = "#C8D2C1";
const BORDERBOT = "#EFEFE8";
const PLACE_IMG =
  "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1200";

const STATUS_COLORS = {
  PICKUP: "#C6CEBB",
  WASHING: "#CDE8CF",
  ON_THE_WAY: "#CDE8CF",
  REACHED: "#CDE8CF",
  DEFAULT: "#CDE8CF",
};

/* -------------------------------- endpoints ------------------------------- */
const ENDPOINTS = {
  orderById: "/api/auth/retriveOrderById",
  servicesByIds: "/api/auth/retriveServiceById",
  requestEstimatedDate: "/api/auth/order/requestEstimatedDate",
};

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, orderId, email } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingRequestDate, setPendingRequestDate] = useState(null);

  const [expandedAbout, setExpandedAbout] = useState(false);
  const [aboutOverflows, setAboutOverflows] = useState(false);

  const [modalVisiblec, setModalVisiblec] = useState(false);

  const [showServicesSheet, setShowServicesSheet] = useState(false);

  const toast = {
    ok: (t1, t2) =>
      Toast.show({
        type: "success",
        text1: t1,
        text2: t2,
        position: "top",
        visibilityTime: 1800,
      }),
    err: (t1, t2) =>
      Toast.show({
        type: "error",
        text1: t1,
        text2: t2,
        position: "top",
        visibilityTime: 2200,
      }),
  };

  const toAbs = (rel) => {
    if (!rel) return PLACE_IMG;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  // ---- helpers ----
  const isValidDateVal = (d) => {
    if (!d) return false;
    const dt = d instanceof Date ? d : new Date(d);
    return !isNaN(dt.getTime());
  };

  const fmtDate = (d) => {
    if (!isValidDateVal(d)) return "—";
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Normalize API → UI (requestDate → customerInterestDate)
  const mapToUi = (o) => ({
    id: String(o?.id ?? orderId),
    serviceIds: Array.isArray(o?.serviceIds) ? o.serviceIds : [],
    customerName: o?.laundryName || "Laundry name",
    laundryAddress: o?.laundryAddress || "Location",
    laundryImg: o?.laundryImg || "",
    totPrice: Number(o?.totPrice ?? 0),
    status: (o?.status || "PICKUP").toString(),
    estimatedDate: o?.estimatedCompletedDate || o?.estimatedDate || null,
    customerInterestDate: o?.requestDate || o?.customerInterestDate || null,
    aboutLaundry: o?.aboutLaundry || "", // fallback
  });

  const buildIdsParams = (key, arr) => {
    const p = new URLSearchParams();
    (arr || []).forEach((v) => p.append(key, v));
    return p.toString();
  };

  const fetchOrder = useCallback(async () => {
    if (!token || !orderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(ENDPOINTS.orderById, {
        params: { orderID: orderId },
        headers: authHeader,
      });
      const o =
        Array.isArray(res?.data) && res.data.length ? res.data[0] : res?.data;
      if (!o) throw new Error("Order not found");

      const mapped = mapToUi(o);
      setOrder(mapped);
      console.log(mapped);
      // reset any unstaged selection when fresh data loads
      setPendingRequestDate(null);

      if (mapped.serviceIds.length) {
        const qs = buildIdsParams("ids", mapped.serviceIds);
        const url = `${ENDPOINTS.servicesByIds}?${qs}`;
        const sres = await api.get(url, { headers: authHeader });
        setServices(Array.isArray(sres?.data) ? sres.data : []);
      } else {
        setServices([]);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load order";
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, token, authHeader]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const statusIndex = useMemo(() => {
    const s = (order?.status || "").toUpperCase();
    if (s.includes("REACHED")) return 3;
    if (s.includes("ON") || s.includes("WAY")) return 2;
    if (s.includes("WASH")) return 1;
    return 0; // PICKUP
  }, [order?.status]);

  const pillBg = useMemo(() => {
    const key = (order?.status || "DEFAULT").toUpperCase();
    return STATUS_COLORS[key] || STATUS_COLORS.DEFAULT;
  }, [order?.status]);

  const priceLabel =
    Number.isFinite(order?.totPrice) && order.totPrice > 0
      ? `$${order.totPrice.toFixed(2)}`
      : "$0.00";

  const serviceNames = useMemo(
    () => (Array.isArray(services) ? services : [])
      .map(s => s?.title ?? s?.name ?? String(s?.id ?? "")),
    [services]
  );

  const shown = serviceNames.slice(0, 2);            // now an array of strings
  const hasMore = serviceNames.length > 2;

  const servicesTitle =
    shown.length ? `${shown.join(", ")}${hasMore ? "…" : ""}` : "Ordered Service";

  /* ------------------------ date picking & confirm ------------------------ */
  const onOpenPicker = () => setShowDatePicker(true);

  // only store locally; do NOT call API here
  const onDatePicked = async (_, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate) return;
    setPendingRequestDate(selectedDate);
    if (Platform.OS === "ios") setShowDatePicker(false);
  };

  // customer date confirmation for picked date
  const onConfirmRequest = async () => {
    if (!order?.id || !pendingRequestDate) return;
    try {
      setBusy(true);
      await api.put(ENDPOINTS.requestEstimatedDate, null, {
        params: {
          orderID: order.id,
          date: pendingRequestDate.toISOString(),
        },
        headers: authHeader,
      });
      toast.ok("Smart Laundry", "Requested estimated date sent.");
      await fetchOrder();
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Update failed";
      toast.err("Smart Laundry", msg);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------- loading/empty UI ---------------------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
        <Toast />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: RED, marginBottom: 8 }}>
            {error || "Order not found"}
          </Text>
        </View>
        <Toast />
      </SafeAreaView>
    );
  }

  // date to show in the field: preview pending → request date → estimated date
  const hasRequest = isValidDateVal(order.customerInterestDate);
  const displayDate =
    pendingRequestDate ||
    (hasRequest
      ? new Date(order.customerInterestDate)
      : isValidDateVal(order.estimatedDate)
        ? new Date(order.estimatedDate)
        : null);

  /* ---------------------------------- UI ---------------------------------- */
  return (
    <PaperProvider>
      <SafeAreaView style={styles.safe}>
        {/* Press anywhere outside About to collapse it */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (expandedAbout) setExpandedAbout(false);
          }}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image source={Vector} />
              </TouchableOpacity>

              {/* Confirm Request: enabled only when a date was requsted with customer via update button */}
              <TouchableOpacity
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: pillBg,
                    opacity: pendingRequestDate && !busy ? 1 : 0.5,
                  },
                ]}
                onPress={onConfirmRequest}
                disabled={!pendingRequestDate || busy}
              >
                <Text style={styles.badgePillText}>Confirm Request</Text>
              </TouchableOpacity>
            </View>

            {/* Laundry name */}
            <Text style={styles.title}>{order.customerName}</Text>

            {/* Top pard card with laundry image */}
            <ImageBackground
              source={{ uri: toAbs(order.laundryImg) }}
              style={styles.banner}
              imageStyle={styles.bannerImg}
              resizeMode="cover"
            >
              <View style={styles.glass}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>{servicesTitle}</Text>

                  <View style={styles.addrRow}>
                    <Ionicons name="location-outline" size={14} color={TEXT} />
                    <Text style={styles.addrText}>{order.laundryAddress}</Text>
                  </View>
                </View>

                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>{priceLabel}</Text>
                </View>

                <TouchableOpacity style={styles.moreBtn} onPress={() => setShowServicesSheet(true)}>
                  {/* <View > */}
                  <Ionicons name="ellipsis-horizontal" size={16} color={BLACK} />
                  {/* </View> */}
                </TouchableOpacity>
              </View>
            </ImageBackground>

            {/* Status customer only can view */}
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusRow}>
              <StatusBox label="Pick up" icon="hand-left" active={statusIndex >= 0} />
              <StatusConnector />
              <StatusBox label="Washing" icon="shirt" active={statusIndex >= 1} />
              <StatusConnector />
              <StatusBox label="On the way" icon="car" active={statusIndex >= 2} />
              <StatusConnector />
              <StatusBox label="Reached" icon="home" active={statusIndex >= 3} />
            </View>

            {/* Total price*/}
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, { fontWeight: "700" }]}>Total:</Text>
              <Text style={[styles.sumValue, { opacity: 0.7 }]}>{priceLabel}</Text>
            </View>

            {/* Title switches based on having a request date */}
            <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
              {hasRequest ? "Requested Completed Date" : "Estimated Completed Date"}
            </Text>

            {/* Date for customer request */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
              }}
            >
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={styles.dateBox} activeOpacity={1}>
                  <Text style={styles.dateText}>{fmtDate(displayDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: 12 }} />

              <TouchableOpacity
                style={[styles.updateBtn, busy && { opacity: 0.6 }]}
                onPress={onOpenPicker}
                disabled={busy}
              >
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.updateHint}>
              {hasRequest
                ? `Your Estimated Completed Date is ${fmtDate(order.estimatedDate)}`
                : "Before update check the notification"}
            </Text>

            {/* About the laundry */}
            <View style={styles.aboutHeaderRow}>
              <Text style={styles.sectionTitle}>About {order.customerName}</Text>
            </View>

            {/* Rating part */}
            <View style={styles.aboutRow}>
              <Ionicons name="star" size={14} color={YELLOW} />
              <Text style={styles.aboutRating}> 4.3</Text>
            </View>

            {/* See more with about part */}
            <View
              onStartShouldSetResponder={() => true}
              style={{ marginTop: 6 }}
            >
              <Text
                style={styles.aboutText}
                numberOfLines={expandedAbout ? undefined : 3}
                onTextLayout={(e) => {
                  if (!expandedAbout) {
                    const lines = e?.nativeEvent?.lines || [];
                    // show "See more" only if we have more than 3 lines
                    setAboutOverflows(lines.length > 3);
                  }
                }}
              >
                {order.aboutLaundry || "—"}
              </Text>

              {!expandedAbout && aboutOverflows && (
                <TouchableOpacity
                  onPress={() => setExpandedAbout(true)}
                  style={styles.seeMoreBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeMoreText}>See more</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setModalVisiblec(true)}
              >
                <Text style={styles.secondaryBtnText}>Complain</Text>
              </TouchableOpacity>
            </View>

            <UserComplainModel
              visible={modalVisiblec}
              email={email}
              onClose={() => setModalVisiblec(false)}
              token={token}
            // laundrtId={id}
            />
          </ScrollView>
        </Pressable>

        <Portal>
          {/* Date picker */}
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            dismissable
            contentContainerStyle={styles.datePickerSheet}
          >
            <DateTimePicker
              value={
                pendingRequestDate
                  ? pendingRequestDate
                  : hasRequest
                    ? new Date(order.customerInterestDate)
                    : isValidDateVal(order.estimatedDate)
                      ? new Date(order.estimatedDate)
                      : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDatePicked}
              minimumDate={new Date()}
              style={{ backgroundColor: WHITE, borderRadius: 10 }}
            />
          </Modal>
          <Modal
            visible={showServicesSheet}
            onDismiss={() => setShowServicesSheet(false)}
            dismissable
            contentContainerStyle={styles.servicesSheet}
          >
            <Text style={styles.sheetTitle}>Services</Text>
            {services.length ? (
              services.map((s) => (
                <View key={s.id} style={styles.serviceRow}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>
                    {s.title || s.name || `#${s.id}`}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {typeof s.price === "string"
                      ? s.price
                      : `$${Number(s.price || 0).toFixed(2)}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: MUTED }}>No services</Text>
            )}

            <TouchableOpacity style={styles.assignBack} onPress={() => setShowServicesSheet(false)}>
              <Text style={styles.assignBackText}>Close</Text>
            </TouchableOpacity>
          </Modal>
        </Portal>
      </SafeAreaView>
      <Toast />
    </PaperProvider>
  );
}

/* ------------------------------- status parts ------------------------------- */
function StatusBox({ label, icon, active }) {
  return (
    <View style={[styles.statusBox, active && styles.statusBoxActive]}>
      <Ionicons
        name={icon}
        size={18}
        color={active ? BLACK : BLACKOP}   // was {BLACK}/{BLACKOP}
      />
      <Text style={[styles.statusLabel, active && { color: BLACK }]}>
        {label}
      </Text>
    </View>
  );
}

function StatusConnector() {
  return <View style={styles.connector} />;
}

/* --------------------------------- styles --------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  container: { flex: 1, backgroundColor: WHITE, paddingHorizontal: 16 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgePillText: { color: TEXT, fontWeight: "700" },

  title: { marginTop: 10, fontSize: 24, color: TEXT, fontWeight: "800" },

  banner: { marginTop: 12, height: 220, borderRadius: 16, overflow: "hidden" },
  bannerImg: { borderRadius: 16 },
  glass: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: { color: TEXT, fontSize: 16, fontWeight: "700" },
  addrRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  addrText: { color: MUTED, fontSize: 12 },
  pricePill: {
    marginLeft: "auto",
    backgroundColor: WHITEBIRGE,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceText: { color: TEXT, fontWeight: "700" },
  moreBtn: {
    marginLeft: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BORDERBOT,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },

  statusRow: { flexDirection: "row", alignItems: "center" },
  statusBox: {
    width: 64,
    height: 64,
    backgroundColor: STATUSBOX,   // was {STATUSBOX}
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  statusBoxActive: {
    backgroundColor: STATUSBOXAC,
  },
  statusLabel: {
    marginTop: 6,
    fontSize: 10,
    color: BLACKOP,    
    fontWeight: "600",
  },
  connector: {
    width: 22,
    height: 2,
    backgroundColor: "#B9C1AF",
    marginHorizontal: 6,
  },

  dateBox: {
    borderWidth: 1,
    borderColor: "#E8E8E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: WHITE,
  },
  dateText: { color: TEXT, fontWeight: "700" },

  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 6,
  },
  sumLabel: { color: MUTED },
  sumValue: { color: TEXT, fontWeight: "700" },

  updateBtn: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: TEXT,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBtnText: { color: TEXT, fontWeight: "700" },
  updateHint: {
    marginTop: 6,
    color: "#D64D55",
    fontSize: 12,
    marginLeft: 4,
  },

  aboutHeaderRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aboutRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  aboutRating: { color: TEXT, fontWeight: "700", marginLeft: 4 },

  secondaryBtn: {
    width: "75%",
    height: 42,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  secondaryBtnText: { color: TEXT, fontWeight: "700" },

  aboutText: {
    marginTop: 6,
    color: TEXT,
    lineHeight: 18,
  },

  seeMoreBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: STATUSBOX,
  },
  seeMoreText: { color: TEXT, fontWeight: "700" },
  servicesSheet: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: WHITE,
    padding: 16,
  },
  sheetTitle: { color: TEXT, fontWeight: "800", marginBottom: 12 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDERBOT,
  },
  serviceTitle: { color: TEXT, flex: 1, marginRight: 10 },
  servicePrice: { color: TEXT, fontWeight: "700" },
  assignBack: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  assignBackText: { color: TEXT, fontWeight: "700" },

  datePickerSheet: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
