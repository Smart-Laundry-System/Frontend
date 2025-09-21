// src/screens/auth/HotelRegisterFinal.jsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Image,
  StyleSheet,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';
import { BlurView } from 'expo-blur';
import { Switch } from 'react-native-paper';
import RegistreTop from '../../components/UserTop/RegistreTop';
import Or from '../../components/Button/Or';
import CreateAc from '../../components/Button/CreateAc';
import { api } from '../../Services/api';
import Toast from 'react-native-toast-message';
import { useRegistration } from '../../context/RegistrationContext';

const { width } = Dimensions.get('window');

// Match backend constraints
const ABOUT_MIN = 60;
const ABOUT_MAX = 1200;

function HotelRegisterFinal({ route, navigation }) {
  // Route params from previous screen (fallbacks)
  const {
    laundryName: pLaundryName,
    address: pAddress,
    phone: pPhone,
    phone2: pPhone2,
    email: pEmail,
    password: pPassword,
    role: pRole,
    availableItems: pAvailableItems,
    otherItems: pOtherItems,
    services: pServices,               // [{ title, price }]
    laundryImageUrl: pLaundryImageUrl, // string
  } = route.params || {};

  // Context (preferred source of truth)
  const { basicInfo, updateBasicInfo, resetAll } = useRegistration();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keyboard → keep buttons above the keyboard, same logic as before
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvt, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e?.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvt, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => { show.remove(); hide.remove(); };
  }, []);

  const onToggleSwitch = () => setIsSwitchOn(v => !v);

  // Prefer context values; fallback to route params
  const laundryName = basicInfo?.laundryName ?? pLaundryName ?? '';
  const address = basicInfo?.address ?? pAddress ?? '';
  const phone = basicInfo?.phone ?? pPhone ?? '';
  const phone2 = basicInfo?.phone2 ?? pPhone2 ?? '';
  const email = basicInfo?.email ?? pEmail ?? '';
  const password = basicInfo?.password ?? pPassword ?? '';
  const role = basicInfo?.role ?? pRole ?? 'LAUNDRY';
  const services =
    (Array.isArray(basicInfo?.services) && basicInfo.services.length ? basicInfo.services : pServices) || [];
  const availableItems =
    (Array.isArray(basicInfo?.availableItems) && basicInfo.availableItems.length ? basicInfo.availableItems : pAvailableItems) || [];
  const otherItems =
    (Array.isArray(basicInfo?.otherItems) ? basicInfo.otherItems : pOtherItems) || [];
  const laundryImageUrl = basicInfo?.laundryImageUrl ?? pLaundryImageUrl ?? '';
  const openTime = basicInfo?.openTime;
  const closeTime = basicInfo?.closeTime;
  // Live character count (backend counts raw length, not trimmed)
  const charCount = message.length;
  const tooShort = charCount < ABOUT_MIN;

  const controlLogin = async () => {
    if (submitting) return;

    const unpriced = (services || []).filter(
      s => s.title && (!s.price || String(s.price).trim() === '')
    );
    if (unpriced.length) {
      Toast.show({
        type: 'error',
        text1: 'Missing prices',
        text2: 'Please price all services.',
        position: 'bottom',
      });
      return;
    }
    if (!availableItems || availableItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing items',
        text2: 'Pick at least one available item.',
        position: 'bottom',
      });
      return;
    }
    // NotBlank + @Size(min=60, max=1200) mirrored here:
    if (message.trim().length === 0) {
      Toast.show({
        type: 'error',
        text1: 'About is required',
        text2: 'Please write a short description.',
        position: 'bottom',
      });
      return;
    }
    if (charCount < ABOUT_MIN) {
      Toast.show({
        type: 'error',
        text1: 'About is too short',
        text2: `Minimum ${ABOUT_MIN} characters (you have ${charCount}).`,
        position: 'bottom',
      });
      return;
    }
    // no need to check > ABOUT_MAX because maxLength prevents it, but safe-guard:
    if (charCount > ABOUT_MAX) {
      Toast.show({
        type: 'error',
        text1: 'About is too long',
        text2: `Maximum ${ABOUT_MAX} characters.`,
        position: 'bottom',
      });
      return;
    }

    // Persist "about" into context as well
    updateBasicInfo({ about: message });

    const payload = {
      email,
      name: laundryName,
      password,
      role,
      phone,
      phone_2: phone2,
      address,
      services,
      availableItems,
      otherItems,
      laundryImg: laundryImageUrl,
      about: message,
      openTime:openTime,
      closeTime:closeTime
    };

    try {
      setSubmitting(true);
      const res = await api.post('/auth/v1/addLaundry', payload);
      if (res?.status === 200 && res?.data) {
        resetAll();
        Toast.show({
          type: 'success',
          text1: 'Registration successful',
          text2: 'Use your credentials to login',
          position: 'top',
        });
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration failed',
          text2: 'Unexpected server response',
          position: 'bottom',
        });
      }
    } catch (err) {
      const serverMsg = err?.response?.data;
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2:
          (typeof serverMsg === 'string' && serverMsg) ||
          err?.message ||
          'Network/server error',
        position: 'bottom',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // OUTER scroll handles keyboard; buttons scroll with the form and stop above keyboard
    <ScrollView
      contentContainerStyle={[styles.scrollContainerBlur, { paddingBottom: keyboardHeight + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Image source={registeroverlay} style={styles.image} />

        {/* switch header (unchanged) */}
        <View style={styles.switchset}>
          <Text style={styles.switchText}>{!isSwitchOn ? 'Hotel Admin' : 'Personal'}</Text>
          <View style={[styles.switch, { backgroundColor: isSwitchOn ? '#F2EBBC' : 'rgba(0,0,0,0.8)' }]}>
            <Switch
              trackColor={{ false: 'rgba(0,0,0,0.8)', true: '#F2EBBC' }}
              thumbColor={isSwitchOn ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)'}
              value={isSwitchOn}
              onValueChange={onToggleSwitch}
            />
          </View>
        </View>

        <View style={styles.backtop} />

        <TouchableOpacity onPress={() => navigation.navigate('HotelRegister2')}>
          <Image source={inerbutton} style={styles.imagein} />
        </TouchableOpacity>

        <Image source={overlap} style={styles.regback} />
        <Text style={styles.text}>The Smart Laundry.</Text>
        <Text style={styles.textsub}>Create Account</Text>

        <BlurView style={{ marginTop: keyboardVisible ? '-35%' : undefined }} intensity={keyboardVisible ? 20 : 0}>
          {/* pass switch props if RegistreTop needs them */}
          {isSwitchOn && (
            <RegistreTop
              navigation={navigation}
              isSwitchOn={isSwitchOn}
              onToggleSwitch={onToggleSwitch}
            />
          )}

          {!isSwitchOn && (
            // inner form not scrollable; outer scroll takes over
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            >
              <View style={styles.fields}>
                <TextInput
                  style={styles.input}
                  placeholder="About the laundry"
                  editable={false}
                  placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                />

                <TextInput
                  style={styles.inputin}
                  placeholder="Message"
                  multiline
                  numberOfLines={4}
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                  autoCapitalize="sentences"
                  autoCorrect
                  maxLength={ABOUT_MAX}    // ← hard-cap at 1200
                />

                {/* right-aligned helper / counter (no style changes elsewhere) */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, opacity: tooShort ? 1 : 0.7, color: tooShort ? '#B00020' : '#333' }}>
                    {charCount}/{ABOUT_MAX}{tooShort ? `  • need ${ABOUT_MIN - charCount} more` : ''}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </BlurView>

        {/* Buttons live inside the OUTER ScrollView */}
        <TouchableOpacity
          style={[styles.loginButton, submitting && { opacity: 0.6 }]}
          onPress={controlLogin}
          disabled={submitting}
        >
          <Text style={styles.loginButtonText}>
            {submitting ? 'Submitting...' : 'Sign up'}
          </Text>
        </TouchableOpacity>

        <Or />
        <CreateAc butname="For Login" navigation={navigation} path="Login" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainerBlur: { flexGrow: 1, backgroundColor: '#ffff' },
  container: { flex: 1 },
  image: { position: 'absolute', width: '100%', height: '40%' },
  backtop: { position: 'absolute', top: 0, backgroundColor: 'rgba(60,66,52,0.7)', width: '100%', height: '40%' },

  // same header coordinates
  switchset: { flexDirection: 'row' },
  switchText: { fontSize: 15, position: 'absolute', right: 85, top: 58, zIndex: 90, color: '#F2EBBC' },
  switch: { position: 'absolute', right: 30, top: 50, zIndex: 100, borderRadius: 50 },

  text: { fontSize: 35, color: '#F2EBBC', fontWeight: 'bold', top: '8%', marginLeft: '10%' },
  textsub: { fontSize: 15, color: '#F2EBBC', fontWeight: '500', top: '8%', marginLeft: '10%' },

  regback: { bottom: 0, width: '100%', height: '53%', position: 'absolute', marginBottom: '21%' },
  imagein: { marginTop: '15%', marginLeft: '5%' },

  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Math.round(width * 0.1) },

  fields: { width: '80%', alignSelf: 'center', marginTop: '45%' },

  input: { height: 50, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', marginBottom: 15, paddingLeft: 15, fontSize: 16 },
  inputin: {
    height: 150,
    width: '100%',
    marginBottom: 8, // tightened slightly so the counter sits closer (no global style changes)
    paddingLeft: 15,
    fontSize: 16,
    borderColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    textAlignVertical: 'top',
  },

  loginButton: {
    width: '75%',
    height: 42,
    backgroundColor: '#A3AE95',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
    alignSelf: 'center',
  },
  loginButtonText: { fontSize: 15, fontWeight: 'bold', color: '#3C4234' },
});

export default HotelRegisterFinal;
