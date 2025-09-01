// components/UserComplainModel.js
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const UserComplainModel = ({ visible, onClose }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <BlurView intensity={50} tint='light' style={StyleSheet.absoluteFill} />
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                        <Icon name="close" size={28} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.header}>Enter your complain here</Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Icon name="create-outline" size={16} style={styles.icon} />
                            <TextInput style={styles.inputl} placeholder="Subject" placeholderTextColor="rgba(117, 114, 90, 0.38)" />
                        </View>
                        <Text style={[styles.label, { marginTop: 12 }]}>About the laundry</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Message"
                            placeholderTextColor="rgba(117, 114, 90, 0.38)"
                            multiline
                            numberOfLines={6}
                        />
                    </View>

                    <TouchableOpacity style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default UserComplainModel;

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
    },
    closeIcon: {
        position: 'absolute',
        right: 10,
        top: '-40%',
    },
    header: {
        fontSize: 16,
        marginBottom: 16,
        color: '#000',
        padding: 5,
        paddingBottom: -5
    },
    inputContainer: {
        marginTop: 30,
        padding: 20,
        backgroundColor: 'rgba(242,235,188,0.4)',
        margin: 30
    },
    label: {
        fontSize: 14,
        color: 'rgba(60,66,52,0.37)',
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
        marginTop: 20,
        paddingVertical: 10,
        margin: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
