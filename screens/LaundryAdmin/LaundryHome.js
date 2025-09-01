// LaundryHomeScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Vector from '../../assets/Vector.png';
import StartImage from '../../assets/startimage.png';
import { BlurView } from 'expo-blur';
import { useRoute } from '@react-navigation/native';
import { api, authGet } from '../../Services/api';
import SideMenu from '../../components/Menu/SideMenu';

const LaundryHome = ({ navigation }) => {
  const [laundryInfo, setLaundryInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [fatchingLoad, setFatchingLoad] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const serviceListRef = useRef(null); 
  const employeeListRef = useRef(null);

  const route = useRoute();
  const { email, token } = route.params ?? {};

  const testServices = [
    { title: 'No services', category: 'No services', price: 'N/A' },
    { title: 'No services', category: 'No services', price: 'N/A' },
    { title: 'No services', category: 'No services', price: 'N/A' },
  ];

  const ITEM_HEIGHT = 64;
  const testCustomers = [
    { name: 'No customers' },
    { name: 'No customers' },
    { name: 'No customers' },
    { name: 'No customers' },
  ];

  const servicesData = (laundryInfo?.services?.length ? laundryInfo.services : testServices);

  useEffect(() => {
    if (!fatchingLoad) {
      fetchLaundryData();
      setFatchingLoad(true);
    }

    if (!serviceListRef.current || servicesData.length < 2) return;

    const id = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % servicesData.length;
        try {
          serviceListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (e) {
          serviceListRef.current?.scrollToOffset({
            offset: next * 335, // width of one item
            animated: true,
          });
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(id);
  }, [servicesData.length, fatchingLoad]);

  const fetchLaundryData = async () => {
    try {
      const res = token
        ? await authGet('/api/auth/details', token, { params: { email } })
        : await api.get('/api/auth/details', { params: { email } });

      const data = res?.data || null;
      setLaundryInfo(data);
      // If your API returns customers under a different field, adjust below:
      setCustomerInfo(data?.userLaundries || data?.users || null);
      // setEmployees(employeeRes?.data || []);
    } catch (error) {
      console.log('Error fetching data:', error?.response?.data || error?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A3AE95" />
      </View>
    );
  }

  // Normalize customers array for FlatList
  const customers =
    (Array.isArray(customerInfo?.user) && customerInfo.user.length ? customerInfo.user :
    Array.isArray(customerInfo) && customerInfo.length ? customerInfo :
    Array.isArray(laundryInfo?.users) && laundryInfo.users.length ? laundryInfo.users :
    testCustomers);

  return (
    <ScrollView style={styles.container}>
      {/* Header Row */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Image style={styles.image} src={undefined} source={Vector} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.notificationWrapper} onPress={() => setIsMenuVisible(true)}>
        <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
        <Icon name="menu" style={styles.menuicon} size={28} />
      </TouchableOpacity>
      {isMenuVisible && <SideMenu onClose={() => setIsMenuVisible(false)} token={token} email={email} />}

      {/* Laundry Header */}
      <View style={styles.laundryHeader}>
        <Text style={styles.laundryName}>{laundryInfo?.name || 'Laundry Name'}</Text>
        <TouchableOpacity style={styles.addEmployeeBtn}>
          <Text style={styles.addEmployeeText}>Add new employee</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceCard}>
        <Image
          source={require('../../assets/startimage.png')}
          style={styles.serviceImage}
        />

        <FlatList
          ref={serviceListRef}
          horizontal
          pagingEnabled
          data={laundryInfo?.services?.length ? laundryInfo.services : testServices}
          keyExtractor={(item, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('LaundryItems', { token, email, name: laundryInfo?.name || '' });
              }}
            >
              <BlurView intensity={60} tint="light" style={styles.serviceItem}>
                {(servicesData?.length > 1) && (
                  <View style={styles.paginationWrapper}>
                    {(laundryInfo?.services || testServices).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDash,
                          currentIndex === index && styles.paginationDashActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
                <Text style={styles.serviceTitle}>{item?.title}</Text>
                <Text style={styles.serviceSubtitle}>{item?.category}</Text>
                <Text style={styles.servicePrice}>${item?.price}</Text>
              </BlurView>
            </TouchableOpacity>
          )}
          style={styles.overlay}
          onScroll={(e) => {
            const index = Math.floor(
              e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
            );
            setCurrentIndex(index);
          }}
        />
      </View>

      {/* Employees Button */}
      <TouchableOpacity style={styles.employeesBtn}>
        <Text style={styles.employeesText}>Employees</Text>
      </TouchableOpacity>

      {/* Customers / Employees List */}
      <Text style={styles.sectionTitle}>Customers</Text>
      <FlatList
        ref={employeeListRef}
        data={customers}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => (item?.id?.toString?.() ?? index.toString())}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.customerCard}>
            <Image
              source={
                item?.imageUrl
                  ? { uri: item.imageUrl }
                  : StartImage
              }
              style={styles.customerImage}
            />
            <View style={styles.customerNameWrapper}>
              <Text style={styles.customerName}>{item?.name || 'Customer'}</Text>
            </View>
          </View>
        )}
        onScroll={(e) => {
          const index = Math.floor(
            e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
          );
          setCurrentIndex(index);
        }}
        style={styles.overlaycus}
      />

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About Us</Text>
        <View style={styles.ratingRow}>
          <Text style={{ color: '#FFC107', fontSize: 16 }}>⭐ {laundryInfo?.rating || '0.0'}</Text>
          <Text style={{ color: '#555', marginLeft: 4 }}>({laundryInfo?.reviewCount || '0'} Reviews)</Text>
        </View>
        <Text style={styles.aboutText}>{laundryInfo?.about || 'Laundry description not available.'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    right: 12,
    position: 'absolute',
    marginTop: 64,
  },

  paginationDash: {
    width: 4,
    height: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    marginHorizontal: 1,
    opacity: 0.6,
  },

  paginationDashActive: {
    width: 16,
    borderColor: '#3C4234',
    borderWidth: 1,
    opacity: 1,
    borderRadius: 100,
  },

  container: { flex: 1, backgroundColor: '#fff', padding: 16, marginTop: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  forback: {
    top: '6.5%',
    left: '6%',
    width: '8%',
    aspectRatio: 1,
    overflow: 'hidden',
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', top: 32, zIndex: 9000,
  },
  notificationWrapper: { position: 'absolute' },
  badge: {
    position: 'relative',
    zIndex: 100,
    top: 65,
    right: -10,
    backgroundColor: '#f2ebbc',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    borderColor: 'red',
    borderWidth: 2,
  },
  menuicon: {
    color: '#3C4234',
    top: 50,
    backgroundColor: '#a3ae95',
    paddingRight: 10,
    paddingLeft: 30,
    marginLeft: -35,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, marginTop: 2 },
  editBtn: { backgroundColor: '#A3AE95', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  editBtnText: { color: '#fff', fontWeight: 'bold' },
  laundryHeader: { marginTop: 85, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  laundryName: { fontSize: 22, fontWeight: 'bold', color: '#3C4234' },
  addEmployeeBtn: { borderWidth: 1, borderColor: '#3C4234', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  addEmployeeText: { color: '#3C4234', fontWeight: 'bold' },

  serviceItem: {
    width: 335,
    justifyContent: 'center',
    bottom: 10,
    left: -10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 5,
    borderRadius: 100,
    paddingLeft: 16,
    height: 100,
  },

  serviceCard: {
    marginTop: 16,
    borderRadius: 12,
    width: '100%',
    height: 250,
    position: 'relative',
    marginBottom: 20,
    borderRadius: 20,

    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    elevation: 6,
  },

  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 12,
    borderRadius: 20,
    height: 100,
  },

  overlaycus: {
    bottom: -20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  customerCard: {
    width: 150,
    height: 180,
    alignItems: 'center',
    position: 'relative',
  },

  customerImage: {
    width: 130,
    height: 130,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#a3ae95',
    zIndex: 10,
    resizeMode: 'cover',
  },

  customerNameWrapper: {
    position: 'absolute',
    width: 130,
    bottom: 10,
    backgroundColor: '#dadfd5',
    marginBottom: 8,
    paddingVertical: 26,
    paddingBottom: 10,
    borderRadius: 12,
  },

  customerName: {
    margin: 0,
    fontSize: 14,
    fontWeight: '600',
    color: '#3C4234',
    textAlign: 'center',
  },

  serviceTitle: { fontSize: 18, fontWeight: '600', color: '#3C4234' },
  serviceSubtitle: { fontSize: 12, fontWeight: '600', color: '#666' },
  servicePrice: {
    fontSize: 20,
    color: '#3C4234',
    fontWeight: '600',
    right: 12,
    position: 'absolute',
  },
  employeesBtn: { backgroundColor: '#A3AE95', marginTop: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  employeesText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, color: '#3C4234' },
  aboutSection: { marginTop: 24 },
  aboutTitle: { fontSize: 18, fontWeight: 'bold', color: '#3C4234' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  aboutText: { color: '#444', fontSize: 14, lineHeight: 20 },
});

export default LaundryHome;
