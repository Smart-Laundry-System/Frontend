// components/PublicNotificationModal.js
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { api } from '../../Services/api';
import Toast from 'react-native-toast-message';

const PublicNotificationModal = ({ visible, email, onClose, token, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendNotifications = async () => {
    if (submitting) return;

    if (!subject.trim() || !message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please fill Subject and Message.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing email',
        text2: 'Laundry email is required.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    const payload = {
      laundryEmail: email,
      subject,
      message,
    };

    try {
      setSubmitting(true);

      // IMPORTANT: send JSON body as 2nd arg; headers go in 3rd arg
      const res = await api.post('/api/auth/addNotification', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.status === 200 && res?.data) {
        Toast.show({
          type: 'success',
          text1: 'Notification sent',
          text2: 'Your public message has been posted.',
          position: 'top',
          visibilityTime: 2000,
        });
        // optionally notify parent & close/reset
        onSent?.(res.data);
        setSubject('');
        setMessage('');
        onClose?.();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Send failed',
          text2: 'Unexpected server response.',
          position: 'bottom',
          visibilityTime: 2000,
        });
      }
    } catch (err) {
      const serverMsg = err?.response?.data;
      Toast.show({
        type: 'error',
        text1: 'Send failed',
        text2:
          (typeof serverMsg === 'string' && serverMsg) ||
          err?.message ||
          'Network/server error',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose} // Android back button
    >
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Icon name="close" size={28} color="#000" />
          </TouchableOpacity>

          <Text style={styles.header}>Enter your public message here</Text>

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
            {submitting ? (
              <Text style={styles.sendButtonText}>Submitting...</Text>
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PublicNotificationModal;

const styles = StyleSheet.create({
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
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#a3ae95',
    marginRight: -20,
    marginLeft: -20,
    position: 'relative',
    paddingBottom: 12,
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: Platform.select({ ios: 10, android: 10 }),
    zIndex: 1,
  },
  header: {
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
    padding: 12,
    // removed invalid negative padding
  },
  inputContainer: {
    marginTop: 8,
    padding: 20,
    backgroundColor: 'rgba(242,235,188,0.4)',
    margin: 30,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: 'rgba(60,66,52,0.7)',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  },
  sendButton: {
    backgroundColor: '#3C4234',
    marginTop: 12,
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
