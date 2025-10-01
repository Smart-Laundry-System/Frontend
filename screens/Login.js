import React, { useCallback, useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Image,
  Keyboard,
  Modal as RNModal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Provider as PaperProvider,
  Portal,
  Modal as PaperModal,
} from "react-native-paper";

import { api, API_URL } from "../Services/api";

import Vector from "../assets/Vector.png";
import backLogin from "../assets/backLogin.png";
import imageLoginBack from "../assets/imageLoginBack.png";
import Or from "../components/Button/Or";
import CreateAc from "../components/Button/CreateAc";

import {
  AppTheme,
  tokens,
  isValidEmail,
  isValidPassword,
  TOAST
} from "../styles/theme";
import { saveTokens, deleteTokens } from "../Services/tokenStorage";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const USE_PORTAL = true;

function Login({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisiblenext, setModalVisiblenext] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fpEmail, setFpEmail] = useState("");
  const [rpEmail, setRpEmail] = useState("");
  const [rpOtp, setRpOtp] = useState("");
  const [rpPass, setRpPass] = useState("");
  const [rpConfirm, setRpConfirm] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const navLockedRef = useRef(false);

  const backtoback = () => navigation.navigate("Home");

  const sendemail = async () => {
    const email = (fpEmail || "").trim();
    if (!email) {
      Toast.show(TOAST.errorTop("Smart Laundry", "Email is required"));
      return;
    }
    if (!isValidEmail(email)) {
      Toast.show(TOAST.errorTop("Invalid Email", "Please enter a valid email address"));
      return;
    }
    try {
      setIsSendingOtp(true);
      const res = await api.post("/auth/v1/forgotPassword", { email });
      Toast.show(TOAST.success("Smart Laundry", res?.data || "OTP sent successfully"));
      setModalVisible(false);
      setRpEmail(email);
      setModalVisiblenext(true);
    } catch (e) {
      Toast.show(TOAST.errorTop(
        "Smart Laundry",
        e?.response?.data || e?.message || "Failed to send OTP"
      ));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onResetPassword = async () => {
    const email = (rpEmail || "").trim();
    const otp = (rpOtp || "").trim();
    const pass = (rpPass || "").trim();
    const confirm = (rpConfirm || "").trim();

    if (!email || !otp || !pass || !confirm) {
      Toast.show(TOAST.errorTop("Smart Laundry", "All fields are required"));
      return;
    }
    if (!isValidEmail(email)) {
      Toast.show(TOAST.errorTop("Invalid Email", "Please enter a valid email address"));
      return;
    }
    if (!isValidPassword(pass)) {
      Toast.show(TOAST.errorTop(
        "Weak Password",
        "Password must be at least 8 characters and include one symbol"
      ));
      return;
    }
    if (pass !== confirm) {
      Toast.show(TOAST.errorTop("Smart Laundry", "Passwords do not match"));
      return;
    }

    try {
      setIsResetting(true);
      const res = await api.put("/auth/v1/resetPassword", {
        userName: email,
        otp,
        password: pass,
      });
      Toast.show(TOAST.success("Smart Laundry", res?.data || "Password updated"));
      setModalVisiblenext(false);
      setRpEmail("");
      setRpOtp("");
      setRpPass("");
      setRpConfirm("");
    } catch (e) {
      Toast.show(TOAST.errorTop(
        "Smart Laundry",
        e?.response?.data || e?.message || "Password update failed"
      ));
    } finally {
      setIsResetting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        const type = e?.data?.action?.type;
        if (type === "GO_BACK" || type === "POP") {
          e.preventDefault();
        }
      });

      return unsubscribe;
    }, [navigation])
  );


  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    if (!API_URL) {
      Toast.show(TOAST.errorTop("Missing API_URL", "Set it in app config and rebuild."));
    }

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const resetFields = () => {
    setPassword("");
    setUserName("");
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const submitCredantial = async () => {
    if (isSubmitting) return;

    const email = (userName || "").trim();
    const pwd = (password || "").trim();

    if (!email || !pwd) {
      Toast.show(TOAST.errorBottom("Missing Credentials", "Please enter both email and password"));
      return;
    }
    if (!isValidEmail(email)) {
      Toast.show(TOAST.errorBottom("Invalid Email", "Please enter a valid email address"));
      return;
    }
    if (!isValidPassword(pwd)) {
      Toast.show(TOAST.errorBottom(
        "Weak Password",
        "Password must be at least 8 characters and include one symbol"
      ));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/v1/login", {
        username: email,
        password: pwd,
      });

      const data = response?.data;
      const accessToken =
        typeof data === "string" ? data : data?.accessToken || data?.token;
      const refreshToken =
        typeof data === "string" ? null : data?.refreshToken || data?.refresh || null;

      if (!accessToken) throw new Error("No token returned");

      await deleteTokens();
      await saveTokens({ accessToken, refreshToken });

      // (Optional) decode to branch on role for navigation now
      const decodedToken = jwtDecode(accessToken);

      await sleep(200);

      if (navLockedRef.current) return;
      navLockedRef.current = true;

      resetFields();

      if (decodedToken.role === "CUSTOMER") {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "UserHome",
              params: {
                email: decodedToken.email,
                name: decodedToken.name,
                token: accessToken
              },
            },
          ],
        });

        Toast.show(TOAST.success("Welcome to Smart Laundry", "Check your notifications first"));
      } else if (decodedToken.role === "LAUNDRY") {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "LaundryHome",
              params: { email: decodedToken.email, token: accessToken },
            },
          ],
        });
      } else if (decodedToken.role === "EMPLOYEE") {
        Toast.show(TOAST.errorBottom("The feature will unlocked in future", "Emploee not allowed to access"));
      } else {
        navLockedRef.current = false;
        Toast.show(TOAST.errorBottom("Login Failed", "Unknown user role"));
      }
    } catch (error) {
      navLockedRef.current = false;
      Toast.show(TOAST.errorBottom("Login Error", "Invalid credentials or server error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const ForgotBody = (
    <View
      style={[
        styles.modalView,
        { marginTop: keyboardVisible ? "-45%" : "-35%" },
      ]}
    >
      <Text style={styles.modalText}>Enter your registered email</Text>
      <View style={styles.modalInnerForgot}>
        <View style={styles.innerfield}>
          <TextInput
            style={styles.inputin}
            placeholder="Email"
            placeholderTextColor={tokens.colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={fpEmail}
            onChangeText={setFpEmail}
          />
        </View>
        <TouchableOpacity
          style={[styles.send, { opacity: isSendingOtp ? tokens.opacities.disabled : 1 }]}
          onPress={sendemail}
          disabled={isSendingOtp}
        >
          <Text style={styles.loginButtonText}>
            {isSendingOtp ? "Sending…" : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ResetBody = (
    <View
      style={[
        styles.modalViewset,
        { marginTop: keyboardVisible ? "-75%" : "-35%" },
      ]}
    >
      <Text style={styles.modalText}>Enter your registered email</Text>
      <View style={styles.modalInnerReset}>
        <View style={styles.innerfieldall}>
          <TextInput
            style={styles.inputin}
            placeholder="Email"
            placeholderTextColor={tokens.colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={rpEmail}
            onChangeText={setRpEmail}
          />
          <TextInput
            style={styles.inputin}
            placeholder="OTP"
            placeholderTextColor={tokens.colors.placeholder}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            value={rpOtp}
            onChangeText={setRpOtp}
          />
          <TextInput
            style={styles.inputin}
            placeholder="New Password"
            placeholderTextColor={tokens.colors.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={rpPass}
            onChangeText={setRpPass}
          />
          <TextInput
            style={styles.inputin}
            placeholder="Confirm Password"
            placeholderTextColor={tokens.colors.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={rpConfirm}
            onChangeText={setRpConfirm}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.send, { opacity: isResetting ? tokens.opacities.disabled : tokens.opacities.fullscreen }]}
        onPress={onResetPassword}
        disabled={isResetting}
      >
        <Text style={styles.loginButtonText}>
          {isResetting ? "Updating…" : "Update"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderForgotModal = () => {
    if (USE_PORTAL) {
      return (
        <Portal>
          <PaperModal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            dismissable
            contentContainerStyle={{ marginHorizontal: 16 }}
          >
            <Pressable
              style={styles.modalBackground}
              onPress={() => setModalVisible(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <BlurView intensity={tokens.blur.modal}>{ForgotBody}</BlurView>
              </Pressable>
            </Pressable>
          </PaperModal>
        </Portal>
      );
    }
    return (
      <RNModal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setModalVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={tokens.blur.modal}>{ForgotBody}</BlurView>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  };

  const renderResetModal = () => {
    if (USE_PORTAL) {
      return (
        <Portal>
          <PaperModal
            visible={modalVisiblenext}
            onDismiss={() => setModalVisiblenext(false)}
            dismissable
            contentContainerStyle={{ marginHorizontal: 16 }}
          >
            <Pressable
              style={styles.modalBackground}
              onPress={() => setModalVisiblenext(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <BlurView intensity={tokens.blur.modal}>{ResetBody}</BlurView>
              </Pressable>
            </Pressable>
          </PaperModal>
        </Portal>
      );
    }
    return (
      <RNModal
        animationType="none"
        transparent
        visible={modalVisiblenext}
        onRequestClose={() => setModalVisiblenext(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setModalVisiblenext(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={tokens.blur.modal}>{ResetBody}</BlurView>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  };

  const ScreenBody = (
    <View style={styles.container}>
      <Image source={backLogin} style={styles.imageBack} />
      <View style={styles.backtop} />
      <TouchableOpacity onPress={backtoback} style={styles.forback}>
        <Image style={styles.image} source={Vector} />
      </TouchableOpacity>

      <Text style={styles.title}>The Smart Laundry.</Text>
      <Text style={styles.subTit}>Enter your given email and password</Text>

      <Image source={imageLoginBack} style={styles.imageLoginBack} />

      <BlurView
        style={{ marginTop: keyboardVisible ? "-35%" : undefined }}
        intensity={keyboardVisible ? tokens.blur.light : tokens.blur.screen}
      >
        <View>
          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              value={userName}
              onChangeText={setUserName}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submitCredantial}
              returnKeyType="go"
            />
          </View>
          <View style={styles.forget}>
            <Text style={styles.forgetfont}>Forgot Password?</Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => {
                setFpEmail(userName || "");
                setModalVisible(true);
              }}
            >
              <Text style={styles.resetfont}>Reset the password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <TouchableOpacity
        style={[
          styles.loginButton,
          { opacity: isSubmitting ? tokens.opacities.disabled : 1 },
        ]}
        onPress={submitCredantial}
        disabled={isSubmitting}
      >
        <Text style={styles.loginButtonText}>
          {isSubmitting ? "Logging in…" : "Login"}
        </Text>
      </TouchableOpacity>

      <Or />
      <CreateAc
        butname="Create an account"
        navigation={navigation}
        path="UserRegistration"
      />

      {renderForgotModal()}
      {renderResetModal()}
    </View>
  );

  if (USE_PORTAL) {
    return <PaperProvider theme={AppTheme}>{ScreenBody}</PaperProvider>;
  }
  return ScreenBody;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bodyBackground },
  forback: {
    top: "6.5%",
    left: "6%",
    width: "8%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  loginButton: {
    width: "75%",
    height: tokens.sizes.buttonHeight,
    backgroundColor: tokens.colors.greenButton,
    borderRadius: tokens.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: tokens.spacing.xxl,
    alignSelf: "center",
  },
  loginButtonText: {
    fontSize: tokens.components.Typography.body.fontSize,
    ...tokens.components.Button.text.style,
    color: tokens.components.Button.text.color,
  },
  imageLoginBack: {
    position: "absolute",
    top: "41%",
    width: "100%",
    height: "48%",
  },
  imageBack: { position: "absolute", width: "100%", height: "60%", opacity: tokens.opacities.overlay },
  backtop: {
    position: "absolute",
    top: 0,
    backgroundColor: tokens.overlays.toplight,
    width: "100%",
    height: "70%",
  },
  image: { resizeMode: "cover" },
  title: {
    fontSize: tokens.components.Typography.h1.fontSize,
    ...tokens.components.Typography.h1,
    top: "8%",
    marginLeft: "10%",
  },
  subTit: {
    fontSize: tokens.components.Typography.body.fontSize,
    color: tokens.colors.text,
    ...tokens.components.Typography.body,
    top: "8%",
    marginLeft: "10%",
  },
  fields: { width: "80%", alignSelf: "center", marginTop: "80%" },
  input: {
    height: tokens.sizes.inputHeight,
    width: "100%",
    borderBottomWidth: tokens.components.Input.borderBottomWidth,
    borderBottomColor: tokens.colors.bottomBorder,
    marginBottom: tokens.spacing.sm,
    paddingLeft: tokens.components.Input.paddingLeft,
    fontSize: tokens.components.Input.fontSize,
  },
  forget: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  forgetfont: {
    fontSize: tokens.components.Typography.body.fontSize,
    color: tokens.colors.notification,
    ...tokens.fonts.bold,
  },
  resetfont: {
    fontSize: tokens.components.Typography.body.fontSize,
    ...tokens.fonts.bold,
    color: tokens.colors.greenButton,
    borderBottomWidth: 1.5,
    borderBottomColor: tokens.colors.notification,
  },
  modalBackground: { flex: 1, justifyContent: "center" },
  modalView: {
    height: tokens.components.Modal.smallCardHeight,
    backgroundColor: tokens.colors.lightColor,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    ...tokens.shadows.level1,
  },
  modalViewset: {
    height: tokens.components.Modal.bigCardHeight,
    backgroundColor: tokens.colors.lightColor,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    ...tokens.shadows.level1,
  },
  modalText: { fontSize: 12, marginBottom: 10 },
  innerfieldall: { marginHorizontal: "3%", marginVertical: 10 },
  innerfield: { marginRight: "3%", marginTop: 10, marginLeft: "3%" },
  inputin: {
    height: tokens.sizes.inputHeight,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.bottomBorder,
    paddingLeft: 15,
    fontSize: 20,
    marginBottom: 12,
  },
  send: {
    width: "75%",
    height: tokens.sizes.buttonHeight,
    borderRadius: tokens.radius.md,
    borderColor: "#000",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  modalInnerForgot: {
    height: "85%",
    borderRadius: tokens.radius.md,
    marginRight: "auto",
    marginLeft: "auto",
    backgroundColor: tokens.overlays.big,
    width: "95%",
  },
  modalInnerReset: {
    borderRadius: tokens.radius.md,
    marginRight: "auto",
    marginLeft: "auto",
    backgroundColor: tokens.overlays.big,
    width: "95%",
  },
});

export default Login;
