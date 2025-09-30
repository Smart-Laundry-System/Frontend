import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Image,
  StyleSheet,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Switch } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';

import RegistreTop from '../../components/UserTop/RegistreTop';
import Or from '../../components/Button/Or';
import CreateAc from '../../components/Button/CreateAc';
import { useRegistration } from '../../context/RegistrationContext';
import { isValidEmail, isValidPassword, TOAST, tokens } from '../../styles/theme';


function UserRegistre({ navigation }) {
  const {
    isSwitchOn,
    setIsSwitchOn,
    basicInfo,
    updateBasicInfo,
    setBasicInfo,
  } = useRegistration();

  const [laundryName, setLaundryName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [serviceInputs, setServiceInputs] = useState(['']);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const outerScrollRef = useRef(null);

  useEffect(() => {
    if (!basicInfo) return;
    setLaundryName(basicInfo.laundryName ?? '');
    setAddress(basicInfo.address ?? '');
    setPhone(basicInfo.phone ?? '');
    setPhone2(basicInfo.phone2 ?? '');
    setEmail(basicInfo.email ?? '');
    setPassword(basicInfo.password ?? '');

    const svc = (basicInfo.selectedOptions ?? [])
      .map((o) => (o?.name ?? o?.title ?? '').trim())
      .filter(Boolean);
    setServiceInputs(svc.length ? svc : ['']);
  }, [basicInfo]);

  const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

  // -------- Dynamic services handlers --------
  const addServiceRow = () => setServiceInputs((prev) => [...prev, '']);
  const updateServiceRow = (idx, text) =>
    setServiceInputs((prev) => prev.map((v, i) => (i === idx ? text : v)));
  const removeServiceRow = (idx) =>
    setServiceInputs((prev) => prev.filter((_, i) => i !== idx));

  // -------- Keyboard spacing (limit max scroll to the keyboard top) --------
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvt, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvt, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // -------- Submit --------
  const controlLogin = () => {
    const errors = [];
    if (!isNonEmpty(laundryName)) errors.push('Laundry name');
    if (!isNonEmpty(address)) errors.push('Address');
    if (!isNonEmpty(phone)) errors.push('Phone');

    if (!isNonEmpty(email)) errors.push('Email');
    else if (!isValidEmail(email)) {
      Toast.show(
        TOAST.errorBottom(
          "Weak Password",
          "Password must be at least 8 characters and include one symbol"
        )
      );
      return;
    };

    if (!isNonEmpty(password)) errors.push('Password');
    else if (!isValidPassword(password)) {
      Toast.show(
        TOAST.errorBottom(
          "Weak Password",
          "Password must be at least 8 characters and include one symbol"
        )
      );
      return;
    };

    const selectedNames = serviceInputs.map((s) => (s || '').trim()).filter(Boolean);
    const uniqueNames = Array.from(new Set(selectedNames));
    if (!uniqueNames.length) errors.push('At least one service');

    if (errors.length) {
      Toast.show(TOAST.errorBottom("Smart Laundry", `Please provide: ${errors.join(', ')}`));
      return;
    }

    const selectedOptions = uniqueNames.map((name) => ({ name, price: '' }));
    const payload = {
      laundryName: laundryName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      phone2: phone2.trim(),
      email: email.trim(),
      password,
      selectedOptions,
      role: basicInfo?.role ?? 'LAUNDRY',
    };

    if (typeof updateBasicInfo === 'function') {
      updateBasicInfo(payload);
    } else {
      setBasicInfo((prev) => ({ ...(prev ?? {}), ...payload }));
    }

    navigation.navigate('HotelRegister2', payload);
  };

  const onToggleSwitch = () => setIsSwitchOn((v) => !v);

  const blurStyle = keyboardVisible ? { marginTop: -Math.round(0.4 * winW) } : undefined;

  return (
    <ScrollView
      ref={outerScrollRef}
      contentContainerStyle={[
        styles.scrollContainertop,
        { paddingBottom: keyboardHeight + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Image source={registeroverlay} style={styles.image} />
        <View style={styles.switchset}>
          <Text style={styles.switchText}>{!isSwitchOn ? 'Hotel Admin' : 'Personal'}</Text>
          <View
            style={[
              styles.switch,
              { backgroundColor: isSwitchOn ? tokens.colors.switchact : tokens.colors.switchoff },
            ]}
          >
            <Switch
              trackColor={{ false: tokens.colors.switchoff, true: tokens.colors.switchact }}
              thumbColor={isSwitchOn ? tokens.colors.switchthumb : tokens.colors.card}
              value={isSwitchOn}
              onValueChange={onToggleSwitch}
            />
          </View>
        </View>

        <View style={styles.backtop} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.forback}>
          <Image source={inerbutton} style={styles.imagein} />
        </TouchableOpacity>

        <Image source={overlap} style={styles.regback} />
        <Text style={styles.text}>The Smart Laundry.</Text>
        <Text style={styles.textsub}>Create Account</Text>

        <BlurView style={blurStyle} intensity={keyboardVisible ? tokens.blur.modal : tokens.blur.screen}>
          <TouchableOpacity activeOpacity={1}>
            {isSwitchOn && <RegistreTop navigation={navigation} />}

            {!isSwitchOn && (
              // keep inner ScrollView for your form; it doesn't need to scroll when keyboard is open
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                // prevent nested scroll fighting; outer scroll handles the keyboard
                scrollEnabled={false}
              >
                <View style={styles.fields}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name of the laundry"
                    keyboardType="default"
                    value={laundryName}
                    onChangeText={setLaundryName}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="LAN Phone"
                    keyboardType="phone-pad"
                    value={phone2}
                    onChangeText={setPhone2}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={{ marginTop: 8, marginBottom: 6, color: tokens.colors.darkText }}>Services Type</Text>

                  {serviceInputs.map((val, idx) => (
                    <View key={`svc-${idx}`} style={styles.serviceRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder={`Service ${idx + 1} (e.g., Ironing)`}
                        placeholderTextColor={keyboardVisible ? tokens.colors.shadow : undefined}
                        value={val}
                        onChangeText={(t) => updateServiceRow(idx, t)}
                        autoCapitalize="words"
                      />
                      {serviceInputs.length > 1 && (
                        <TouchableOpacity style={styles.removeButton} onPress={() => removeServiceRow(idx)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={addServiceRow}
                    style={[
                      styles.removeButton,
                      { alignSelf: 'flex-start', backgroundColor: tokens.colors.addbutton, marginTop: 10 },
                    ]}
                  >
                    <Text style={[styles.removeText, { color: tokens.colors.darkText }]}>+ Add another service</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </TouchableOpacity>
        </BlurView>

        {!isSwitchOn && (
          <TouchableOpacity style={styles.loginButton} onPress={controlLogin}>
            <Text style={styles.loginButtonText}>Next</Text>
          </TouchableOpacity>
        )}

        <Or />
        <CreateAc butname="For Login" navigation={navigation} path="Login" />
      </View>
    </ScrollView>
  );
}

const { width: winW } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContainertop: { flexGrow: 1, backgroundColor: tokens.colors.background }, // outer scroll content
  switch: { position: 'absolute', right: 30, top: 50, zIndex: 100, borderRadius: tokens.radius.full },
  switchText: { fontSize: tokens.components.Typography.body.fontSize, position: 'absolute', right: 85, top: 58, zIndex: 90, color: tokens.colors.switchact },
  switchset: { flexDirection: 'row' },
  loginButton: {
    width: "75%",
    height: tokens.sizes.buttonHeight,
    backgroundColor: tokens.colors.greenButton,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xxl,
    alignSelf: 'center',
  },
  loginButtonText: {
    fontSize: tokens.components.Typography.body.fontSize,
    ...tokens.components.Button.text.style,
    color: tokens.components.Button.text.color,
  },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Math.round(winW * 0.1) },
  regback: { bottom: 0, width: '100%', height: '53%', position: 'absolute', marginBottom: '21%' },
  container: { flex: 1 },
  image: { position: 'absolute', width: '100%', height: '40%' },
  forback: { top: '6.5%', left: '6%', width: '8%', aspectRatio: 1, overflow: 'hidden' },
  imagein: { resizeMode: 'cover' },
  text: {
    fontSize: tokens.components.Typography.h1.fontSize,
    ...tokens.components.Typography.h1,
    color: tokens.colors.switchact,
    top: '8%',
    marginLeft: '10%'
  },
  backtop: { position: 'absolute', top: 0, backgroundColor: tokens.overlays.topdark, width: '100%', height: '40%' },
  textsub: { fontSize: tokens.components.Typography.body.fontSize, color: tokens.colors.switchact, fontWeight: '500', top: '8%', marginLeft: '10%' },
  fields: { width: '80%', alignSelf: 'center', marginTop: '58%' },
  input: {
    height: 40, width: '100%', borderBottomWidth: 1,
    borderBottomColor: tokens.colors.bottomBorder, marginBottom: tokens.spacing.sm, 
    paddingLeft: tokens.components.Input.paddingLeft, 
    fontSize: tokens.components.Input.fontSize
  },
  removeButton: { backgroundColor: tokens.colors.greenButton, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, marginLeft: tokens.spacing.sm },
  removeText: { color: tokens.colors.darkText, ...tokens.fonts.bold },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
});

export default UserRegistre;
