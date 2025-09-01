// components/UserTop/RegistreTop.js
import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

// ✅ Use shared API layer
// If this file is at components/UserTop/RegistreTop.js:
import { api } from '../../Services/api';
// If your location differs, change the path accordingly, e.g. '../services/api' or '../../../services/api'

function RegistreTop({ navigation }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName ]  = useState('');
  const [phone,     setPhone    ]  = useState('');
  const [phone2,    setPhone2   ]  = useState('');
  const [email,     setEmail    ]  = useState('');
  const [password,  setPassword ]  = useState('');
  const [address,   setAddress  ]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const controlLogin = async () => {
    if (submitting) return;

    // Basic validation
    if (!email.trim() || !firstName.trim() || !lastName.trim()
      || !password.trim() || !phone.trim() || !address.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: 'Please fill all required fields',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    const payload = {
      email: email.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      password: password,
      role: 'CUSTOMER',
      phone: phone.trim(),
      phone_2: phone2.trim(),
      address: address.trim(),
    };

    try {
      setSubmitting(true);

      // ✅ Use the shared axios instance
      const res = await api.post('/auth/v1/addUser', payload);

      if (res?.status === 200 && res?.data) {
        Toast.show({
          type: 'success',
          text1: 'Registration successful',
          text2: 'Use your credentials to login',
          position: 'top',
          visibilityTime: 2000,
        });
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration failed',
          text2: 'Unexpected server response',
          position: 'bottom',
          visibilityTime: 2000,
        });
      }
    } catch (err) {
      // Helpful debugging (optional):
      // console.log('REGISTER ERR', err?.response?.status, err?.response?.data, err?.message);
      const serverMsg = err?.response?.data;
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: (typeof serverMsg === 'string' && serverMsg) || err?.message || 'Network/server error',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fields}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="sentences"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="LAN Phone (Optional)"
            value={phone2}
            onChangeText={setPhone2}
            keyboardType="phone-pad"
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.loginButton, { opacity: submitting ? 0.6 : 1 }]}
        onPress={controlLogin}
        disabled={submitting}
      >
        <Text style={styles.loginButtonText}>
          {submitting ? 'Signing up…' : 'Sign up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: '10%',
  },
  loginButton: {
    width: '75%',
    height: 42,
    backgroundColor: '#A3AE95',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,        // ← number (not string)
    alignSelf: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3C4234',
  },
  fields: {
    width: '80%',
    alignSelf: 'center',
    marginTop: '58%',
  },
  input: {
    height: 40,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.3)',
    marginBottom: 15,
    paddingLeft: 15,
    fontSize: 16,
  },
});

export default RegistreTop;
