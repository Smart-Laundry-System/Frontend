import React, { useContext, useEffect, useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { api } from '../../../Services/api';
import { TOAST, tokens } from '../../../styles/theme';
import { useRoute } from '@react-navigation/native';
import { getAccessToken } from '../../../Services/tokenStorage';
import { useRegistration } from '../../../context/RegistrationContext';
import Or from '../../../components/Button/Or';
import registeroverlay from '../../../assets/backLogin.png';
import overlap from '../../../assets/registeroverlay.png';
import inerbutton from '../../../assets/Vector1.png';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import CreateAc from '../../../components/Button/CreateAc';

function AddEmployee({ navigation }) {

  const { laundryId } = useRegistration();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const route = useRoute();
  const routeToken = route?.params?.token ?? null;
  const id = laundryId || route.params.laundryId || null;

  const [token, setToken] = useState(routeToken || null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    let mounted = true;

    (async () => {
      if (!routeToken) {
        const t = await getAccessToken().catch(() => null);
        if (mounted && t) setToken(t);
      }
    })();

    if (!token) return;

    return () => {
      show.remove();
      hide.remove();
      mounted = false;
    };
  }, [routeToken, token]);


  const ROLES = [
    { label: 'Admin', value: 'LAUNDRY' },
    { label: 'Delivery person', value: 'EMPLOYEE' },
  ];

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setRole('');
    setRoleOpen(false);
  };

  const controlLogin = async () => {
    if (submitting) return;
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim()) {
      Toast.show(
        TOAST.errorBottom("Registration failed", "Please fill all required fields")
      );
      return;
    }

    const payload = {
      email: email.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      role: role.trim(),
      phone: phone.trim(),
      address: address.trim(),
    };
    try {
      setSubmitting(true);

      const res = await api.post('/api/auth/addEmployee', payload,
        {
          params: { laundryId: id },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (res?.status === 200 && res?.data) {
        Toast.show(
          TOAST.success("Registration successful", "You can assign employee to an order")
        );
        resetForm();
        navigation.goBack();
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
    <View style={styles.container}>

      <Image source={registeroverlay} style={styles.image} />
      <View style={styles.backtop}></View>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={inerbutton} style={styles.imagein} />
      </TouchableOpacity>
      <Image source={overlap} style={styles.regback} />
      <Text style={styles.text}>
        The Smart Laundry.
      </Text>
      <Text style={styles.textsub}>
        Add An Emploee
      </Text>

      <BlurView style={{ marginTop: keyboardVisible ? '-35%' : '' }} intensity={keyboardVisible ? 20 : 0}>

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
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="none"
            />

            <Pressable onPress={() => setRoleOpen((v) => !v)}>
              <Text style={[styles.input, { paddingTop: 14 }]}>
                {role?.label || 'Designation'}
              </Text>
              <Ionicons
                name={roleOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={tokens.colors.mutedText}
                style={styles.rightIcon}
              />
            </Pressable>

            {roleOpen && (
              <View style={styles.dropdown}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRole(r.value);
                      setRoleOpen(false);
                    }}
                  >
                    <Text style={{ color: tokens.colors.darkText }}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { opacity: submitting ? tokens.opacities.disabled : tokens.opacities.fullscreen }]}
            onPress={controlLogin}
            disabled={submitting}
          >
            <Text style={styles.loginButtonText}>
              {submitting ? 'Signing up…' : 'Sign up'}
            </Text>
          </TouchableOpacity>
          <Or />
          <CreateAc
            butname="Back to home"
            navigation={navigation}
            path="LaundryHome"
          />
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bodyBackground,
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '40%',
  },
  backtop: { position: 'absolute', top: 0, backgroundColor: tokens.colors.overlayTopd, width: '100%', height: '40%' },
  imagein: {
    marginTop: '15%',
    marginLeft: '5%',
  },
  regback: { bottom: 0, width: '100%', height: '53%', position: 'absolute', marginBottom: '21%' },
  text: { fontSize: tokens.components.Typography.h1.fontSize, color: tokens.colors.switchact, fontWeight: 'bold', top: '8%', marginLeft: '10%' },
  textsub: { fontSize: tokens.components.Typography.body.fontSize, color: tokens.colors.switchact, fontWeight: '500', top: '8%', marginLeft: '10%' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginTop: '38%',
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
  rightIcon: { position: 'absolute', right: 0, top: tokens.spacing.md },
  dropdown: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F7F8F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EAE6',
    paddingVertical: 6,
    marginTop: -8,
    marginBottom: tokens.spacing.xs,
  },
  dropdownItem: { paddingVertical: tokens.spacing.sm, paddingHorizontal: 10 },
});

export default AddEmployee;
