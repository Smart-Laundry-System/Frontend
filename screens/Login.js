import React, { useEffect, useRef, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Vector from '../assets/Vector.png';
import backLogin from '../assets/backLogin.png';
import imageLoginBack from '../assets/imageLoginBack.png';
import LoginBut from '../components/Button/LoginBut';
import Or from '../components/Button/Or';
import CreateAc from '../components/Button/CreateAc';

function Login({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisiblenext, setModalVisiblenext] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [decoded, setDecoded] = useState(null);

  const backtoback = () => {
    navigation.navigate('Home');
  };

  const sendemail = () => {
    setModalVisible(false);
    setModalVisiblenext(true);
  };


  useEffect(() => {


    // axios.get("http://172.20.10.2:8082/auth/v1/health")
    //   .then(() => console.log("Backend reachable"))
    //   .catch(err => console.log("Backend not reachable: ", err.message));

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // const submitCredantial = () => {
  //   console.log('Submitting:', { userName, password });

  //   const dataSet = {
  //     userName,
  //     password
  //   };

  //   axios.post("http://172.20.10.2:8082/auth/v1/login", dataSet)
  //     .then((response) => {
  //       setToken(response.data.token);
  //       console.log(response.data)
  //       console.log('Token:', response.data.token);
  //       console.log('Response:', response.data);
  //       if (response.data.token) {
  //         navigation.navigate("UserHome");
  //       }
  //     })
  //     .catch((error) => {
  //       console.log("Login error: ", JSON.stringify(error.toJSON()));
  //     });
  // };

  const resetDate = () => {
    setPassword("");
    setUserName("");
    setDecoded("");
    setToken("");
  }

  const submitCredantial = async () => {
    if (!userName.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Credentials',
        text2: 'Please enter both email and password',
        position: 'bottom',
        visibilityTime: 2000
      });
      return;
    }

    const dataSet = {
      username: userName,
      password: password
    };

    try {
      const response = await axios.post("http://172.20.10.2:8082/auth/v1/login", dataSet);
      const receivedToken = response.data;
      setToken(receivedToken);

      if (receivedToken) {
        const decodedToken = jwtDecode(receivedToken);
        setDecoded(decodedToken);
        console.log("Decoded role:", decodedToken.role);

        resetDate();

        if (decodedToken.role === "CUSTOMER") {
          // navigation.navigate("UserHome");

          navigation.navigate("LaundryHome");
          Toast.show({
            type: 'success',
            text1: 'Welcome to smart laundry',
            text2: 'Check your notifications first',
            position: 'top',
            visibilityTime: 2000
          })
        } else if (decodedToken.role === "LAUNDRY") {
          navigation.navigate("LaundryHome");
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: 'Unknown user role',
            position: 'bottom',
            visibilityTime: 2000
          });
        }
      }
    } catch (error) {
      console.log("Login error: ", error.message);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'Invalid credentials or server error',
        position: 'bottom',
        visibilityTime: 2000
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image source={backLogin} style={styles.imageBack} />
      <View style={styles.backtop}></View>
      <TouchableOpacity onPress={backtoback} style={styles.forback}>
        <Image style={styles.image} source={Vector} />
      </TouchableOpacity>

      <Text style={styles.title}>The Smart Laundry.</Text>
      <Text style={styles.subTit}>Enter your given email and password</Text>

      <Image source={imageLoginBack} style={styles.imageLoginBack} />

      <BlurView style={{ marginTop: keyboardVisible ? '-35%' : '' }} intensity={keyboardVisible ? 6 : 0}>
        <View>
          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor={keyboardVisible ? 'black' : ''}
              autoCapitalize="none"
              autoCorrect={false}
              value={userName}
              onChangeText={setUserName}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={true}
              placeholderTextColor={keyboardVisible ? 'black' : ''}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={styles.forget}>
            <Text style={styles.forgetfont}>Forget Password?</Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.resetfont}>Reset the password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {/* <LoginBut login="Login" onPress={submitCredantial} /> */}
      <TouchableOpacity style={styles.loginButton} onPress={submitCredantial}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <Or />
      <CreateAc butname="Create an account" navigation={navigation} path="UserRegistration" />

      {/* First Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={20}
          style={styles.modalBackground}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalView]}>
              <Text style={styles.modalText}>Enter your registered email</Text>
              {/* <View style={styles.innerContainer}> */}
              <View style={{ height: '85%', borderRadius: 10, marginRight: 'auto', marginLeft: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                <View style={styles.innerfield}>
                  <TextInput
                    style={styles.inputin}
                    placeholder="Email"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
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
        transparent={true}
        visible={modalVisiblenext}
        onRequestClose={() => setModalVisiblenext(false)}
      >
        <BlurView intensity={0} style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => {
              setModalVisiblenext(false);
            }}
          >
            <View style={styles.modalViewset}>
              <Text style={styles.modalText}>Enter your registered email</Text>
              {/* <View style={styles.innerContainer}> */}
              <View style={{ height: '90%', borderRadius: 10, marginRight: 'auto', marginLeft: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
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
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.inputin}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry={true}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffff' },
  forback: {
    top: "6.5%",
    left: "6%",
    width: '8%',
    aspectRatio: 1,
    overflow: 'hidden'
  },
  loginButton: {
    width: '75%',
    height: 42,
    backgroundColor: '#A3AE95', // Green color
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
    alignSelf: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3C4234',
  },
  imageLoginBack: {
    position: 'absolute',
    top: "41%",
    width: '100%',
    height: '48%',
    // flex: 1
  },
  imageBack: { position: 'absolute', width: '100%', height: '60%', opacity: 0.9 },
  backtop: { position: 'absolute', top: 0, backgroundColor: 'rgba(163, 174, 149,0.6)', width: '100%', height: '70%' },
  image: {
    resizeMode: 'cover'
  },
  title: { fontSize: 35, color: '#3C4234', fontWeight: 'bold', top: '8%', marginLeft: '10%' },
  subTit: { fontSize: 15, color: '#3C4234', fontWeight: '500', top: '8%', marginLeft: '10%' },
  fields: { width: '80%', alignSelf: 'center', marginTop: '80%' },
  input: { height: 50, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', marginBottom: 15, paddingLeft: 15, fontSize: 16 },
  forget: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  forgetfont: { fontSize: 15, color: '#FF0000', fontWeight: 'bold' },
  resetfont: { fontSize: 15, fontWeight: 'bold', color: '#A3AE95', borderBottomWidth: 1.5, borderBottomColor: '#FF0000' },
  modalBackground: { flex: 1, justifyContent: 'center' },
  modalView: { height: '250', backgroundColor: '#A3AE95', padding: 20, shadowColor: '#000', elevation: 5 },
  modalViewset: { height: '380', backgroundColor: '#A3AE95', padding: 20, shadowColor: '#000', elevation: 5 },
  modalText: { fontSize: 12, marginBottom: '10' },
  // innerContainer: { justifyContent: 'center', alignItems: 'center' },
  // innerfield: { marginHorizontal: '3%', marginVertical: 10 },
  innerfieldall: { marginHorizontal: '3%', marginVertical: 10 },
  innerContainer: {
    // color: 'black',
    justifyContent: 'center',
    // alignContent: 'center',
    // width: '90%',
    marginRight: '3%',
    marginTop: '10',
    marginLeft: '3%'
  },
  innerfield: {
    // color: 'black',
    justifyContent: 'center',
    // alignContent: 'center',
    // width: '90%',
    marginRight: '3%',
    marginTop: '10',
    marginLeft: '3%'
  },
  inputin: {
    height: 50,
    width: '100%',
    // color: 'rgba(60,66,52,0.37)',
    borderBottomWidth: 1, // Thickness of the underline
    borderBottomColor: 'rgba(0,0,0,0.3)', // Color of the underline
    // borderWidth: 1,
    // borderRadius: 15,
    // borderColor: 'rgba(0,0,0,0.3)',
    // marginBottom: 15,
    paddingLeft: 15,
    fontSize: 20,
  },
  // inputin: { height: 50, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', paddingLeft: 15, fontSize: 20 },
  send: {
    width: '75%',
    height: 42,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    alignSelf: 'center'
  },
});

export default Login;