// screens/orders/CustomerOrder.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Image,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { api, IMG_URL } from "../../../Services/api";
import Vector from "../../../assets/Vector.png";

// ---- design tokens ----
const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";
const CARD_BG = "#FFFBEA";
const PLACE_IMG =
  "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1200";

// Distinct pill colors per status (tweak to taste)
const STATUS_COLORS = {
  PICKUP: "#C6CEBB",
  WASHING: "#CDE8CF",    // amber-ish
  ON_THE_WAY: "#CDE8CF", // light blue
  REACHED: "#CDE8CF",    // soft green
  DEFAULT: "#CDE8CF",
};

// ---- endpoints ----
const ENDPOINTS = {
  orderById: "/api/auth/retriveOrderById",         // GET ?orderID=<id>
  servicesByIds: "/api/auth/retriveServiceById",   // GET ?ids=1&ids=2
  updateStatus: "/api/auth/updateStatus",          // PUT ?orderID=&status=
  acceptDate: "/api/auth/order/acceptNewDate",     // POST ?orderID=
  rejectDate: "/api/auth/order/rejectNewDate",     // POST ?orderID=
  updateEstimatedDate: "/api/auth/order/updateEstimatedDate", // PUT ?orderID=&date=ISO
};

export default function CustomerOrder() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, orderId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [services, setServices] = useState([]); // [{id,title,price,category}]
  const [busyAction, setBusyAction] = useState(false);

  // UI extras
  const [showServicesSheet, setShowServicesSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // treat null/undefined/""/invalid as "no proposed date"
  const hasCustomerInterest = useMemo(() => {
    const v = order?.customerInterestDate;
    if (v === null || v === undefined) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    const dt = new Date(v);
    return !isNaN(dt.getTime());
  }, [order?.customerInterestDate]);

  // ---- helpers ----
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const toast = {
    ok: (text1, text2) =>
      Toast.show({
        type: "success",
        text1,
        text2,
        position: "top",
        visibilityTime: 2000,
      }),
    err: (text1, text2) =>
      Toast.show({
        type: "error",
        text1,
        text2,
        position: "top",
        visibilityTime: 2000,
      }),
  };

  const toAbs = (rel) => {
    if (!rel) return PLACE_IMG;
    const base = (IMG_URL || "").replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? "" : "/"}${rel}`;
  };

  const mapToUi = (o) => ({
    id: String(o?.id ?? orderId),
    serviceIds: Array.isArray(o?.serviceIds) ? o.serviceIds : [],
    customerEmail: o?.customerEmail || "",
    customerName: o?.customerName || "First + last name",
    customerPhone: o?.customerPhone || "",
    customerAddress: o?.customerAddress || "",
    laundryEmail: o?.laundryEmail || "",
    laundryName: o?.laundryName || "Laundry",
    laundryAddress: o?.laundryAddress || "Location",
    laundryImg: o?.laundryImg || "",
    totPrice: Number(o?.totPrice ?? 0),
    status: (o?.status || "PICKUP").toString(),
    paymentMethod: o?.paymentMethod || "By card",
    estimatedDate: o?.estimatedCompletedDate || o?.estimatedDate || null,
    customerInterestDate: o?.customerInterestDate || o?.proposedDate || null,
  });

  // build ?ids=1&ids=2 for Spring List<Long>
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

      if (mapped.serviceIds.length) {
        const qs = buildIdsParams("ids", mapped.serviceIds);
        const url = `${ENDPOINTS.servicesByIds}?${qs}`;
        const sres = await api.get(url, { headers: authHeader });
        setServices(Array.isArray(sres?.data) ? sres.data : []);
      } else {
        setServices([]);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load order";
      setError(msg);
      setOrder(null);
      toast.err("Smart Laundry", msg);
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
    if (s.includes("ON") || s.includes("WAY")) return 2; // ON_THE_WAY
    if (s.includes("WASH")) return 1;
    return 0; // PICKUP
  }, [order?.status]);

  const isPickup = (order?.status || "").toUpperCase() === "PICKUP";

  const pillBg = useMemo(() => {
    const key = (order?.status || "DEFAULT").toUpperCase();
    return STATUS_COLORS[key] || STATUS_COLORS.DEFAULT;
  }, [order?.status]);

  const priceLabel =
    Number.isFinite(order?.totPrice) && order.totPrice > 0
      ? `$${order.totPrice.toFixed(2)}`
      : "$0.00";

  const servicesLabel = useMemo(() => {
    if (!services.length) return "—";
    return services.map((s) => s.title || s.name || s.id).join(", ");
  }, [services]);

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const actOnDate = async (kind /* 'accept' | 'reject' */) => {
    if (!order?.id) return;
    const endpoint = kind === "accept" ? ENDPOINTS.acceptDate : ENDPOINTS.rejectDate;
    try {
      setBusyAction(true);
      await api.post(endpoint, null, {
        params: { orderID: order.id },
        headers: authHeader,
      });
      toast.ok(
        "Welcome to Smart Laundry",
        kind === "accept" ? "Date accepted." : "Date rejected and sent back to laundry."
      );
      fetchOrder();
    } catch (e) {
      toast.err("Smart Laundry", e?.response?.data?.message || e?.message || "Action failed");
    } finally {
      setBusyAction(false);
    }
  };

  const onAdvanceStatus = async (next) => {
    if (!order?.id) return;
    try {
      setBusyAction(true);
      await api.put(ENDPOINTS.updateStatus, null, {
        params: { orderID: order.id, status: next },
        headers: authHeader,
      });
      await fetchOrder();
    } catch (e) {
      toast.err("Smart Laundry", e?.response?.data?.message || e?.message || "Could not update status");
    } finally {
      setBusyAction(false);
    }
  };

  const onPickEstimatedDate = () => {
    // Only allow opening when status is PICKUP
    if (isPickup) setShowDatePicker(true);
  };

  // Top pill pressed: ONLY active/clickable when PICKUP
  const onPressPickupBadge = async () => {
    if (!order?.id || !isPickup) return; // guard

    if (order?.estimatedDate) {
      // Already has date -> just ensure status stays PICKUP (no calendar)
      try {
        setBusyAction(true);
        await api.put(ENDPOINTS.updateStatus, null, {
          params: { orderID: order.id, status: "PICKUP" },
          headers: authHeader,
        });
        await fetchOrder();
        toast.ok("Welcome to Smart Laundry", "Pickup set for selected date");
      } catch (e) {
        toast.err("Smart Laundry", e?.response?.data?.message || e?.message || "Could not set PICKUP");
      } finally {
        setBusyAction(false);
      }
    } else {
      // No date yet -> open calendar
      setShowDatePicker(true);
    }
  };

  const onDatePicked = async (_, selectedDate) => {
    // Android dialog auto-dismisses; iOS uses modal wrapper with backdrop
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate || !order?.id) return;

    try {
      setBusyAction(true);

      // 1) update estimated date
      await api.put(ENDPOINTS.updateEstimatedDate, null, {
        params: {
          orderID: order.id,
          date: selectedDate.toISOString(),
        },
        headers: authHeader,
      });

      // 2) ensure status is PICKUP
      await api.put(ENDPOINTS.updateStatus, null, {
        params: { orderID: order.id, status: "PICKUP" },
        headers: authHeader,
      });

      await fetchOrder();
      toast.ok("Welcome to Smart Laundry", "Pickup scheduled and date updated");

      if (Platform.OS === "ios") setShowDatePicker(false);
    } catch (e) {
      toast.err("Smart Laundry", e?.response?.data?.message || e?.message || "Could not update date");
    } finally {
      setBusyAction(false);
    }
  };

  // ---- loading / empty ----
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

  // ---- UI ----
  return (
    <PaperProvider>
      <SafeAreaView style={styles.safe}>
        {/* SCROLL VIEW */}
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={Vector} />
            </TouchableOpacity>

            {/* Clickable ONLY when PICKUP */}
            <TouchableOpacity
              style={[styles.badgePill, { backgroundColor: pillBg }, !isPickup && styles.badgeDisabled]}
              onPress={onPressPickupBadge}
              activeOpacity={isPickup ? 0.8 : 1}
              disabled={!isPickup}
            >
              <Text style={styles.badgePillText}>
                {order.status.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          </View>

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
                <Text style={styles.bannerTitle}>Services</Text>
                <View style={styles.addrRow}>
                  <Ionicons name="location-outline" size={14} color={TEXT} />
                  <Text style={styles.addrText}>{order.laundryAddress}</Text>
                </View>
              </View>

              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{priceLabel}</Text>
              </View>

              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => setShowServicesSheet(true)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Status */}
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <StatusBox
              label="Pick up"
              icon="hand-left"
              active={statusIndex >= 0}
              onPress={() => onAdvanceStatus("PICKUP")}
            />
            <StatusConnector />
            <StatusBox
              label="Washing"
              icon="shirt"
              active={statusIndex >= 1}
              onPress={() => onAdvanceStatus("WASHING")}
            />
            <StatusConnector />
            <StatusBox
              label="On the way"
              icon="car"
              active={statusIndex >= 2}
              onPress={() => onAdvanceStatus("ON_THE_WAY")}
            />
            <StatusConnector />
            <StatusBox
              label="Reached"
              icon="home"
              active={statusIndex >= 3}
              onPress={() => onAdvanceStatus("REACHED")}
            />

            <TouchableOpacity
              onPress={() => setAssignOpen(true)}
              style={styles.addBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Estimated Completed Date */}
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            Estimated Completed Date
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallUpper}>Estimated date</Text>
              <TouchableOpacity
                style={[
                  styles.dateBox,
                  isPickup
                    ? order?.estimatedDate && { backgroundColor: "#E6ECE1", borderColor: "#C8D2C1" }
                    : styles.dateBoxDisabled,
                  busyAction && { opacity: 0.7 },
                ]}
                onPress={onPickEstimatedDate}
                disabled={!isPickup}
                activeOpacity={isPickup ? 0.8 : 1}
              >
                <Text style={[styles.dateText, !isPickup && { opacity: 0.5 }]}>
                  {fmtDate(order.estimatedDate)}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={isPickup ? TEXT : "rgba(60,66,52,0.4)"}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{ width: 1, backgroundColor: "#E8E8E0", height: 38, marginHorizontal: 10 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.smallUpper}>Customer interest</Text>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{fmtDate(order.customerInterestDate)}</Text>
              </View>
            </View>
          </View>

          {/* Payment + Total */}
          <Text style={styles.payNote}>(By card)</Text>
          <View style={styles.sumRow}>
            <Text style={[styles.sumLabel, { fontWeight: "700" }]}>Total:</Text>
            <Text style={[styles.sumValue, { opacity: 0.7 }]}>{priceLabel}</Text>
          </View>

          {hasCustomerInterest && (
            <>
              <TouchableOpacity
                style={[styles.primaryAction, busyAction && { opacity: 0.6 }]}
                onPress={() => actOnDate("accept")}
                disabled={busyAction}
              >
                <Text style={styles.primaryActionText}>Accept the new date</Text>
              </TouchableOpacity>

              <View style={styles.orLine}>
                <View style={styles.hr} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.hr} />
              </View>

              <TouchableOpacity
                style={[styles.secondaryAction, busyAction && { opacity: 0.6 }]}
                onPress={() => actOnDate("reject")}
                disabled={busyAction}
              >
                <Text style={styles.secondaryActionText}>Reject the new date</Text>
              </TouchableOpacity>
            </>)}
          {/* Order Summary */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Order Summary</Text>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Services</Text>
            <Text style={styles.sumValue} numberOfLines={1}>
              {servicesLabel}
            </Text>
          </View>

          {/* Customer Bio */}
          <View style={styles.bioCard}>
            <Text style={styles.bioTitle}>Customer Bio</Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.input}
                value={order.customerEmail}
                editable={false}
                placeholder="Email"
                placeholderTextColor={MUTED}
              />
            </View>

            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.input}
                value={order.customerPhone}
                editable={false}
                placeholder="Phone"
                placeholderTextColor={MUTED}
              />
            </View>

            <Text style={styles.label}>Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.input}
                value={order.customerAddress}
                editable={false}
                placeholder="Address"
                placeholderTextColor={MUTED}
              />
            </View>
          </View>
        </ScrollView>

        {/* Modals */}
        <Portal>
          {/* Assign employee modal */}
          <Modal
            visible={assignOpen}
            onDismiss={() => setAssignOpen(false)}
            dismissable
            contentContainerStyle={styles.assignSheet}
          >
            <Text style={styles.assignTitle}>Assign employee to customer</Text>
            <TouchableOpacity
              style={styles.assignPrimary}
              onPress={() => {
                setAssignOpen(false);
                toast.ok("Welcome to Smart Laundry", "Open your assign-employee flow here.");
              }}
            >
              <Text style={styles.assignPrimaryText}>Assign an Employee</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.assignBack} onPress={() => setAssignOpen(false)}>
              <Text style={styles.assignBackText}>Back</Text>
            </TouchableOpacity>
          </Modal>

          {/* Services sheet */}
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

          {/* Date picker modal with backdrop (only shown when isPickup triggers it) */}
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            dismissable
            contentContainerStyle={styles.datePickerSheet}
          >
            <DateTimePicker
              value={order.estimatedDate ? new Date(order.estimatedDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDatePicked}
              minimumDate={new Date()}
              style={{ backgroundColor: "#fff", borderRadius: 10 }}
            />
          </Modal>
        </Portal>
      </SafeAreaView>

      {/* Local Toast host (remove if already at app root) */}
      <Toast />
    </PaperProvider>
  );
}

/* --- small parts --- */
function StatusBox({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statusBox, active && styles.statusBoxActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={18} color={active ? "#000" : "rgba(0,0,0,0.35)"} />
      <Text style={[styles.statusLabel, active && { color: "#000" }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function StatusConnector() {
  return <View style={styles.connector} />;
}

/* --- styles --- */
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
  badgeDisabled: {
    opacity: 0.6,
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

  sectionTitle: { marginTop: 16, marginBottom: 8, color: TEXT, fontSize: 16, fontWeight: "700" },

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
  statusBoxActive: { backgroundColor: "#C8D2C1" }, // ACTIVE COLOR
  statusLabel: { marginTop: 6, fontSize: 10, color: "rgba(0,0,0,0.35)", fontWeight: "600" },
  connector: { width: 22, height: 2, backgroundColor: "#B9C1AF", marginHorizontal: 6 },
  addBtn: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E6ECE1",
    alignItems: "center",
    justifyContent: "center",
  },

  smallUpper: { color: MUTED, fontSize: 10, textTransform: "uppercase", marginBottom: 6 },
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
  dateBoxDisabled: {
    backgroundColor: "#F5F5F2",
    borderColor: "#E3E3DD",
  },
  dateText: { color: TEXT, fontWeight: "700" },

  payNote: { color: "#D64D55", fontSize: 12, marginTop: 8, marginBottom: 6 },

  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  sumLabel: { color: MUTED },
  sumValue: { color: TEXT, fontWeight: "700" },

  primaryAction: {
    height: 42,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryActionText: { color: "#fff", fontWeight: "700" },

  orLine: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  orText: { color: MUTED, marginHorizontal: 8 },
  hr: { flex: 1, height: 1, backgroundColor: "#E8E8E0" },

  secondaryAction: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: { color: TEXT, fontWeight: "700" },

  bioCard: {
    marginTop: 16,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    ...shadow(8),
  },
  bioTitle: { color: TEXT, fontWeight: "800", marginBottom: 8 },
  label: { marginTop: 8, marginBottom: 4, color: MUTED, fontSize: 12, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: "#E8E8E0",
  },
  input: { flex: 1, color: "#3C4234", paddingVertical: 0 },

  assignSheet: { marginHorizontal: 16, borderRadius: 16, backgroundColor: "#A3AE95", padding: 20 },
  assignTitle: { color: TEXT, fontWeight: "700", marginBottom: 10 },
  assignPrimary: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E6ECE1",
    alignItems: "center",
    justifyContent: "center",
  },
  assignPrimaryText: { color: TEXT, fontWeight: "700" },
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
    backgroundColor: "#fff", // white card
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  servicesSheet: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  sheetTitle: { color: TEXT, fontWeight: "800", marginBottom: 12 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFE8",
  },
  serviceTitle: { color: TEXT, flex: 1, marginRight: 10 },
  servicePrice: { color: TEXT, fontWeight: "700" },

  primaryBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});

function shadow(depth = 6) {
  if (Platform.OS === "android") return { elevation: depth };
  return {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: depth,
    shadowOffset: { width: 0, height: Math.ceil(depth / 2) },
  };
}
