import React, { useEffect, useState } from 'react';
import {
    ScrollView, Image, StyleSheet, View, Text, TouchableOpacity,
    TextInput, Platform, Dimensions, Pressable, Image as RNImage,
    ActivityIndicator, Keyboard
} from 'react-native';
import registeroverlay from '../../../../assets/backReg.png';
import overlap from '../../../../assets/registeroverlay.png';
import backBtn from '../../../../assets/Vector1.png';
import upload from '../../../../assets/upload.png';
import { BlurView } from 'expo-blur';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';

import { api, authGet, uploadImageFile, IMG_URL } from '../../../../Services/api';
import { useRegistration } from '../../../../context/RegistrationContext';
import { getAccessToken } from '../../../../Services/tokenStorage';
import Toast from 'react-native-toast-message';
import { TOAST, tokens } from '../../../../styles/theme';
import Or from '../../../../components/Button/Or';
import CreateAc from '../../../../components/Button/CreateAc';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HEADER_H = Math.round(SCREEN_H * 0.40);  
const REG_BACK_H = Math.round(SCREEN_H * 1.05);
const FORM_TOP_PAD = Math.round(HEADER_H * 1.05);

export default function EditLaundry({ navigation, route }) {
    const { userEmail } = useRegistration();
    const email = route?.params?.email || userEmail || '';
    const [token, setToken] = useState(route?.params?.token || null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [laundryId, setLaundryId] = useState(null);

    const [about, setAbout] = useState('');
    const [openTime, setOpenTime] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [showOpenPicker, setShowOpenPicker] = useState(false);
    const [showClosePicker, setShowClosePicker] = useState(false);
    const [imageUri, setImageUri] = useState('');
    const [services, setServices] = useState([]);

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = Keyboard.addListener(showEvt, (e) => {
            setKeyboardVisible(true);
            setKeyboardHeight(e?.endCoordinates?.height ?? 0);
        });
        const onHide = Keyboard.addListener(hideEvt, () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
        });

        return () => { onShow.remove(); onHide.remove(); };
    }, []);

    const updateServicePrice = (title, value) => {
        const sanitized = value.replace(/[^0-9.]/g, '');
        setServices(prev => prev.map(s => s.title === title ? ({ ...s, price: sanitized }) : s));
    };

    useEffect(() => {
        (async () => {
            try {
                if (!token) {
                    const t = await getAccessToken().catch(() => null);
                    if (t) setToken(t);
                }
                const res = token
                    ? await authGet('/api/auth/details', token, { params: { email } })
                    : await api.get('/api/auth/details', { params: { email } });

                const d = res?.data || {};
                setLaundryId(d?.id || null);
                setAbout(d?.about || '');
                setOpenTime(d?.openTime || '');
                setCloseTime(d?.closeTime || '');
                setImageUri(d?.laundryImg ? `${IMG_URL}${d.laundryImg}` : '');

                const svc = Array.isArray(d?.services) ? d.services.map(s => ({
                    title: s?.title || s?.name || '',
                    price: s?.price || ''
                })).filter(s => s.title) : [];
                setServices(svc);
            } catch (e) {
                Toast.show(TOAST.errorBottom('Load failed', e?.response?.data || e?.message || 'Network error'));
            } finally {
                setLoading(false);
            }
        })();
    }, [email, token]);

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

    const pickImage = async () => {
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

    const onSubmit = async () => {
        try {
            if (!laundryId) {
                Toast.show(TOAST.errorBottom('Missing ID', 'Could not resolve laundry id.'));
                return;
            }

            const cleaned = services
                .map(s => ({ title: (s.title || '').trim(), price: (s.price || '').trim() }))
                .filter(s => s.title);
            const seen = new Set();
            const deduped = cleaned.filter(s => !seen.has(s.title.toLowerCase()) && seen.add(s.title.toLowerCase()));

            let laundryImgUrl = '';
            if (imageUri && !imageUri.startsWith('http')) {
                const up = await uploadImageFile(imageUri);
                laundryImgUrl = up?.url || up?.absoluteUrl || '';
            } else if (imageUri) {
                laundryImgUrl = imageUri;
            }

            const payload = {
                id: laundryId,
                about,
                openTime,
                closeTime,
                laundryImg: laundryImgUrl,
                services: deduped
            };

            setSubmitting(true);
            const res = await api.put('/api/auth/updateLaundry', payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (res?.status === 200) {
                Toast.show(TOAST.success('Updated', 'Laundry updated successfully.'));
                navigation.goBack();
            } else {
                Toast.show(TOAST.errorBottom('Update failed', 'Unexpected server response'));
            }
        } catch (e) {
            Toast.show(TOAST.errorBottom('Update failed', e?.response?.data || e?.message || 'Network error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={[styles.scrollContainer, { paddingBottom: keyboardHeight + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.container}>
                <Image source={registeroverlay} style={styles.image} resizeMode="cover" />
                <View style={styles.backtop} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Image source={backBtn} />
                </TouchableOpacity>

                <Image source={overlap} style={styles.regback} resizeMode="cover" />
                <Text style={styles.h1}>The Smart Laundry.</Text>
                <Text style={styles.h2}>Edit details</Text>

                <BlurView intensity={keyboardVisible ? 20 : 0} style={{ top: keyboardVisible ? "-15%" : 0 }}>
                    <View style={styles.form}>
                        <View style={styles.timeRow}>
                            <View style={styles.timeCol}>
                                <Pressable style={styles.timeBox} onPress={() => setShowOpenPicker(true)}>
                                    <Text style={[styles.timeText, !openTime && styles.timePlaceholder]}>
                                        {openTime || 'Open (HH:mm)'}
                                    </Text>
                                </Pressable>
                                <Text style={styles.timeLabel}>Open</Text>
                            </View>
                            <View style={styles.vertDivider} />
                            <View style={styles.timeCol}>
                                <Pressable style={styles.timeBox} onPress={() => setShowClosePicker(true)}>
                                    <Text style={[styles.timeText, !closeTime && styles.timePlaceholder]}>
                                        {closeTime || 'Close (HH:mm)'}
                                    </Text>
                                </Pressable>
                                <Text style={styles.timeLabel}>Close</Text>
                            </View>
                        </View>

                        <TextInput
                            style={styles.inputArea}
                            placeholder="About the laundry"
                            value={about}
                            onChangeText={setAbout}
                            multiline
                            numberOfLines={6}
                            maxLength={1200}
                        />

                        <Text style={styles.label}>Selected Services & Prices</Text>
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
                                    />
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity onPress={pickImage}>
                            <TextInput style={styles.input} placeholder="Upload a Laundry Image" editable={false} />
                            <RNImage source={upload} style={styles.uploadIcon} />
                        </TouchableOpacity>

                        {imageUri ? (
                            <View style={{ alignItems: 'center' }}>
                                <RNImage source={{ uri: imageUri }} style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8 }} />
                                <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
                                    <Text style={styles.removeText}>Remove Image</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={{ opacity: 0.6, marginBottom: 8 }}>No image selected</Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                { opacity: submitting ? tokens.opacities.disabled : 1 },
                            ]}
                            onPress={onSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.loginButtonText}>
                                {submitting ? 'Updating...' : 'Update'}
                            </Text>
                        </TouchableOpacity>
                        <Or />
                        <CreateAc
                            butname="For log in"
                            navigation={navigation}
                            path="Login"
                        />
                    </View>
                </BlurView>

                <DateTimePickerModal
                    isVisible={showOpenPicker}
                    mode="time"
                    is24Hour
                    date={openTime ? fromHHmm(openTime) : new Date()}
                    onConfirm={(d) => { setOpenTime(toHHmm(d)); setShowOpenPicker(false); }}
                    onCancel={() => setShowOpenPicker(false)}
                />
                <DateTimePickerModal
                    isVisible={showClosePicker}
                    mode="time"
                    is24Hour
                    date={closeTime ? fromHHmm(closeTime) : new Date()}
                    onConfirm={(d) => { setCloseTime(toHHmm(d)); setShowClosePicker(false); }}
                    onCancel={() => setShowClosePicker(false)}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    image: { position: 'absolute', width: '100%', height: HEADER_H },
    backtop: { position: 'absolute', top: 0, backgroundColor: 'rgba(60,66,52,0.7)', width: '100%', height: HEADER_H },
    regback: { bottom: 0, width: '100%', height: REG_BACK_H, position: 'absolute', marginBottom: '21%' },

    backBtn: { marginTop: '7.5%', marginLeft: '5%' },

    h1: { fontSize: 35, color: '#F2EBBC', fontWeight: 'bold', marginTop: 24, marginLeft: '10%' },
    h2: { fontSize: 15, color: '#F2EBBC', fontWeight: '500', marginLeft: '10%' },

    form: { width: '80%', alignSelf: 'center', paddingTop: FORM_TOP_PAD, top: -100, paddingBottom: 24 },

    input: {
        height: 48, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)',
        marginBottom: 14, paddingLeft: 12, fontSize: 16
    },
    inputArea: {
        width: '100%', minHeight: 120, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderRadius: 10,
        marginBottom: 12, padding: 12, fontSize: 16, textAlignVertical: 'top'
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
    timeRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginBottom: 12 },
    timeCol: { flex: 1 },
    timeBox: {
        height: 44, borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)', borderRadius: 10,
        paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff',
    },
    timeText: { fontSize: 16, color: '#000' },
    timePlaceholder: { color: '#999' },
    timeLabel: { marginTop: 6, fontSize: 12, color: '#666' },
    vertDivider: { width: 1, height: 44, backgroundColor: '#DADADA', marginHorizontal: 10, alignSelf: 'center' },

    label: { fontSize: 14, color: '#333', fontWeight: '700', marginTop: 10, marginBottom: 6 },
    serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    serviceName: { fontSize: 16, color: '#333', flex: 1, marginRight: 12 },
    priceWrap: { flexDirection: 'row', alignItems: 'center' },
    rs: { marginRight: 6, color: '#333' },
    priceInput: { width: 100, height: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.3)', paddingLeft: 8, fontSize: 16 },

    uploadIcon: { position: 'absolute', width: 22, height: 22, right: 15, top: 14, opacity: 0.8 },
    removeButton: { marginVertical: 10, backgroundColor: '#A3AE95', padding: 10, paddingHorizontal: 15, borderRadius: 5 },
    removeText: { color: '#3C4234', fontWeight: 'bold' },

    saveBtn: {
        width: '75%', height: 42, backgroundColor: '#A3AE95', borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 10
    },
    saveText: { color: '#3C4234', fontWeight: 'bold' },
});
