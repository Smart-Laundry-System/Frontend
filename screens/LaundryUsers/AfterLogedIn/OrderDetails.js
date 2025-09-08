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
const CARD_BG = "#FFFBEA";
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
  orderById: "/api/auth/retriveOrderById", // GET ?orderID=
  servicesByIds: "/api/auth/retriveServiceById", // GET ?ids=1&ids=2
  requestEstimatedDate: "/api/auth/order/requestEstimatedDate", // PUT ?orderID=&date=
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

  // UI: picker modal + locally chosen (not yet submitted) date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingRequestDate, setPendingRequestDate] = useState(null);

  // About section controls
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [aboutOverflows, setAboutOverflows] = useState(false);

  const [modalVisiblec, setModalVisiblec] = useState(false);

  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

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

  const servicesLabel = useMemo(() => {
    if (!services.length) return "Ordered Service";
    return services.map((s) => s.title || s.name || s.id).join(", ");
  }, [services]);

  /* ------------------------ date picking & confirm ------------------------ */
  const onOpenPicker = () => setShowDatePicker(true);

  // only store locally; do NOT call API here
  const onDatePicked = async (_, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate) return;
    setPendingRequestDate(selectedDate);
    if (Platform.OS === "ios") setShowDatePicker(false);
  };

  // confirm request -> call server with picked date
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
          <Text style={{ color: "#B00020", marginBottom: 8 }}>
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
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image source={Vector} />
              </TouchableOpacity>

              {/* Confirm Request: enabled only when a date was chosen via Update */}
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

            {/* Title: Laundry name */}
            <Text style={styles.title}>{order.customerName}</Text>

            {/* Banner card */}
            <ImageBackground
              source={{ uri: toAbs(order.laundryImg) }}
              style={styles.banner}
              imageStyle={styles.bannerImg}
              resizeMode="cover"
            >
              <View style={styles.glass}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>{servicesLabel}</Text>
                  <View style={styles.addrRow}>
                    <Ionicons name="location-outline" size={14} color={TEXT} />
                    <Text style={styles.addrText}>{order.laundryAddress}</Text>
                  </View>
                </View>

                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>{priceLabel}</Text>
                </View>

                <View style={styles.moreBtn}>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#000" />
                </View>
              </View>
            </ImageBackground>

            {/* Status (read-only) */}
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

            {/* Total */}
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, { fontWeight: "700" }]}>Total:</Text>
              <Text style={[styles.sumValue, { opacity: 0.7 }]}>{priceLabel}</Text>
            </View>

            {/* Title switches based on having a request date */}
            <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
              {hasRequest ? "Requested Completed Date" : "Estimated Completed Date"}
            </Text>

            {/* Date + Update button */}
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

            {/* About + Complain in one line */}
            <View style={styles.aboutHeaderRow}>
              <Text style={styles.sectionTitle}>About Us</Text>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setModalVisiblec(true)}
              >
                <Text style={styles.secondaryBtnText}>Complain</Text>
              </TouchableOpacity>
            </View>

            {/* Rating (optional) */}
            <View style={styles.aboutRow}>
              <Ionicons name="star" size={14} color="#D4A017" />
              <Text style={styles.aboutRating}> 4.3</Text>
            </View>

            {/* ABOUT TEXT + SEE MORE */}
            {/* Capture touches so outside-press doesn't collapse when tapping inside */}
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

            {/* Complaint modal */}
            <UserComplainModel
              visible={modalVisiblec}
              email={email}
              onClose={() => setModalVisiblec(false)}
              token={token}
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
              style={{ backgroundColor: "#fff", borderRadius: 10 }}
            />
          </Modal>
        </Portal>
      </SafeAreaView>
      <Toast />
    </PaperProvider>
  );
}

/* ------------------------------- small parts ------------------------------- */
function StatusBox({ label, icon, active }) {
  return (
    <View style={[styles.statusBox, active && styles.statusBoxActive]}>
      <Ionicons
        name={icon}
        size={18}
        color={active ? "#000" : "rgba(0,0,0,0.35)"}
      />
      <Text style={[styles.statusLabel, active && { color: "#000" }]}>
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
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },

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
    backgroundColor: "#ffffffd0",
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
    backgroundColor: "#E6ECE1",
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
    backgroundColor: "#00000010",
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
    backgroundColor: "#F2F2F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  statusBoxActive: { backgroundColor: "#C8D2C1" },
  statusLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "rgba(0,0,0,0.35)",
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
    backgroundColor: "#fff",
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
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: TEXT,
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
    backgroundColor: "#F2F2F0",
  },
  seeMoreText: { color: TEXT, fontWeight: "700" },

  datePickerSheet: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
