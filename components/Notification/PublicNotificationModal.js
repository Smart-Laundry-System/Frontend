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
import { Ionicons as Icon } from '@expo/vector-icons';
import { api } from '../../Services/api';
import Toast from 'react-native-toast-message';
import { TOAST, tokens } from '../../styles/theme';

const PublicNotificationModal = ({ visible, email, onClose, token, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendNotifications = async () => {
    if (submitting) return;

    if (!subject.trim() || !message.trim()) {
      Toast.show(
        TOAST.errorBottom("Missing fields", "Please fill Subject and Message.")
      );
      return;
    }

    if (!email) {
      Toast.show(
        TOAST.errorBottom("Missing email", "Laundry email is required.")
      );
      return;
    }

    const payload = {
      laundryEmail: email,
      subject,
      message,
    };

    try {
      setSubmitting(true);

      const res = await api.post('/api/auth/addNotification', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.status === 200 && res?.data) {
        Toast.show(
          TOAST.success("Notification sent", "Your public message has been posted.")
        );
        onSent?.(res.data);
        setSubject('');
        setMessage('');
        onClose?.();
      } else {
        Toast.show(
          TOAST.errorBottom("Send failed", "Unexpected server response.")
        );
      }
    } catch (err) {
      const serverMsg = err?.response?.data;
      Toast.show(
        TOAST.errorBottom("Send failed", (typeof serverMsg === 'string' && serverMsg) ||
          err?.message ||
          'Network/server error')
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
    >
      <View style={styles.overlay}>
        <BlurView intensity={tokens.blur.modal} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Icon name="close" size={28} color={tokens.colors.shadow} />
          </TouchableOpacity>

          <Text style={styles.header}>Enter your public message here</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Subject</Text>
            <View style={styles.inputWrapper}>
              <Icon name="create-outline" size={16} style={styles.icon} />
              <TextInput
                style={styles.inputl}
                placeholder="Subject"
                placeholderTextColor={tokens.colors.placeholder}
                value={subject}
                onChangeText={setSubject}
                editable={!submitting}
              />
            </View>

            <Text style={[styles.label, { marginTop: tokens.spacing.sm }]}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message"
              placeholderTextColor={tokens.colors.placeholder}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              editable={!submitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, submitting && { opacity: tokens.opacities.disabled }]}
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
    marginBottom: tokens.spacing.sm,
    borderBottomWidth: tokens.components.Input.borderBottomWidth,
    borderColor: tokens.colors.bottomBorder,
  },
  icon: {
    marginRight: tokens.spacing.xs,
    opacity: 0.36,
    marginLeft: -8,
  },
  overlay: {
    flex: 1,
    backgroundColor: tokens.colors.placeholder,
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  modalContent: {
    backgroundColor: tokens.colors.greenButton,
    marginRight: -20,
    marginLeft: -20,
    position: 'relative',
    paddingBottom: tokens.spacing.sm,
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: Platform.select({ ios: 10, android: 10 }),
    zIndex: 1,
  },
  header: {
    fontSize: tokens.components.Input.fontSize,
    marginBottom: tokens.spacing.md,
    color: tokens.colors.shadow,
    padding: tokens.spacing.sm
  },
  inputContainer: {
    marginTop: tokens.spacing.xs,
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.overlayBig,
    margin: tokens.spacing.xl,
    borderRadius: tokens.radius.sm,
  },
  label: {
    fontSize: tokens.components.Typography.body.fontSize,
    color: tokens.colors.overlayTopd,
    marginBottom: tokens.spacing.xxs,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.placeholder,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 10,
    paddingVertical: tokens.spacing.xs,
  },
  inputl: {
    flex: 1,
    paddingVertical: tokens.spacing.xs,
    fontSize: tokens.components.Typography.small.fontSize,
    color: tokens.colors.darkText,
  },
  textArea: {
    height: tokens.spacing.textarea,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: tokens.colors.darkText,
    marginTop: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    marginHorizontal: tokens.spacing.lg,
    borderRadius: tokens.spacing.xs,
    alignItems: 'center',
  },
  sendButtonText: {
    color: tokens.colors.background,
    ...tokens.fonts.heavy
  },
});
