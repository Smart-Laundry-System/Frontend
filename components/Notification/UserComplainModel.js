import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { api } from '../../Services/api';
import Toast from 'react-native-toast-message';
import { TOAST } from '../../styles/theme';

const UserComplainModel = ({
  visible,
  customerId,
  onClose,
  token,
  laundryId,
  orderId,
  onSent,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const hide = Keyboard.addListener(hideEvt, () => { });
    return () => hide.remove();
  }, []);

  const sendNotifications = async () => {

    if (submitting) return;

    if (!subject.trim() || !message.trim()) {
      Toast.show(TOAST.errorBottom('Missing fields', 'Please fill Subject and Message.'));
      return;
    }

    if (!customerId || !laundryId || !orderId) {
      Toast.show(TOAST.errorBottom('Missing IDs', 'Customer, Laundry and Order are required.'));
      return;
    }

    const payload = {
      orderId: Number(orderId),
      customerId: Number(customerId),
      laundryId: Number(laundryId),
      subject: subject.trim(),
      message: message.trim(),
    };



    try {
      setSubmitting(true);
      const res = await api.post('/api/auth/addComplain', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.status === 200 && res?.data) {
        Toast.show(TOAST.success('Submitted', 'Your complaint has been posted.'));
        onSent?.(res.data);
        setSubject('');
        setMessage('');
        Keyboard.dismiss();
        onClose?.();
      } else {
        Toast.show(TOAST.errorBottom('Send failed', 'Unexpected server response.'));
      }
    } catch (err) {
      const serverMsg = err?.response?.data;
      Toast.show(
        TOAST.errorBottom(
          'Send failed',
          (typeof serverMsg === 'string' && serverMsg) || err?.message || 'Network/server error'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <Pressable style={styles.overlay} onPress={() => Keyboard.dismiss()}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />

        <KeyboardAvoidingView
          style={styles.centerWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 32, android: 0 })}
        >
          <Pressable onPress={() => { }} style={styles.modalCard}>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Icon name="close" size={28} color="#000" />
            </TouchableOpacity>

            <Text style={styles.header}>Enter your public message here</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Subject</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="create-outline" size={16} style={styles.icon} />
                  <TextInput
                    style={styles.inputl}
                    placeholder="Subject"
                    placeholderTextColor="rgba(117, 114, 90, 0.38)"
                    value={subject}
                    onChangeText={setSubject}
                    editable={!submitting}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Message"
                  placeholderTextColor="rgba(117, 114, 90, 0.38)"
                  multiline
                  numberOfLines={6}
                  value={message}
                  onChangeText={setMessage}
                  editable={!submitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.sendButton, submitting && { opacity: 0.6 }]}
                onPress={sendNotifications}
                disabled={submitting}
              >
                <Text style={styles.sendButtonText}>
                  {submitting ? 'Submitting...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default UserComplainModel;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#a3ae95',
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: Platform.select({ ios: 10, android: 10 }),
    zIndex: 1,
  },
  header: {
    fontSize: 16,
    color: '#000',
    padding: 12,
    paddingRight: 42, 
  },
  scrollInner: {
    paddingBottom: 16,
  },
  inputContainer: {
    marginTop: 8,
    padding: 20,
    backgroundColor: 'rgba(242,235,188,0.4)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: 'rgba(60,66,52,0.7)',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#75725a',
  },
  icon: {
    marginRight: 8,
    opacity: 0.36,
    marginLeft: -8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#3C4234',
  },
  inputl: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#3C4234',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  sendButton: {
    backgroundColor: '#3C4234',
    marginTop: 8,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
