import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { api } from '../../Services/api';
import { TOAST, tokens } from '../../styles/theme';

function RegistreTop({ navigation }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const controlLogin = async () => {
    if (submitting) return;

    if (!email.trim() || !firstName.trim() || !lastName.trim()
      || !password.trim() || !phone.trim() || !address.trim()) {
      Toast.show(
        TOAST.errorBottom("Registration failed", "Please fill all required fields")
      );
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

      const res = await api.post('/auth/v1/addUser', payload);

      if (res?.status === 200 && res?.data) {
        Toast.show(
          TOAST.success("Registration successful", "Use your credentials to login")
        );
        navigation.navigate('Login');
      } else {
        Toast.show(
          TOAST.errorBottom("Registration failed", "Unexpected server response")
        );
      }
    } catch (err) {
      const serverMsg = err?.response?.data;
      Toast.show(
        TOAST.errorBottom("Registration failed", (typeof serverMsg === 'string' && serverMsg) || err?.message || 'Network/server error')
      );
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
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="sentences"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="LAN Phone (Optional)"
            value={phone2}
            onChangeText={setPhone2}
            keyboardType="phone-pad"
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.loginButton, { opacity: submitting ? tokens.opacities.disabled : tokens.opacities.fullscreen }]}
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
  fields: {
    width: '80%',
    alignSelf: 'center',
    marginTop: '58%',
  },
  input: {
    height: tokens.sizes.inputHeight,
    width: "100%",
    borderBottomWidth: tokens.components.Input.borderBottomWidth,
    borderBottomColor: tokens.colors.bottomBorder,
    marginBottom: tokens.spacing.sm,
    paddingLeft: tokens.components.Input.paddingLeft,
    fontSize: tokens.components.Input.fontSize
  },
});

export default RegistreTop;
