// screens/profile/ProfileUser.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";

// ✅ use the shared axios instance and authGet
import { authGet, api } from "../../../Services/api";

// paper modal
import { Provider as PaperProvider, Portal, Modal } from "react-native-paper";

const GREEN = "#A3AE95";
const TEXT = "#3C4234";
const MUTED = "#98A29D";
const CARD_BG = "#FFFBEA";

/** --- Layout constants --- */
const SCREEN_W = Dimensions.get("window").width;
const H_PAD = 16;
const VIEW_W = SCREEN_W - H_PAD * 2;
const GAP = 12;
const PEEK = 24;
const ITEM_W = VIEW_W - PEEK;
const AUTOSCROLL_MS = 3000;
const MAX_HEIGHT_CAP = 220;

export default function ProfileUser() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, token } = route.params || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisiblenext, setModalVisiblenext] = useState(false);

  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(170);
  const [index, setIndex] = useState(0);

  const listRef = useRef(null);
  const autoRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "First Name + Last Name",
    email: "abcd@gmail.com",
    phone: "075 021 3273",
    address: "Location",
  });

  // ===== Forgot/Reset password state =====
  const [fpEmail, setFpEmail] = useState("");
  const [rpEmail, setRpEmail] = useState("");
  const [rpOtp, setRpOtp] = useState("");
  const [rpPass, setRpPass] = useState("");
  const [rpConfirm, setRpConfirm] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const profileBanners = useMemo(
    () => [
      require("../../../assets/startimage.png"),
      require("../../../assets/backReg.png"),
      require("../../../assets/backLogin.png"),
    ],
    []
  );

  // ✅ send OTP (same path as Login)
  const sendemail = async () => {
    if (!fpEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "Email is required",
        position: "top",
      });
      return;
    }
    try {
      setIsSendingOtp(true);
      const res = await api.post("/auth/v1/forgotPassword", {
        email: fpEmail.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Smart Laundry",
        text2: String(res?.data || "OTP sent successfully"),
        position: "top",
        visibilityTime: 2000,
      });
      // Prefill for reset flow
      setRpEmail(fpEmail.trim());
      setModalVisible(false);
      setModalVisiblenext(true);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: e?.response?.data || e?.message || "Failed to send OTP",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ✅ reset password (use /auth/v1/resetPassword directly here)
  const onResetPassword = async () => {
    if (!rpEmail.trim() || !rpOtp.trim() || !rpPass.trim() || !rpConfirm.trim()) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "All fields are required",
        position: "top",
      });
      return;
    }
    if (rpPass !== rpConfirm) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "Passwords do not match",
        position: "top",
      });
      return;
    }
    try {
      setIsResetting(true);
      const res = await api.put("/auth/v1/resetPassword", {
        userName: rpEmail.trim(),
        otp: rpOtp.trim(),
        password: rpPass,
      });
      Toast.show({
        type: "success",
        text1: "Smart Laundry",
        text2: String(res?.data || "Password updated"),
        position: "top",
        visibilityTime: 2000,
      });
      setModalVisiblenext(false);
      setRpEmail("");
      setRpOtp("");
      setRpPass("");
      setRpConfirm("");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: e?.response?.data || e?.message || "Password update failed",
        position: "top",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const profileBannersData = useMemo(
    () => profileBanners.map((src, i) => ({ id: String(i + 1), src })),
    [profileBanners]
  );

  // fetch profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authGet(
          `/api/auth/retriveUser?laundryEmail=${email}`,
          token
        );
        if (!mounted) return;
        const u = res?.data || {};
        const name =
          u?.name ||
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          "User";
        setProfile({
          name,
          email: u?.email || "",
          phone: u?.phone || "",
          address: u?.address || "",
        });
      } catch {
        if (mounted) Alert.alert("Profile", "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, email]);

  // compute tallest scaled height
  useEffect(() => {
    let maxH = 0;
    for (const src of profileBanners) {
      const { width, height } = Image.resolveAssetSource(src);
      if (!width || !height) continue;
      const scale = ITEM_W / width;
      const scaled = height * scale;
      if (scaled > maxH) maxH = scaled;
    }
    setHeight(Math.min(maxH || 170, MAX_HEIGHT_CAP));
  }, [profileBanners]);

  // auto-advance
  useEffect(() => {
    if (!profileBannersData.length) return;
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % profileBannersData.length;
        listRef.current?.scrollToOffset({
          offset: next * (ITEM_W + GAP),
          animated: true,
        });
        return next;
      });
    }, AUTOSCROLL_MS);
    return () => autoRef.current && clearInterval(autoRef.current);
  }, [profileBannersData.length]);

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (ITEM_W + GAP));
    setIndex(i);
  };

  const initial = useMemo(() => {
    const t = (profile.name || "").trim();
    return t ? t.charAt(0).toUpperCase() : "A";
  }, [profile.name]);

  const avatarBg = useMemo(() => {
    const palette = ["#A3AE95", "#8BA0A7", "#A89BB5", "#B1A58B", "#8FAF8A"];
    let h = 0;
    for (let i = 0; i < (profile.name || "").length; i++)
      h = (h * 31 + profile.name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }, [profile.name]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={26} color={TEXT} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("EditProfile", { token })}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>Hi {profile.name}</Text>

          {/* Carousel */}
          <View
            style={[
              styles.carouselWrap,
              { width: VIEW_W, alignSelf: "center", overflow: "hidden" },
            ]}
          >
            <FlatList
              ref={listRef}
              data={profileBannersData}
              keyExtractor={(it) => it.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_W + GAP}
              decelerationRate="fast"
              onMomentumScrollEnd={onMomentumEnd}
              contentContainerStyle={{ paddingHorizontal: 0 }}
              ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
              ListFooterComponent={<View style={{ width: PEEK }} />}
              renderItem={({ item }) => (
                <View style={[styles.slideContainer, { width: ITEM_W, height }]}>
                  <ImageBackground
                    source={item.src}
                    style={StyleSheet.absoluteFill}
                    imageStyle={styles.bannerImg}
                    resizeMode="cover"
                  />
                </View>
              )}
            />

            {/* Dots */}
            <View style={styles.dotsRow}>
              {profileBannersData.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.input}
                value={profile.email}
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
                value={profile.phone}
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
                value={profile.address}
                editable={false}
                placeholder="Address"
                placeholderTextColor={MUTED}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setFpEmail(profile.email || "");
                  setModalVisible(true);
                }}
              >
                <Text style={styles.primaryBtnText}>Update the password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate("Complain", { token })}
              >
                <Text style={styles.secondaryBtnText}>Complain</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- PAPER MODALS --- */}
          <Portal>
            <Modal
              visible={modalVisible}
              onDismiss={() => setModalVisible(false)}
              dismissable
              contentContainerStyle={styles.sheet}
            >
              <Text style={styles.modalTitle}>Enter your registered email</Text>
              <View style={styles.sheetInner}>
                <View style={styles.innerfield}>
                  <TextInput
                    style={styles.inputin}
                    placeholder="Email"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={fpEmail}
                    onChangeText={setFpEmail}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.send, { opacity: isSendingOtp ? 0.6 : 1 }]}
                  onPress={sendemail}
                  disabled={isSendingOtp}
                >
                  <Text style={styles.loginButtonText}>
                    {isSendingOtp ? "Sending…" : "Send"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </Portal>

          <Portal>
            <Modal
              visible={modalVisiblenext}
              onDismiss={() => setModalVisiblenext(false)}
              dismissable
              contentContainerStyle={styles.sheetLarge}
            >
              <Text style={styles.modalTitle}>Enter your registered email</Text>
              <View style={styles.sheetInner}>
                <View style={styles.innerfieldall}>
                  <TextInput
                    style={styles.inputin}
                    placeholder="Email"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={rpEmail}
                    onChangeText={setRpEmail}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="OTP"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={rpOtp}
                    onChangeText={setRpOtp}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="New Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={rpPass}
                    onChangeText={setRpPass}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={rpConfirm}
                    onChangeText={setRpConfirm}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.send, { opacity: isResetting ? 0.6 : 1, marginTop: 24 }]}
                  onPress={onResetPassword}
                  disabled={isResetting}
                >
                  <Text style={styles.loginButtonText}>
                    {isResetting ? "Updating…" : "Update"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </Portal>
          {/* --- end modals --- */}
        </View>
      </SafeAreaView>

      {/* Local Toast host */}
      <Toast />
    </PaperProvider>
  );
}

/* styles & helpers */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: H_PAD },

  headerRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { color: "#fff", fontWeight: "700" },
  greeting: { marginTop: 18, fontSize: 20, color: TEXT, fontWeight: "700", textAlign: "center" },

  carouselWrap: { marginTop: 30 },
  slideContainer: {
    borderRadius: 16,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  bannerImg: { borderRadius: 16 },

  dotsRow: {
    marginTop: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D9D9D9" },
  dotActive: { backgroundColor: "#00000088" },

  card: {
    marginTop: 46,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    ...shadow(8),
  },
  avatar: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -36,
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },

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

  btnRow: { flexDirection: "row", gap: 10, marginTop: 54 },
  primaryBtn: {
    flex: 1,
    height: 40,
    backgroundColor: GREEN,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold" },
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

  // === modal styles ===
  sheet: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#A3AE95",
    padding: 20,
  },
  sheetLarge: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#A3AE95",
    padding: 20,
  },
  modalTitle: { fontSize: 12, marginBottom: 10, color: "#3C4234", fontWeight: "700" },
  sheetInner: {
    backgroundColor: "rgba(242,235,188,0.4)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  innerfield: { marginHorizontal: "3%", marginVertical: 10 },
  innerfieldall: { marginHorizontal: "3%", marginVertical: 10 },
  inputin: {
    height: 50,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.3)",
    paddingLeft: 15,
    fontSize: 20,
  },
  send: {
    width: "75%",
    height: 42,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    alignSelf: "center",
  },
  loginButtonText: { fontSize: 15, fontWeight: "bold", color: "#3C4234" },
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
