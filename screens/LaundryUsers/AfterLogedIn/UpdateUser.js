import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Image, Keyboard, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../../Services/api';
import { TOAST, tokens } from '../../../styles/theme';
import { getAccessToken } from '../../../Services/tokenStorage';
import registeroverlay from '../../../assets/backLogin.png';
import overlap from '../../../assets/registeroverlay.png';
import backBtn from '../../../assets/Vector1.png';
import Or from '../../../components/Button/Or';
import CreateAc from '../../../components/Button/CreateAc';
import { useRegistration } from '../../../context/RegistrationContext';

export default function UpdateUser() {
  const route = useRoute();

  const { userEmail } = useRegistration();
  const navigation = useNavigation();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const routeEmail = route?.params?.email || userEmail || "";

  const fullName = useMemo(
    () => `${firstName}`.trim() + (lastName.trim() ? ` ${lastName.trim()}` : ''),
    [firstName, lastName]
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const fetchAndPrefill = useCallback(async () => {
    if (!routeEmail) {
      setLoading(false);
      Toast.show(TOAST.errorBottom('Missing email', 'No email provided to fetch profile'));
      return;
    }
    try {
      setLoading(true);
      const token = await getAccessToken();
      const res = await api.get('/api/auth/retriveUser', {
        params: { email: routeEmail },
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res?.data || {};
      setUserId(data.id ?? null);
      setEmail(data.email ?? '');
      setPhone(data.phone ?? '');
      setPhone2(data.phone2 ?? '');
      setAddress(data.address ?? '');

      const name = (data.name || '').trim();
      if (name.includes(' ')) {
        const parts = name.split(' ');
        setFirstName(parts.slice(0, -1).join(' '));
        setLastName(parts.slice(-1).join(''));
      } else {
        setFirstName(name);
        setLastName('');
      }
    } catch (err) {
      const msg = err?.response?.data || err?.message || 'Failed to load profile';
      Toast.show(TOAST.errorBottom('Load failed', String(msg)));
    } finally {
      setLoading(false);
    }
  }, [routeEmail]);

  useEffect(() => { fetchAndPrefill(); }, [fetchAndPrefill]);

  const onSave = useCallback(async () => {
    if (submitting) return;

    if (!userId) {
      Toast.show(TOAST.errorBottom('Cannot update', 'User id missing'));
      return;
    }
    if (!email.trim() || !fullName.trim() || !phone.trim() || !address.trim()) {
      Toast.show(TOAST.errorBottom('Missing data', 'Email, Name, Phone and Address are required'));
      return;
    }

    const payload = {
      id: userId,
      email: email.trim(),
      name: fullName.trim(),
      phone: phone.trim(),
      phone2: (phone2 || '').trim(),
      address: address.trim(),
    };

    try {
      setSubmitting(true);
      const token = await getAccessToken();
      const res = await api.put('/api/auth/updateUser', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (res?.status === 200) {
        Toast.show(TOAST.success('Updated', 'User updated successfully'));
        await fetchAndPrefill();
        navigation.navigate("Login");
      } else {
        Toast.show(TOAST.errorBottom('Update failed', 'Unexpected server response'));
      }
    } catch (err) {
      const msg = err?.response?.data;
      Toast.show(TOAST.errorBottom('Update failed', (typeof msg === 'string' && msg) || err?.message || 'Network/server error'));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, userId, email, fullName, phone, phone2, address, fetchAndPrefill]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={registeroverlay} style={styles.image} />
      <View style={styles.backtop} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={backBtn} style={styles.imagein} />
      </TouchableOpacity>

      <Image source={overlap} style={styles.regback} />

      <Text style={styles.title}>The Smart Laundry.</Text>
      <Text style={styles.subtitle}>Update Profile</Text>

      <BlurView style={{ marginTop: keyboardVisible ? '-35%' : undefined }} intensity={keyboardVisible ? 20 : 0}>
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
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { opacity: submitting ? tokens.opacities.disabled : 1 }]}
            onPress={onSave}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Text>
          </TouchableOpacity>
          <Or />

          <CreateAc
            butname="Back to profile"
            navigation={navigation}
            path="ProfileUser"
          />
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  image: { position: 'absolute', width: '100%', height: '40%' },
  backtop: { position: 'absolute', top: 0, backgroundColor: 'rgba(60,66,52,0.7)', width: '100%', height: '40%' },

  imagein: { marginTop: '15%', marginLeft: '5%' },
  regback: { bottom: 0, width: '100%', height: '53%', position: 'absolute', marginBottom: '21%' },

  title: { fontSize: 35, color: '#F2EBBC', fontWeight: 'bold', top: '8%', marginLeft: '10%' },
  subtitle: { fontSize: 15, color: '#F2EBBC', fontWeight: '500', top: '8%', marginLeft: '10%' },

  scrollContainer: { flexGrow: 1, justifyContent: 'center' },

  fields: {
    width: '80%',
    alignSelf: 'center',
    marginTop: '38%',
  },
  input: {
    height: tokens.sizes.inputHeight,
    width: '100%',
    borderBottomWidth: tokens.components.Input.borderBottomWidth,
    borderBottomColor: tokens.colors.bottomBorder,
    marginBottom: tokens.spacing.sm,
    paddingLeft: tokens.components.Input.paddingLeft,
    fontSize: tokens.components.Input.fontSize,
  },

  primaryButton: {
    width: '75%',
    height: tokens.sizes.buttonHeight,
    backgroundColor: tokens.colors.greenButton,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xxl,
    alignSelf: 'center'
  },
  primaryButtonText: {
    fontSize: tokens.components.Typography.body.fontSize,
    ...tokens.components.Button.text.style,
    color: tokens.components.Button.text.color,
  },
});
