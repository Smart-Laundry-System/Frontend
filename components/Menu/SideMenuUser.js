import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import UserComplainModel from '../Notification/UserComplainModel'

const SideMenuUser = ({ onClose, token, email }) => {

  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const navigation = useNavigation();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);

  const go = (name, params = {}) => {
    onClose?.();
    navigation.navigate(name, params);
  };


  return (
    <>
      <Animated.View style={[styles.container, { left: slideAnim }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
          <Icon name="close" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => go("ProfileUser", { email, token })}>
          <Text style={styles.menuItem}>Profile</Text>
        </TouchableOpacity>


        <View style={styles.menuRow}>
          <Text style={styles.menuItem}>Order history</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => go("NotificationFrmLaundry", { email, token })} style={styles.menuRow}>
          <Text style={styles.menuItem}>Notifications</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.menuItem}>Logout</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.menuItem}>Public Notification</Text>
        </TouchableOpacity> */}
      </Animated.View>

      <UserComplainModel
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '70%',
    height: '120%',
    backgroundColor: '#f8f8f8',
    paddingTop: 100,
    paddingHorizontal: 20,
    marginLeft: -16,
    marginTop: -30,
    zIndex: 9999,
    top: 0
  },
  closeIcon: {
    position: 'absolute',
    marginTop: 50,
    top: 20,
    right: 10,
  },
  menuItem: {
    fontSize: 18,
    paddingVertical: 14,
    color: '#333',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    position: 'relative',
    zIndex: 100,
    top: 2,
    right: -10,
    backgroundColor: '#f2ebbc',
    borderRadius: 10,
    width: 20,
    height: 20,
    // padding: 7,
    alignItems: 'center',
    borderColor: 'red',
    borderWidth: 2
  },
  badgeText: { fontSize: 12, marginTop: 2 },
});

export default SideMenuUser;
