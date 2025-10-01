import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';

import { api } from '../../../Services/api';
import { TOAST, tokens } from '../../../styles/theme';

// hero image like other auth/registration screens
import StartImage from '../../../assets/startimage.png'; // swap if your header image differs

const ROLES = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Delivery person', value: 'DELIVERY' },
];

export default function AddEmployee({ navigation }) {
  const route = useRoute();
  const token = route?.params?.token || null;          // optional auth
  const laundryEmail = route?.params?.email || '';     // who is creating

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [address,   setAddress]   = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [role,      setRole]      = useState(ROLES[0]);
  const [roleOpen,  setRoleOpen]  = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setRole(ROLES[0]);
    setRoleOpen(false);
  };

  const onAddEmployee = async () => {
    if (submitting) return;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !address.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !role?.value
    ) {
      Toast.show(TOAST.errorBottom('Missing info', 'Please fill all fields'));
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName : lastName.trim(),
      address  : address.trim(),
      phone    : phone.trim(),
      email    : email.trim(),
      role     : role.value,
      laundryEmail,                 // include if your backend needs it
    };

    try {
      setSubmitting(true);
      await api.post(
        '/api/auth/addEmployee',
        payload,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      Toast.show(TOAST.success('Employee added', `${firstName} ${lastName} created`));
      resetForm();

      // go to the list to see the result
      navigation.navigate('Employees', { token, email: laundryEmail, refresh: Date.now() });
    } catch (err) {
      const msg = err?.response?.data;
      Toast.show(
        TOAST.errorBottom(
          'Failed to add employee',
          (typeof msg === 'string' && msg) || err?.message || 'Server error'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top hero with title (same vibe as your registration/login pages) */}
      <View style={styles.heroWrap}>
        <Image source={StartImage} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <Text style={styles.heroTitle}>The Smart Laundry.</Text>
        <Text style={styles.heroSub}>Create Employee Account</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#E8EAAD" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fields}>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          {/* Designation dropdown */}
          <Pressable style={styles.inputRow} onPress={() => setRoleOpen((v) => !v)}>
            <Ionicons name="briefcase-outline" size={18} color="#98A29D" style={styles.leftIcon} />
            <Text style={[styles.input, { paddingTop: 14 }]}>
              {role?.label || 'Designation'}
            </Text>
            <Ionicons
              name={roleOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#98A29D"
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
                    setRole(r);
                    setRoleOpen(false);
                  }}
                >
                  <Text style={{ color: '#3C4234' }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { opacity: submitting ? tokens.opacities.disabled : tokens.opacities.fullscreen },
          ]}
          onPress={onAddEmployee}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>{submitting ? 'Adding…' : 'Add Employee'}</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Text style={{ color: '#98A29D' }}>or</Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('LaundryHome', { token, email: laundryEmail })}
        >
          <Text style={styles.secondaryBtnText}>For Home Page</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** hero */
  heroWrap: { height: 200, position: 'relative' },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroTitle: {
    position: 'absolute',
    left: 16,
    top: 48,
    fontSize: 28,
    color: '#E8EAAD',
    fontWeight: '800',
  },
  heroSub: {
    position: 'absolute',
    left: 16,
    top: 84,
    color: '#F1F3D1',
    fontWeight: '600',
  },
  backBtn: { position: 'absolute', left: 8, top: 12, padding: 8 },

  /** form */
  scrollContainer: { paddingBottom: 28 },
  fields: { width: '80%', alignSelf: 'center', marginTop: '10%' },
  inputRow: {
    height: tokens.sizes.inputHeight,
    width: '100%',
    borderBottomWidth: tokens.components.Input.borderBottomWidth,
    borderBottomColor: tokens.colors.bottomBorder,
    marginBottom: tokens.spacing.sm,
    justifyContent: 'center',
  },
  input: {
    paddingLeft: tokens.components.Input.paddingLeft + 20,
    paddingRight: 28,
    fontSize: tokens.components.Input.fontSize,
    color: '#3C4234',
  },
  leftIcon: { position: 'absolute', left: 0, top: 14 },
  rightIcon: { position: 'absolute', right: 0, top: 14 },

  dropdown: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F7F8F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EAE6',
    paddingVertical: 6,
    marginTop: -8,
    marginBottom: 8,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 10 },

  /** buttons */
  primaryBtn: {
    width: '75%',
    height: tokens.sizes.buttonHeight,
    backgroundColor: tokens.colors.greenButton,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: tokens.spacing.xl,
  },
  primaryBtnText: {
    fontSize: tokens.components.Typography.body.fontSize,
    ...tokens.components.Button.text.style,
    color: tokens.components.Button.text.color,
  },
  secondaryBtn: {
    width: '75%',
    height: tokens.sizes.buttonHeight,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#CFCFCF',
  },
  secondaryBtnText: { color: '#3C4234', fontWeight: '700' },
});
