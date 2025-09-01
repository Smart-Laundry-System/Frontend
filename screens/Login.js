// screens/Login.js
import React, { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-toast-message";
import {
  Image,
  Keyboard,
  Modal as RNModal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Provider as PaperProvider,
  Portal,
  Modal as PaperModal,
} from "react-native-paper";
import { api, authPost, API_URL } from "../Services/api";

import Vector from "../assets/Vector.png";
import backLogin from "../assets/backLogin.png";
import imageLoginBack from "../assets/imageLoginBack.png";
import Or from '../components/Button/Or'
import CreateAc from "../components/Button/CreateAc";

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

  const backtoback = () => {
    navigation.navigate("Home");
  };

  const sendemail = async () => {
    if (!fpEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "Email is required",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }
    try {
      setIsSendingOtp(true);
      // Use the shared axios instance
      const res = await api.post("/auth/v1/forgotPassword", {
        email: fpEmail.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Smart Laundry",
        text2: res?.data || "OTP sent successfully",
        position: "top",
        visibilityTime: 2000,
      });
      setModalVisible(false);
      setRpEmail(fpEmail.trim());
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

  const onResetPassword = async () => {
    if (!rpEmail.trim() || !rpOtp.trim() || !rpPass.trim() || !rpConfirm.trim()) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "All fields are required",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }
    if (rpPass !== rpConfirm) {
      Toast.show({
        type: "error",
        text1: "Smart Laundry",
        text2: "Passwords do not match",
        position: "top",
        visibilityTime: 2000,
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
        text2: res?.data || "Password updated",
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
        visibilityTime: 2000,
      });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    if (!API_URL) {
      Toast.show({
        type: "error",
        text1: "Missing API_URL",
        text2: "Set it in app config and rebuild.",
      });
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
    if (!userName.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Credentials",
        text2: "Please enter both email and password",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authPost("/auth/v1/login", {
        username: userName,
        password,
      });

      const receivedToken = response?.data;
      if (!receivedToken) throw new Error("No token returned");

      const decodedToken = jwtDecode(receivedToken);

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
                token: receivedToken,
              },
            },
          ],
        });

        Toast.show({
          type: "success",
          text1: "Welcome to Smart Laundry",
          text2: "Check your notifications first",
          position: "top",
          visibilityTime: 2000,
        });
      } else if (decodedToken.role === "LAUNDRY") {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "LaundryHome",
              params: { email: decodedToken.email, token: receivedToken },
            },
          ],
        });
      } else {
        navLockedRef.current = false;
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Unknown user role",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      navLockedRef.current = false;
      Toast.show({
        type: "error",
        text1: "Login Error",
        text2: "Invalid credentials or server error",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Modal Bodies ----------
  const ForgotBody = (
    <View style={styles.modalView}>
      <Text style={styles.modalText}>Enter your registered email</Text>
      <View
        style={{
          height: "85%",
          borderRadius: 10,
          marginRight: "auto",
          marginLeft: "auto",
          backgroundColor: "rgba(242,235,188,0.4)",
          width: "95%",
        }}
      >
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
    </View>
  );

  const ResetBody = (
    <View style={styles.modalViewset}>
      <Text style={styles.modalText}>Enter your registered email</Text>
      <View
        style={{
          height: "90%",
          borderRadius: 10,
          marginRight: "auto",
          marginLeft: "auto",
          backgroundColor: "rgba(242,235,188,0.4)",
          width: "95%",
        }}
      >
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
          style={[styles.send, { opacity: isResetting ? 0.6 : 1 }]}
          onPress={onResetPassword}
          disabled={isResetting}
        >
          <Text style={styles.loginButtonText}>
            {isResetting ? "Updating…" : "Update"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ---------- Modal Renderers (Portal vs RN Modal) ----------
  const renderForgotModal = () => {
    if (USE_PORTAL) {
      return (
        <Portal>
          <PaperModal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)} // back button only (Android)
            dismissable={false} // cannot close by tapping outside
            contentContainerStyle={{ marginHorizontal: 16 }}
          >
            <BlurView intensity={20} style={styles.modalBackground}>
              {ForgotBody}
            </BlurView>
          </PaperModal>
        </Portal>
      );
    }
    return (
      <RNModal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // back button only
      >
        <BlurView intensity={20} style={styles.modalBackground}>
          {ForgotBody}
        </BlurView>
      </RNModal>
    );
  };

  const renderResetModal = () => {
    if (USE_PORTAL) {
      return (
        <Portal>
          <PaperModal
            visible={modalVisiblenext}
            onDismiss={() => setModalVisiblenext(false)} // back button only
            dismissable={false}
            contentContainerStyle={{ marginHorizontal: 16 }}
          >
            <BlurView intensity={20} style={styles.modalBackground}>
              {ResetBody}
            </BlurView>
          </PaperModal>
        </Portal>
      );
    }
    return (
      <RNModal
        animationType="none"
        transparent
        visible={modalVisiblenext}
        onRequestClose={() => setModalVisiblenext(false)} // back button only
      >
        <BlurView intensity={20} style={styles.modalBackground}>
          {ResetBody}
        </BlurView>
      </RNModal>
    );
  };

  // ---------- Screen ----------
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
        intensity={keyboardVisible ? 6 : 0}
      >
        <View>
          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor={keyboardVisible ? "black" : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              value={userName}
              onChangeText={setUserName}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={keyboardVisible ? "black" : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submitCredantial}
              returnKeyType="go"
            />
          </View>
          <View style={styles.forget}>
            <Text style={styles.forgetfont}>Forget Password?</Text>
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
        style={[styles.loginButton, { opacity: isSubmitting ? 0.6 : 1 }]}
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

      {/* Modals */}
      {renderForgotModal()}
      {renderResetModal()}

      {/* Toast Host */}
      <Toast />
    </View>
  );

  // If using Portal, wrap with PaperProvider
  if (USE_PORTAL) {
    return <PaperProvider>{ScreenBody}</PaperProvider>;
  }
  return ScreenBody;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffff" },
  forback: {
    top: "6.5%",
    left: "6%",
    width: "8%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  loginButton: {
    width: "75%",
    height: 42,
    backgroundColor: "#A3AE95",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 35,
    alignSelf: "center",
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#3C4234",
  },
  imageLoginBack: {
    position: "absolute",
    top: "41%",
    width: "100%",
    height: "48%",
  },
  imageBack: { position: "absolute", width: "100%", height: "60%", opacity: 0.9 },
  backtop: {
    position: "absolute",
    top: 0,
    backgroundColor: "rgba(163, 174, 149,0.6)",
    width: "100%",
    height: "70%",
  },
  image: { resizeMode: "cover" },
  title: {
    fontSize: 35,
    color: "#3C4234",
    fontWeight: "bold",
    top: "8%",
    marginLeft: "10%",
  },
  subTit: {
    fontSize: 15,
    color: "#3C4234",
    fontWeight: "500",
    top: "8%",
    marginLeft: "10%",
  },
  fields: { width: "80%", alignSelf: "center", marginTop: "80%" },
  input: {
    height: 50,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.3)",
    marginBottom: 15,
    paddingLeft: 15,
    fontSize: 16,
  },
  forget: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  forgetfont: { fontSize: 15, color: "#FF0000", fontWeight: "bold" },
  resetfont: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#A3AE95",
    borderBottomWidth: 1.5,
    borderBottomColor: "#FF0000",
  },
  modalBackground: { flex: 1, justifyContent: "center" },
  // 🔧 Fix numeric values (no quotes)
  modalView: {
    height: 250,
    backgroundColor: "#A3AE95",
    padding: 20,
    shadowColor: "#000",
    elevation: 5,
    borderRadius: 10,
  },
  modalViewset: {
    height: 380,
    backgroundColor: "#A3AE95",
    padding: 20,
    shadowColor: "#000",
    elevation: 5,
    borderRadius: 10,
  },
  modalText: { fontSize: 12, marginBottom: 10 },
  innerfieldall: { marginHorizontal: "3%", marginVertical: 10 },
  innerfield: { marginRight: "3%", marginTop: 10, marginLeft: "3%" },
  inputin: {
    height: 50,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.3)",
    paddingLeft: 15,
    fontSize: 20,
    marginBottom: 12,
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
});

export default Login;
