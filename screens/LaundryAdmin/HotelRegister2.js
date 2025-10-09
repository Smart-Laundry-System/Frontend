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
  Dimensions,
  Platform,
  Pressable,
  Image as RNImage,
} from 'react-native';
import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';
import { BlurView } from 'expo-blur';
import { Provider as PaperProvider, Switch } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import IconOpen from '../../assets/icon.png';
import IconClose from '../../assets/iconopen.png';
import CreateAc from '../../components/Button/CreateAc';
import upload from '../../assets/upload.png';
import * as ImagePicker from 'expo-image-picker';
import RegistreTop from '../../components/UserTop/RegistreTop';
import Or from '../../components/Button/Or';
import { uploadImageFile } from '../../Services/api';
import { useRegistration } from '../../context/RegistrationContext';
import Toast from 'react-native-toast-message';
import { TOAST } from '../../styles/theme';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const GREEN = '#A3AE95';
const TEXT = '#3C4234';
const LIGHT = '#F2EBBC';

function HotelRegister2({ route, navigation }) {
  const {
    laundryName,
    address,
    phone,
    phone2,
    email,
    password,
    selectedOptions,
  } = route.params || {};

  const { basicInfo, updateBasicInfo, isSwitchOn, setIsSwitchOn } = useRegistration();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [availableItems, setAvailableItems] = useState([]);
  const [isDropdownVisiblet, setDropdownVisiblet] = useState(false);
  const [otherItems, setOtherItems] = useState([]);
  const [imageUri, setImageUri] = useState('');
  const [services, setServices] = useState([]);

  const [openTimeStr, setOpenTimeStr] = useState(basicInfo?.openTime || '');
  const [closeTimeStr, setCloseTimeStr] = useState(basicInfo?.closeTime || '');
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  const clothes = ['Jackets', 'Veshti', 'Others(Add more cloths)'];
  const types = ['Carpet', 'Curtain'];

  const pad2 = (n) => String(n).padStart(2, '0');
  const toHHmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const fromHHmm = (s) => {
    const d = new Date();
    const [h, m] = String(s || '').split(':').map(Number);
    d.setSeconds(0, 0);
    if (Number.isFinite(h)) d.setHours(h);
    if (Number.isFinite(m)) d.setMinutes(m);
    return d;
  };

  useEffect(() => {
    const source =
      Array.isArray(selectedOptions) && selectedOptions.length
        ? selectedOptions
        : Array.isArray(basicInfo?.selectedOptions)
          ? basicInfo.selectedOptions
          : [];

    const initial = source
      .map((opt) =>
        typeof opt === 'string'
          ? { title: opt, price: '' }
          : { title: opt?.title ?? opt?.name ?? '', price: opt?.price ?? '' }
      )
      .filter((s) => s.title);

    const priced = Array.isArray(basicInfo?.services) ? basicInfo.services : [];
    const merged = initial.map((s) => {
      const match = priced.find((p) => p.title === s.title);
      return match ? { ...s, price: match.price ?? '' } : s;
    });

    setServices(merged);
  }, [selectedOptions, basicInfo?.selectedOptions, basicInfo?.services]);

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

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const toggleItem = (option) => {
    setAvailableItems((prev) => {
      const exists = prev.includes(option);
      const next = exists ? prev.filter((v) => v !== option) : [...prev, option];

      if (!exists && option === 'Others(Add more cloths)') {
        setOtherItems((oi) => (oi.length === 0 ? [''] : oi));
      }
      if (exists && option === 'Others(Add more cloths)') {
        setOtherItems([]);
      }
      return next;
    });
  };

  const toggleDropdownt = () => setDropdownVisiblet((v) => !v);
  const onToggleSwitch = () => setIsSwitchOn((v) => !v);

  const updateServicePrice = (title, value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setServices((prev) => prev.map((s) => (s.title === title ? { ...s, price: sanitized } : s)));
  };

  const pickImageL = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show(TOAST.errorBottom('Permission required', 'Enable Photo Library permission.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0]?.uri || '');
  };
  const removeImage = () => setImageUri('');

  const addOtherItem = () => setOtherItems((prev) => [...prev, '']);
  const updateOtherItem = (idx, text) =>
    setOtherItems((prev) => prev.map((v, i) => (i === idx ? text : v)));
  const removeOtherItem = (idx) =>
    setOtherItems((prev) => prev.filter((_, i) => i !== idx));

  const onPickOpenConfirm = (date) => setOpenTimeStr(toHHmm(date));
  const onPickCloseConfirm = (date) => setCloseTimeStr(toHHmm(date));
  const closeOpenPicker = () => setShowOpenPicker(false);
  const closeClosedPicker = () => setShowClosePicker(false);

  const handleNext = async () => {
    try {
      if (!openTimeStr || !closeTimeStr) {
        Toast.show(TOAST.errorBottom('Missing time', 'Please select both open time and close time.'));
        return;
      }

      const cleanedOtherItems = (availableItems.includes('Others(Add more cloths)') ? otherItems : [])
        .map((s) => (s || '').trim())
        .filter(Boolean);

      const emptyPrices = services.filter((s) => s.title && (s.price ?? '').trim() === '');
      if (emptyPrices.length > 0) {
        Toast.show(TOAST.errorBottom('Missing prices', 'Please enter a price for all selected services.'));
        return;
      }

      const cleanedTypes = availableItems.filter((x) => types.includes(x));
      const cleanedCloths = availableItems.filter(
        (x) => clothes.includes(x) && x !== 'Others(Add more cloths)'
      );

      let laundryImageUrl = '';
      if (imageUri) {
        const up = await uploadImageFile(imageUri);
        laundryImageUrl = up?.url || up?.absoluteUrl || '';
      }

      const availableItemsFinal = [...cleanedTypes, ...cleanedCloths, ...cleanedOtherItems];

      updateBasicInfo({
        services,
        availableItems: availableItemsFinal,
        otherItems: cleanedOtherItems,
        laundryImageUrl,
        openTime: openTimeStr,
        closeTime: closeTimeStr,
      });

      navigation.navigate('HotelRegisterFinal', {
        laundryName,
        address,
        phone,
        phone2,
        email,
        password,
        role: 'LAUNDRY',
        services,
        availableItems: availableItemsFinal,
        otherItems: cleanedOtherItems,
        laundryImageUrl,
        openTime: openTimeStr,
        closeTime: closeTimeStr,
      });
    } catch (err) {
      Toast.show(TOAST.errorBottom('Upload error', err?.message ?? 'Failed while uploading image.'));
    }
  };

  const hasOthers = availableItems.includes('Others(Add more cloths)');
  const otherCount = hasOthers ? otherItems.length : 0;
  const hasImage = !!imageUri;

  const BASE_PT = 0.2 * SCREEN_H;
  const PER_OTHER_PT = 0.1 * SCREEN_H;
  const EXTRA_WITH_IMAGE_PT = hasImage ? 0.12 * SCREEN_H : 0;

  const dynamicPaddingTop = isDropdownVisiblet
    ? BASE_PT + otherCount * PER_OTHER_PT + EXTRA_WITH_IMAGE_PT
    : BASE_PT + EXTRA_WITH_IMAGE_PT;

  return (
    <PaperProvider>
      <ScrollView
        contentContainerStyle={[styles.scrollContainerBlur, { paddingBottom: keyboardHeight + 24 }]}
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
                { backgroundColor: isSwitchOn ? '#F2EBBC' : 'rgba(0,0,0,0.8)' },
              ]}
            >
              <Switch
                trackColor={{ false: 'rgba(0,0,0,0.8)', true: '#F2EBBC' }}
                thumbColor={isSwitchOn ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)'}
                value={isSwitchOn}
                onValueChange={onToggleSwitch}
              />
            </View>
          </View>

          <View style={styles.backtop} />
          <TouchableOpacity onPress={() => navigation.navigate('UserRegistration')}>
            <Image source={inerbutton} style={styles.imagein} />
          </TouchableOpacity>

          <Image source={overlap} style={styles.regback} />
          <Text style={styles.text}>The Smart Laundry.</Text>
          <Text style={styles.textsub}>Create Account</Text>

          <BlurView style={{ marginTop: keyboardVisible ? '-35%' : undefined }} intensity={keyboardVisible ? 20 : 0}>
            <TouchableOpacity activeOpacity={1} onPress={() => setDropdownVisiblet(false)}>
              {isSwitchOn && <RegistreTop navigation={navigation} />}

              {!isSwitchOn && (
                <ScrollView
                  contentContainerStyle={styles.scrollContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                >
                  <View style={[styles.fields, { paddingTop: dynamicPaddingTop }]}>

                    <View style={styles.timeRow}>
                      <View style={styles.timeCol}>
                        <Pressable style={styles.timeBox} onPress={() => setShowOpenPicker(true)}>
                          <Text style={[styles.timeText, !openTimeStr && styles.timePlaceholder]}>
                            {openTimeStr || 'Open (HH:mm)'}
                          </Text>
                        </Pressable>
                        <Text style={styles.timeLabel}>Open</Text>
                      </View>

                      <View style={styles.vertDivider} />

                      <View style={styles.timeCol}>
                        <Pressable style={styles.timeBox} onPress={() => setShowClosePicker(true)}>
                          <Text style={[styles.timeText, !closeTimeStr && styles.timePlaceholder]}>
                            {closeTimeStr || 'Close (HH:mm)'}
                          </Text>
                        </Pressable>
                        <Text style={styles.timeLabel}>Close</Text>
                      </View>
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="Selected Services & Prices"
                      editable={false}
                      placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                    />

                    {services.map((s) => (
                      <View key={s.title} style={styles.serviceRow}>
                        <Text style={styles.serviceName}>{s.title}</Text>
                        <View style={styles.priceWrap}>
                          <Text style={styles.rs}>Rs.</Text>
                          <TextInput
                            style={styles.priceInput}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={s.price}
                            onChangeText={(t) => updateServicePrice(s.title, t)}
                            placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                          />
                        </View>
                      </View>
                    ))}

                    <View style={styles.dropdownContainer}>
                      <View style={styles.dropdownMenu}>
                        {types.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.dropdownItem}
                            activeOpacity={1}
                            onPress={() => toggleItem(option)}
                          >
                            <Text style={[styles.checkbox, availableItems.includes(option) && styles.checked]}>
                              {availableItems.includes(option) ? '✓' : ' '}
                            </Text>
                            <Text style={[styles.dropdownItemText, { color: keyboardVisible ? 'black' : '#999' }]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={toggleDropdownt}
                          style={[styles.dropdownItem, { flexDirection: 'row' }]}
                        >
                          <Text style={{ color: keyboardVisible ? 'black' : '#999' }}>Clothes Item (KG)</Text>
                          <RNImage
                            source={IconOpen}
                            style={{ marginLeft: '30%', opacity: 0.6, display: isDropdownVisiblet ? 'none' : 'flex' }}
                          />
                          <RNImage
                            source={IconClose}
                            style={{ marginLeft: '30%', display: isDropdownVisiblet ? 'flex' : 'none' }}
                          />
                        </TouchableOpacity>
                      </View>

                      {isDropdownVisiblet && (
                        <View style={styles.dropdownMenuc}>
                          {clothes.map((optionc) => (
                            <View key={optionc} style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <TouchableOpacity
                                style={[styles.dropdownItem, { flex: 1 }]}
                                activeOpacity={1}
                                onPress={() => toggleItem(optionc)}
                              >
                                <Text style={[styles.checkbox, availableItems.includes(optionc) && styles.checked]}>
                                  {availableItems.includes(optionc) ? '✓' : ' '}
                                </Text>
                                <Text style={[styles.dropdownItemText, { color: keyboardVisible ? 'black' : '#999' }]}>
                                  {optionc}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}

                          {availableItems.includes('Others(Add more cloths)') && (
                            <View style={{ width: '100%', paddingVertical: 12, gap: 8 }}>
                              {otherItems.map((val, idx) => (
                                <View
                                  key={`oi-${idx}`}
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 }}
                                >
                                  <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder={`Other item ${idx + 1}`}
                                    placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                                    value={val}
                                    onChangeText={(t) => updateOtherItem(idx, t)}
                                  />
                                  <TouchableOpacity onPress={() => removeOtherItem(idx)} style={styles.removeButton}>
                                    <Text style={styles.removeText}>Remove</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}

                              <TouchableOpacity
                                onPress={addOtherItem}
                                style={[styles.removeButton, { alignSelf: 'flex-start', marginLeft: 10, backgroundColor: '#D9E0CF' }]}
                              >
                                <Text style={[styles.removeText, { color: '#2E3329' }]}>+ Add another item</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <TouchableOpacity onPress={pickImageL}>
                      <TextInput
                        style={styles.input}
                        placeholder="Upload a Laundry Image"
                        editable={false}
                        placeholderTextColor={keyboardVisible ? 'black' : '#999'}
                      />
                      <RNImage
                        source={upload}
                        style={{ position: 'absolute', width: 25, height: 25, right: 15, top: 15 }}
                      />
                    </TouchableOpacity>

                    {imageUri ? (
                      <View style={{ alignItems: 'center' }}>
                        <RNImage
                          source={{ uri: imageUri }}
                          style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8 }}
                        />
                        <TouchableOpacity onPress={removeImage} style={styles.removeButtonL}>
                          <Text style={styles.removeText}>Remove Image</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text>No image selected</Text>
                    )}
                  </View>
                </ScrollView>
              )}
            </TouchableOpacity>
          </BlurView>

          {!isSwitchOn && (<TouchableOpacity style={styles.loginButton} onPress={handleNext}>
            <Text style={styles.loginButtonText}>Next</Text>
          </TouchableOpacity>)}

          <Or />
          <CreateAc butname="For Login" navigation={navigation} path="Login" />
        </View>
        <DateTimePickerModal
          isVisible={showOpenPicker}
          mode="time"
          is24Hour
          date={openTimeStr ? fromHHmm(openTimeStr) : new Date()}
          onConfirm={(d) => {
            onPickOpenConfirm(d);
            setShowOpenPicker(false);
          }}
          onCancel={() => setShowOpenPicker(false)}
          customCancelButtonIOS={() => null}
          customConfirmButtonIOS={({ onPress }) => (
            <TouchableOpacity style={styles.iosFullWidthBtn} onPress={onPress} activeOpacity={0.9}>
              <Text style={styles.iosFullWidthBtnText}>Save</Text>
            </TouchableOpacity>
          )}
          headerTextIOS="Opening time"
          display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
          minuteInterval={1}
          buttonTextColorIOS={TEXT}
          textColor={TEXT}
          themeVariant="light"
          pickerContainerStyleIOS={[
            styles.pickerContainerIOS,
            { marginBottom: keyboardVisible ? 300 : 0 },
          ]}
          modalProps={{
            presentationStyle: 'overFullScreen',
            style: { flex: 1, justifyContent: 'center', alignItems: 'center' },
          }}
          onBackdropPress={() => setShowOpenPicker(false)}
          onBackButtonPress={() => setShowOpenPicker(false)}
        />

        <DateTimePickerModal
          isVisible={showClosePicker}
          mode="time"
          is24Hour
          date={closeTimeStr ? fromHHmm(closeTimeStr) : new Date()}
          onConfirm={(d) => {
            onPickCloseConfirm(d);
            setShowClosePicker(false);
          }}
          onCancel={() => setShowClosePicker(false)}
          customCancelButtonIOS={() => null}
          customConfirmButtonIOS={({ onPress }) => (
            <TouchableOpacity style={styles.iosFullWidthBtn} onPress={onPress} activeOpacity={0.9}>
              <Text style={styles.iosFullWidthBtnText}>Save</Text>
            </TouchableOpacity>
          )}
          headerTextIOS="Closing time"
          display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
          minuteInterval={1}
          buttonTextColorIOS={TEXT}
          textColor={TEXT}
          themeVariant="light"
          pickerContainerStyleIOS={[
            styles.pickerContainerIOS,
            { marginBottom: keyboardVisible ? 300 : 0 },
          ]}
          modalProps={{
            presentationStyle: 'overFullScreen',
            style: { flex: 1, justifyContent: 'center', alignItems: 'center' },
          }}
          onBackdropPress={() => setShowClosePicker(false)}
          onBackButtonPress={() => setShowClosePicker(false)}
        />

      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  scrollContainerBlur: { flexGrow: 1, backgroundColor: '#ffff' },
  imageWrapperL: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', padding: 10 },
  imagePreviewL: { width: '100%', height: 200, resizeMode: 'contain' },
  removeButtonL: { marginVertical: 10, backgroundColor: '#A3AE95', padding: 10, paddingHorizontal: 15, borderRadius: 5 },
  scrollContainertop: { flexGrow: 1 },
  removeButton: { backgroundColor: '#A3AE95', padding: 10, borderRadius: 5, alignItems: 'center' },
  removeText: { color: '#3C4234', fontWeight: 'bold' },
  dropdownContainer: { marginBottom: 15 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#ccc', borderRadius: 3, textAlign: 'center', lineHeight: 20 },
  checked: { backgroundColor: '#3E4B1F', color: '#fff', fontWeight: 'bold' },
  dropdownMenu: { borderWidth: 0.3, borderColor: '#ccc', borderRadius: 5, marginTop: 5, backgroundColor: '#fff' },
  dropdownMenuc: { borderWidth: 0.3, borderColor: '#ccc', borderRadius: 5, marginTop: 20, backgroundColor: '#fff' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  dropdownItemText: { fontSize: 16, marginLeft: 10 },

  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  serviceName: { fontSize: 16, color: '#333', flex: 1, marginRight: 12 },
  priceWrap: { flexDirection: 'row', alignItems: 'center' },
  rs: { marginRight: 6, color: '#333' },
  priceInput: { width: 100, height: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', paddingLeft: 8, fontSize: 16 },

  switch: { position: 'absolute', right: 30, top: 50, zIndex: 100, borderRadius: 50 },
  switchText: { fontSize: 15, position: 'absolute', right: 85, top: 58, zIndex: 90, color: '#F2EBBC' },
  switchset: { flexDirection: 'row' },
  loginButton: { width: '75%', height: 42, backgroundColor: '#A3AE95', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 35, alignSelf: 'center' },
  loginButtonText: { fontSize: 15, fontWeight: 'bold', color: '#3C4234' },

  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: Math.round(SCREEN_W * 0.1) },

  regback: { bottom: 0, width: '100%', height: '53%', position: 'absolute', marginBottom: '21%' },
  container: { flex: 1 },
  image: { position: 'absolute', width: '100%', height: '40%' },
  imagein: { marginTop: '15%', marginLeft: '5%' },
  text: { fontSize: 35, color: '#F2EBBC', fontWeight: 'bold', top: '8%', marginLeft: '10%' },
  backtop: { position: 'absolute', top: 0, backgroundColor: 'rgba(60,66,52,0.7)', width: '100%', height: '40%' },
  textsub: { fontSize: 15, color: '#F2EBBC', fontWeight: '500', top: '8%', marginLeft: '10%' },

  fields: { width: '80%', alignSelf: 'center' },
  input: { height: 50, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', marginBottom: 15, paddingLeft: 15, fontSize: 16 },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },
  timeCol: { flex: 1 },
  timeBox: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  timeText: { fontSize: 16, color: '#000' },
  timePlaceholder: { color: '#999' },
  timeLabel: { marginTop: 6, fontSize: 12, color: '#666' },
  vertDivider: { width: 1, height: 44, backgroundColor: '#DADADA', marginHorizontal: 10, alignSelf: 'center' },

  pickerContainerIOS: {
    backgroundColor: LIGHT,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },

  iosFullWidthBtn: {
    width: '100%',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosFullWidthBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
  }
});

export default HotelRegister2;
