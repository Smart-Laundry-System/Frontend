import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";
import {
  authGet,
  api,
  IMG_URL,
  createPaymentIntent,
  updateViolationStatus,
  STRIPE_DEFAULT_CURRENCY,
} from "../../../Services/api";
import BackLogin from "../../../assets/backLogin.png";
import Or from "../../../components/Button/Or";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { TOAST } from "../../../styles/theme";

const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";

const pad2 = (n) => String(n).padStart(2, "0");

const parseTimeToMinutes = (t) => {
  if (t == null) return null;
  if (Array.isArray(t)) {
    const hh = Number(t[0]);
    const mm = Number(t[1] ?? 0);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
  if (typeof t === "object") {
    const hh = Number(t.hour ?? t.hours ?? t.H ?? t.h);
    const mm = Number(t.minute ?? t.minutes ?? t.M ?? t.m ?? 0);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
  if (typeof t === "string") {
    const s = t.trim();
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
  return null;
};

const formatTimeHHmm = (t) => {
  if (t == null) return "";
  if (Array.isArray(t)) return `${pad2(t[0])}:${pad2(t[1] ?? 0)}`;
  if (typeof t === "object") {
    const hh = Number(t.hour ?? t.hours ?? t.H ?? t.h ?? 0);
    const mm = Number(t.minute ?? t.minutes ?? t.M ?? t.m ?? 0);
    return `${pad2(hh)}:${pad2(mm)}`;
  }
  if (typeof t === "string") {
    const s = t.trim();
    const m = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!m) return s;
    return `${pad2(Number(m[1]))}:${pad2(Number(m[2]))}`;
  }
  return "";
};

const minutesNowLocal = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const computeOpenStatus = (openVal, closeVal, nowMin) => {
  const o = parseTimeToMinutes(openVal);
  const c = parseTimeToMinutes(closeVal);
  if (o == null || c == null) return { isOpen: false, valid: false };
  if (o === c) return { isOpen: true, valid: true }; 
  let isOpen;
  if (o < c) isOpen = nowMin >= o && nowMin < c;
  else isOpen = nowMin >= o || nowMin < c;
  return { isOpen, valid: true };
};

const parsePriceNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => `$${n.toFixed(2)}`;
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const formatLongDateTime = (d = new Date()) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `Date: ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} | Time: ${hh}:${pad2(m)} ${ampm}`;
};

function Stars({ value = 0, size = 16, color = "#E8DF9D" }) {
  const v = Number(value) || 0;
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const names = [
    ...Array(full).fill("star"),
    ...Array(half).fill("star-half"),
    ...Array(empty).fill("star-outline"),
  ];
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {names.map((n, i) => (
        <Ionicons key={i} name={n} size={size} color={color} />
      ))}
    </View>
  );
}

function RatingSheet({ visible, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  useEffect(() => {
    if (!visible) setRating(0);
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalCenter}>
        <BlurView intensity={45} tint="dark" style={styles.blurBackdrop} />
        <Pressable style={styles.blurPressable} onPress={onClose} />
        <View style={styles.centerBoxGreen}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Ionicons
                    name={n <= rating ? "star" : "star-outline"}
                    size={40}
                    color="#E8DF9D"
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.sheetSubmit}
            onPress={() => onSubmit?.(rating)}
            activeOpacity={0.9}
          >
            <Text style={{ color: TEXT, fontWeight: "600" }}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ServicePickerModal({ visible, services, preselectId, onClose, onDone }) {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (visible) {
      if (preselectId != null) setChecked((p) => ({ ...p, [preselectId]: true }));
    } else {
      setChecked({});
    }
  }, [visible, preselectId]);

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectedIds = Object.keys(checked)
    .filter((k) => checked[k])
    .map((k) => Number(k));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalCenter}>
        <BlurView intensity={45} tint="dark" style={styles.blurBackdrop} />
        <Pressable style={styles.blurPressable} onPress={onClose} />
        <View style={styles.centerBoxWhite}>
          <Text style={styles.orderSheetTitle}>Services</Text>

          <View style={styles.serviceListCard}>
            <FlatList
              data={services}
              keyExtractor={(item, i) => String(item.id ?? i)}
              renderItem={({ item }) => (
                <View style={styles.svcRow}>
                  <View style={styles.svcAvatar}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>A</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svcTitle}>{item.title}</Text>
                    <Text style={styles.svcSub}>{item.category}</Text>
                  </View>
                  <Text style={styles.svcPriceText}>{money(item.priceNum)}</Text>
                  <Pressable onPress={() => toggle(item.id)}>
                    <Ionicons
                      name={checked[item.id] ? "checkbox" : "square-outline"}
                      size={22}
                      color={TEXT}
                    />
                  </Pressable>
                </View>
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (selectedIds.length === 0) {
                Toast.show(TOAST.errorTop("Nothing is selected", "Select one or more services"));
                return;
              }
              onDone?.(selectedIds);
            }}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>

          <Or />

          <TouchableOpacity style={styles.rateBtn} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.rateText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function OrderSummaryModal({ visible, items, onBack, onPickup, onAdvance }) {
  const { width } = useWindowDimensions();
  const isXS = width <= 360;
  const total = items.reduce((s, it) => s + it.priceNum, 0);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onBack}>
      <View style={styles.modalCenter}>
        <BlurView intensity={45} tint="dark" style={styles.blurBackdrop} />
        <Pressable style={styles.blurPressable} onPress={onBack} />
        <View style={styles.centerBoxGreen}>
          <Text style={styles.dateBar}>{formatLongDateTime()}</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>Ordered Laundry Item</Text>

            {items.map((it, idx) => (
              <View key={idx} style={[styles.summaryRow, isXS && styles.summaryRowXS]}>
                <View style={[styles.summaryLeft, isXS && styles.summaryLeftXS]}>
                  <Text
                    style={[styles.summaryItemTitle, isXS && styles.summaryItemTitleXS]}
                  >
                    {it.title}
                  </Text>
                  <Text style={styles.summaryItemSub}>
                    Per each {it.category?.toLowerCase().includes("kg") ? "kg" : "item"}
                  </Text>
                </View>

                <Text style={[styles.summaryItemPrice, isXS && styles.summaryPriceXS]}>
                  {money(it.priceNum)}
                </Text>
              </View>
            ))}

            <View style={styles.summaryDivider} />

            <View style={[styles.summaryRow, isXS && styles.summaryRowXS]}>
              <Text style={[styles.summaryTotalLabel, isXS && styles.summaryLeftXS]}>Total</Text>
              <Text style={[styles.summaryItemPrice, isXS && styles.summaryPriceXS]}>
                {money(total)}
              </Text>
            </View>

            <View style={styles.priceNote}>
              <Text style={styles.priceNoteText}>Price can be changed</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryCta} activeOpacity={0.85} onPress={onPickup}>
            <Text style={styles.primaryCtaText}>Order for Pickup</Text>
          </TouchableOpacity>

          <Or />

          <TouchableOpacity style={styles.rateBtn} activeOpacity={0.85} onPress={onAdvance}>
            <Text style={styles.rateText}>Book in Advance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PaymentModal({ visible, onClose, onConfirm }) {
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveForLater, setSaveForLater] = useState(true);

  useEffect(() => {
    if (!visible) {
      setNum("");
      setExp("");
      setCvv("");
      setSaveForLater(true);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalCenter}>
        <BlurView intensity={45} tint="dark" style={styles.blurBackdrop} />
        <Pressable style={styles.blurPressable} onPress={onClose} />
        <View style={styles.centerBoxGreen}>
          <Text style={styles.dateBar}>{formatLongDateTime()}</Text>

          <TouchableOpacity
            style={styles.primaryCta}
            activeOpacity={0.85}
            onPress={() => onConfirm?.({ num, exp, cvv, saveForLater })}
          >
            <Text style={styles.primaryCtaText}>Confirm Payment</Text>
          </TouchableOpacity>

          <Or />

          <TouchableOpacity style={styles.rateBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.rateText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ExpandableText({ text, collapsedLines = 4, textStyle, linkStyle }) {
  const [expanded, setExpanded] = useState(false);
  const [fullLineCount, setFullLineCount] = useState(0);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setFullLineCount(0);
    setMeasured(false);
  }, [text]);

  const showToggle = fullLineCount > collapsedLines;

  return (
    <View>
      {!measured ? (
        <Text
          style={[textStyle, styles.hiddenMeasure]}
          onTextLayout={(e) => {
            const lc = e?.nativeEvent?.lines?.length ?? 0;
            setFullLineCount(lc);
            setMeasured(true);
          }}
        >
          {text}
        </Text>
      ) : null}

      <Text style={textStyle} numberOfLines={expanded ? 0 : collapsedLines}>
        {text}
      </Text>

      {showToggle ? (
        <Text style={[textStyle, { marginTop: 4 }]} onPress={() => setExpanded((v) => !v)}>
          <Text style={linkStyle}>{expanded ? " See less.." : " See more.."}</Text>
        </Text>
      ) : null}
    </View>
  );
}

export default function UserLaundry({ navigation }) {
  const { params } = useRoute();
  const token = params?.token;
  const id = params?.id;
  const userEmail = params?.userEmail;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preselectSvcId, setPreselectSvcId] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const orderTypeRef = useRef("PICKUP");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const serviceListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimerRef = useRef(null);

  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!id) {
        Toast.show(
          TOAST.errorTop(
            "Missing laundry id",
            "Could not load this laundry. Please go back and try again."
          )
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const r1 = await authGet("/api/auth/laundryById", token, { params: { id } }).catch(
          () => null
        );
        const r2 =
          r1?.data || !mounted
            ? null
            : await api.get("/api/auth/laundryById", { params: { id } }).catch(() => null);

        const payload = r1?.data || r2?.data || null;

        if (!mounted) return;
        if (!payload) {
          Toast.show(
            TOAST.errorTop("Could not load laundry", "Please check your connection and try again.")
          );
        }
        setDetails(payload);
      } catch (e) {
        if (!mounted) return;
        Toast.show(TOAST.errorTop("Something went wrong", "Please try again later."));
        setDetails(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
      clearInterval(autoTimerRef.current);
    };
  }, [id, token]);
  const title = details?.name || "Laundry name";
  const ratingAvg = Number(details?.rating ?? 0.0);
  const aboutText =
    details?.about ||
    "We have redefined Laundry and Dry cleaning services.We are among the top Online Dry cleaners. We use advanced technology for Laundry and Dry cleaning to enhance and maintain beauty of your garments. Finally we are delivering you unforgettable and";
  const heroImage = details?.laundryImg ? { uri: `${IMG_URL}${details.laundryImg}` } : BackLogin;

  const services = useMemo(() => {
    const raw = details?.services;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((s, i) => {
        if (typeof s === "string") {
          const priceNum = 10;
          return {
            id: i + 1,
            title: s,
            category: "For each kg",
            price: String(priceNum),
            priceNum,
          };
        }
        const priceNum = parsePriceNum(s.price ?? s.amount ?? s.cost ?? 10);
        return {
          id: s.id ?? i + 1,
          title: s.title || s.name || s.serviceName || `Service ${i + 1}`,
          category: s.category || s.unit || "For each kg",
          price: String(priceNum),
          priceNum,
        };
      });
    }
    if (typeof raw === "string") {
      const priceNum = 10;
      return [{ id: 1, title: raw, category: "For each kg", price: String(priceNum), priceNum }];
    }
    return [];
  }, [details]);

  const servicesData = services.length
    ? services
    : [{ id: "N/A", title: "No Services", category: "For each kg", price: "N/A", priceNum: 0 }];

  useEffect(() => {
    if (!serviceListRef.current || servicesData.length < 2) return;
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % servicesData.length;
        try {
          serviceListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          serviceListRef.current?.scrollToOffset({
            offset: next * 335,
            animated: true,
          });
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(autoTimerRef.current);
  }, [servicesData.length]);

  const submitRating = async (stars) => {
    setSheetOpen(false);
    if (!Number.isFinite(stars) || stars <= 0) return;

    try {
      await api.put("/api/auth/addRating", null, {
        params: { rating: stars, id, customerEmail: userEmail },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      Toast.show(TOAST.success("Thanks!", `You rated ${stars}★`));
      try {
        const r = await authGet("/api/auth/laundryById", token, { params: { id } });
        setDetails(r.data);
      } catch {}
    } catch (err) {
      Toast.show(TOAST.errorTop("Couldn't submit rating", "Please try again."));
    }
  };

  const { statusLabel, isOpen } = useMemo(() => {
    const nowMin = minutesNowLocal();
    const { isOpen, valid } = computeOpenStatus(details?.openTime, details?.closeTime, nowMin);
    const label = valid ? (isOpen ? "Open" : "Closed") : "—";
    return { statusLabel: label, isOpen };
  }, [details?.openTime, details?.closeTime, nowTick]);

  const hoursDisplay = useMemo(() => {
    if (!details?.openTime || !details?.closeTime) return "";
    const o = formatTimeHHmm(details.openTime);
    const c = formatTimeHHmm(details.closeTime);
    return `${o} – ${c}`;
  }, [details?.openTime, details?.closeTime]);

  const openPicker = (preId = null) => {
    setPreselectSvcId(preId);
    setPickerOpen(true);
  };

  const toSummary = (ids) => {
    setSelectedIds(ids);
    const items = ids
      .map((id) => servicesData.find((s) => Number(s.id) === Number(id)))
      .filter(Boolean);
    setSelectedItems(items);
    setPickerOpen(false);
    setSummaryOpen(true);
  };

  const ORDER_ENDPOINTS = ["/api/auth/addOrder"];
  const ADD_CUSTOMER_END_POINT = "/api/auth/updateCustomer";

  const placeOrder = async () => {
    const body = {
      serviceIds: selectedIds.map((n) => Number(n)),
      customerEmail: params?.userEmail,
      id: details?.id || details?.laundryId || details?.ownerEmail,
    };

    const bodye = {
      customerEmail: params?.userEmail,
      laundryId: details?.id || details?.laundryId || details?.ownerEmail,
    };

    try {
      await api.put(ADD_CUSTOMER_END_POINT, bodye, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (e) {
      Toast.show(TOAST.errorBottom("updateCustomer error", e?.response?.status + e?.response?.data));
    }

    try {
      let ok = false,
        lastErr = null;
      for (const url of ORDER_ENDPOINTS) {
        try {
          const res = await api.post(url, body, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if ((res?.status ?? 500) < 300) {
            ok = true;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) throw lastErr || new Error("No endpoint accepted the request");

      setPayOpen(false);
      setSummaryOpen(false);
      setSelectedIds([]);
      setSelectedItems([]);
      Toast.show(
        TOAST.success(
          "Order placed",
          `Your ${orderTypeRef.current === "PICKUP" ? "pickup" : "advance"} order was created`
        )
      );
    } catch (err) {
      Toast.show(TOAST.errorTop("Couldn't create order", "Please try again."));
    }
  };

  const getOrderAmountMinor = () => {
    const total = selectedItems.reduce((s, it) => s + (Number(it.priceNum) || 0), 0);
    return Math.round(total * 100);
  };

  const startStripePayment = async () => {
    try {
      setPaymentLoading(true);

      const amountMinor = getOrderAmountMinor();
      if (amountMinor <= 0) {
        Toast.show(TOAST.errorTop("Empty services", "Please add at least one service"));
        return;
      }

      const violationIdForPay = Number(details?.violationId ?? details?.id ?? details?.laundryId);
      if (!Number.isFinite(violationIdForPay)) {
        Toast.show(TOAST.errorTop("Payment Failed", "Missing payment reference id"));
        return;
      }

      const resp = await createPaymentIntent({
        violationId: violationIdForPay,
        amountMinor,
        currency: STRIPE_DEFAULT_CURRENCY,
        description: `Order for ${title}`,
        token,
      });

      const { success, clientSecret, data, message } = resp;
      if (!success || !clientSecret) {
        Toast.show(TOAST.errorTop("Payment init failed", message || "Try again"));
        return;
      }

      const actualViolationId = Number(data?.violationId ?? violationIdForPay);
      const stripePaymentIntentId = data?.stripePaymentIntentId;

      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Smart Laundry",
        allowsDelayedPaymentMethods: false,
      });
      if (init.error) {
        Toast.show(TOAST.errorTop("PaymentSheet error", init.error.message));
        return;
      }

      const present = await presentPaymentSheet();
      if (present.error) {
        if (present.error.code !== "Canceled") {
          Toast.show(TOAST.errorTop("Payment failed", present.error.message));
        }
        return;
      }

      try {
        await updateViolationStatus({
          violationId: actualViolationId,
          status: "paid",
          paymentStatus: "paid",
          paymentDate: new Date().toISOString(),
          stripePaymentIntentId,
          token,
        });
        Toast.show(TOAST.success("payment success full", "Thank you you will got quick service"));
      } catch (e) {
        Toast.show(
          TOAST.errorTop(
            "updateViolationStatus failed:",
            e?.response?.status,
            e?.response?.data || e?.message
          )
        );
      }

      await placeOrder();
    } catch (e) {
      Toast.show(TOAST.errorTop("Payment error", e?.message || "Try again"));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator color={TEXT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
              {statusLabel}
            </Text>
            {!!hoursDisplay && <Text style={styles.hoursSmall}>{hoursDisplay}</Text>}
          </View>
        </View>

        <View style={styles.cardShadow}>
          <ImageBackground
            source={heroImage}
            style={styles.card}
            imageStyle={styles.cardImg}
            resizeMode="cover"
          >
            <FlatList
              ref={serviceListRef}
              horizontal
              pagingEnabled
              data={servicesData}
              keyExtractor={(_, i) => i.toString()}
              showsHorizontalScrollIndicator={false}
              style={styles.overlay}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => openPicker(item.id)}>
                  <BlurView intensity={60} tint="light" style={styles.serviceItem}>
                    {servicesData.length > 1 && (
                      <View style={styles.paginationWrapper}>
                        {servicesData.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.paginationDash,
                              currentIndex === index && styles.paginationDashActive,
                            ]}
                          />
                        ))}
                      </View>
                    )}

                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                      <Ionicons name="scale-outline" size={14} color={TEXT} />
                      <Text style={styles.serviceSubtitle}>  {item.category}</Text>
                    </View>
                    <Text style={styles.servicePrice}>${item.price}</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
              onScroll={(e) => {
                const index = Math.floor(
                  e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                );
                if (index !== currentIndex) setCurrentIndex(index);
              }}
            />
          </ImageBackground>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.6} onPress={() => openPicker(null)}>
          <Text style={styles.addBtnText}>Add Order</Text>
        </TouchableOpacity>

        <Or />
        <TouchableOpacity
          style={styles.rateBtn}
          activeOpacity={0.9}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={styles.rateText}>Add Your Rating</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Stars value={4} size={16} />
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: 18, paddingHorizontal: 16 }}>
          <Text style={styles.aboutTitle}>About Us</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}>
            <Stars value={ratingAvg} size={14} />
            <Text style={{ color: MUTED, fontSize: 12 }}>{ratingAvg.toFixed(1)}</Text>
          </View>

          <ExpandableText
            text={aboutText}
            collapsedLines={4}
            textStyle={styles.aboutText}
            linkStyle={styles.seeMore}
          />
        </View>
      </ScrollView>

      <RatingSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSubmit={submitRating} />

      <ServicePickerModal
        visible={pickerOpen}
        services={servicesData}
        preselectId={preselectSvcId}
        onClose={() => setPickerOpen(false)}
        onDone={(ids) => toSummary(ids)}
      />

      <OrderSummaryModal
        visible={summaryOpen}
        items={selectedItems}
        onBack={() => setSummaryOpen(false)}
        onPickup={() => {
          orderTypeRef.current = "PICKUP";
          setSummaryOpen(false);
          setPayOpen(true);
        }}
        onAdvance={() => {
          orderTypeRef.current = "ADVANCE";
          setSummaryOpen(false);
          setPayOpen(true);
        }}
      />

      <PaymentModal
        visible={payOpen}
        onClose={() => setPayOpen(false)}
        onConfirm={() => startStripePayment()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: TEXT, fontSize: 20, fontWeight: "700" },

  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "flex-end",
  },
  statusOpen: { backgroundColor: "#DFF0D8", color: "#2F6B2F" },
  statusClosed: { backgroundColor: "#F8D7DA", color: "#842029" },
  hoursSmall: { color: MUTED, fontSize: 10, marginTop: 2 },

  cardShadow: { paddingHorizontal: 16, marginTop: 12 },
  card: {
    height: 350,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cardImg: { borderRadius: 18 },

  overlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    padding: 12,
    borderRadius: 20,
    height: 100,
  },
  serviceItem: {
    width: 335,
    justifyContent: "center",
    bottom: 10,
    left: -10,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginRight: 5,
    borderRadius: 100,
    paddingLeft: 16,
    height: 100,
  },
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    right: 12,
    position: "absolute",
    marginTop: 64,
  },
  serviceTitle: { fontSize: 16, fontWeight: "600", color: "#3C4234" },
  serviceSubtitle: { fontSize: 12, fontWeight: "600", color: "#666" },
  servicePrice: {
    marginTop: 18,
    fontSize: 18,
    color: "#3C4234",
    fontWeight: "600",
    right: 12,
    position: "absolute",
  },
  paginationDash: {
    width: 4,
    height: 1,
    borderWidth: 1,
    borderColor: "#aaa",
    marginHorizontal: 1,
    opacity: 0.6,
  },
  paginationDashActive: {
    width: 16,
    borderColor: "#3C4234",
    borderWidth: 1,
    opacity: 1,
    borderRadius: 100,
  },

  addBtn: {
    width: "75%",
    height: 42,
    backgroundColor: "#A3AE95",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 35,
    alignSelf: "center",
  },
  addBtnText: { fontSize: 15, fontWeight: "bold", color: "#3C4234" },

  rateBtn: {
    width: "75%",
    height: 42,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  rateText: { color: TEXT, fontSize: 15, fontWeight: "bold" },

  aboutTitle: { color: TEXT, fontWeight: "700", fontSize: 16 },
  aboutText: { color: TEXT, marginTop: 8, lineHeight: 20 },
  seeMore: { color: GREEN, fontWeight: "700" },

  hiddenMeasure: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
    pointerEvents: "none",
  },

  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  blurPressable: {
    ...StyleSheet.absoluteFillObject,
  },

  orderBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(60,66,52,0.45)",
  },

  centerBoxGreen: {
    width: "92%",
    maxWidth: 380,
    borderRadius: 18,
    padding: 16,
    backgroundColor: GREEN,
  },

  sheetSubmit: {
    marginTop: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3C4234",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  centerBoxWhite: {
    width: "92%",
    maxWidth: 380,
    maxHeight: "80%",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#fff",
  },

  orderSheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  orderSheetTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 8,
  },
  serviceListCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: 420,
  },
  svcRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  svcAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A3AE95",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  svcTitle: { color: TEXT, fontWeight: "600" },
  svcSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  svcPriceText: { color: TEXT, fontWeight: "600", marginRight: 10 },

  summaryWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: GREEN,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  dateBar: {
    color: TEXT,
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
  },
  summaryHeading: { color: TEXT, fontWeight: "700", marginBottom: 8 },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    width: "100%",
  },

  summaryRowXS: {
    flexWrap: "wrap",
  },
  summaryLeft: {},
  summaryLeftXS: {
    flexBasis: "50%",
  },
  summaryItemTitle: { color: TEXT, fontWeight: "600" },
  summaryItemTitleXS: {
    flexShrink: 1,
  },
  summaryItemSub: { color: MUTED, fontSize: 11, marginTop: 2 },
  summaryItemPrice: { color: TEXT, fontWeight: "600" },
  summaryPriceXS: {
    flexBasis: "50%",
    textAlign: "right",
  },

  summaryDivider: {
    borderBottomColor: "#C9D0C4",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  summaryTotalLabel: { color: TEXT, fontWeight: "700" },
  priceNote: {
    alignSelf: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3C4234",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  priceNoteText: { color: "#C13030", fontSize: 12 },

  primaryCta: {
    width: "75%",
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    alignSelf: "center",
    backgroundColor: "#3C4234",
  },
  primaryCtaText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  payWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: GREEN,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  payCard: {
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 12,
    padding: 16,
  },
  payTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  inputBox: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C9D0C4",
    paddingHorizontal: 12,
    backgroundColor: "#F5F7F4",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  saveText: { color: TEXT, fontWeight: "600" },
});
