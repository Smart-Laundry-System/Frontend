// screens/profile/Profile.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Vector from "../../../assets/Vector.png";
import { BlurView } from "expo-blur";
import { api, authGet, API_URL, IMG_URL } from "../../../Services/api";
import CreateAc from "../../../components/Button/CreateAc";

const Profile = ({ navigation, route }) => {
  const [profile, setProfile] = useState({
    email: "abcd@gmail.com",
    phone: "075 021 3273",
    address: "Vashi, Mumbai",
    openTime: "9:41 AM",
    closeTime: "9:41 AM",
    imageUrl: "https://example.com/image.jpg",
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisiblenext, setModalVisiblenext] = useState(false);

  // If you navigated here from Login, pass token like:
  // navigation.reset({ routes: [{ name: 'Profile', params: { token } }]})
  const token = route?.params?.token || null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Prefer authenticated call if token exists; otherwise fall back to plain GET.
        const res = token
          ? await authGet("/api/auth/retriveUser", token)
          : await api.get("/api/auth/retriveUser");

        // If your API wraps data, adjust accordingly (e.g., res.data.user)
        setProfile(res?.data || {});
      } catch (error) {
        console.error("Failed to load profile:", error?.response?.data || error?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const sendemail = () => {
    setModalVisible(false);
    setModalVisiblenext(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C4234" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#3C4234" }}>No profile data found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.image} source={Vector} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Laundry name</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Use remote image if you want: source={{ uri: profile.imageUrl }} */}
        <Image
          source={require("../../../assets/startimage.png")}
          style={styles.profileImage}
        />

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Open:</Text>
            <Icon name="time-outline" size={100} color="#757575" />
            <Text style={styles.timeBox}>{profile.openTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Close:</Text>
            <Icon name="time-outline" size={100} color="#757575" />
            <Text style={styles.timeBox}>{profile.closeTime}</Text>
          </View>
        </View>

        <View className="field" style={styles.field}>
          <Icon name="mail-outline" size={16} color="#3C4234" />
          <TextInput style={styles.input} value={profile.email} editable={false} />
        </View>

        <View style={styles.field}>
          <Icon name="call-outline" size={16} color="#3C4234" />
          <TextInput style={styles.input} value={profile.phone} editable={false} />
        </View>

        <View style={styles.field}>
          <Icon name="location-outline" size={16} color="#3C4234" />
          <TextInput style={styles.input} value={profile.address} editable={false} />
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.updateButtonText}>Update the password</Text>
      </TouchableOpacity>

      {/* First Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={20} style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
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
                  // You can bind this to state if you wire up the flow
                  />
                </View>
                <TouchableOpacity style={styles.send} onPress={sendemail}>
                  <Text style={styles.loginButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* Second Modal */}
      <Modal
        animationType="none"
        transparent
        visible={modalVisiblenext}
        onRequestClose={() => setModalVisiblenext(false)}
      >
        <BlurView intensity={20} style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => {
              setModalVisiblenext(false);
            }}
          >
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
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="OTP"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="New Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <CreateAc butname="Update" navigation={navigation} path="Home" />
              </View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, marginTop: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    top: 32,
    zIndex: 9000,
  },
  editBtn: {
    backgroundColor: "#A3AE95",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtnText: { color: "#fff", fontWeight: "bold" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    top: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3C4234",
  },
  editButton: {
    backgroundColor: "#a3ae95",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#fdf8df",
    margin: 10,
    top: 48,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 80,
    display: "flex",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    alignItems: "center",
  },
  timeBlock: {
    alignItems: "center",
    width: "40%",
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: "#ccc",
  },
  timeLabel: {
    marginBottom: 6,
    color: "#3C4234",
    fontWeight: "500",
    fontSize: 24,
  },
  timeBox: {
    backgroundColor: "#a3ae95",
    width: "95%",
    textAlign: "center",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    borderRadius: 6,
    fontWeight: "500",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdf8df",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    width: "100%",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 14,
    color: "#3C4234",
  },
  updateButton: {
    backgroundColor: "#a3ae95",
    padding: 12,
    marginHorizontal: 40,
    marginTop: 64,
    borderRadius: 6,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "600",
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
  innerfield: { justifyContent: "center", marginRight: "3%", marginTop: 10, marginLeft: "3%" },
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
  loginButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#3C4234",
  },
  innerfieldall: { marginHorizontal: "3%", marginVertical: 10 },
});

export default Profile;
