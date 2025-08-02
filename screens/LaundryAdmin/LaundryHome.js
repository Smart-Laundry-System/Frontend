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
import axios from 'axios';
import Vector from '../../assets/Vector.png';
import StartImage from '../../assets/startimage.png';
import { BlurView } from 'expo-blur';

const LaundryHome = ({ navigation }) => {
  const [laundryInfo, setLaundryInfo] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatchingLoad, setFatchingLoad] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const serviceListRef = useRef(null); // For services carousel
  const employeeListRef = useRef(null); // For employees list


  const testServices = [
    { title: 'Wash & Fold', catagary: 'Clothes', price: '12' },
    { title: 'Dry Clening', catagary: 'Suits', price: '1' },
    { title: 'Dry Claning', catagary: 'Suit', price: '10' },
    { title: 'Dry Cleanng', catagary: 'Sits', price: '14' },
  ];

  useEffect(() => {
    if (!fatchingLoad) {
      fetchLaundryData();
      setFatchingLoad(true)
    }

    if (!testServices?.length || !serviceListRef.current) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % testServices.length;
      setCurrentIndex(nextIndex);
      serviceListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, testServices]);

  const fetchLaundryData = async () => {
    try {
      const laundryRes = await axios.get('http://YOUR_API/laundry/me');
      const employeeRes = await axios.get('http://YOUR_API/laundry/employees');
      setLaundryInfo(laundryRes.data);
      setEmployees(employeeRes.data);
    } catch (error) {
      console.log('Error fetching data:', error.message);
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

  return (
    <ScrollView style={styles.container}>
      {/* Header Row */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.image} source={Vector} />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={backtoback} style={styles.forback}>
          <Image style={styles.image} source={Vector} />
        </TouchableOpacity> */}

        <View style={styles.notificationWrapper}>
          <Icon name="menu" size={28} color="#3C4234" />
          <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Laundry Header */}
      <View style={styles.laundryHeader}>
        <Text style={styles.laundryName}>{laundryInfo?.name || 'Laundry Name'}</Text>
        <TouchableOpacity style={styles.addEmployeeBtn}>
          <Text style={styles.addEmployeeText}>Add new employee</Text>
        </TouchableOpacity>
      </View>

      {/* Laundry Image */}
      {/* <View style={styles.serviceCard}>
        <Image
          source={laundryInfo?.imageUrl ? { uri: laundryInfo.imageUrl } : require('../../assets/startimage.png')}
          style={styles.serviceImage}
        />
        <View style={styles.overlay}>
          <Text style={styles.serviceTitle}>{laundryInfo?.serviceTitle || 'Service 1'}</Text>
          <Text style={styles.serviceSubtitle}>{laundryInfo?.serviceDesc || 'For each piece'}</Text>
          <Text style={styles.servicePrice}>${laundryInfo?.price || '10'}</Text>
        </View>
      </View> */}
      {/* <View style={styles.serviceCard}>
        <Image
          source={require('../../assets/startimage.png')}
          style={styles.serviceImage}
        />

        <FlatList
          ref={serviceListRef}
          horizontal
          pagingEnabled
          data={testServices}
          keyExtractor={(item, i) => i.toString()}
          renderItem={({ item }) => (
            <BlurView intensity={60} tint="light">
              <Text style={styles.serviceTitle}>{item ? item.title : 'No services avilable'}</Text>
              <Text style={styles.serviceSubtitle}>{item ? item.catagary : 'No services avilable'}</Text>
              <Text style={styles.servicePrice}>${item ? item.price : 'No services avilable'}</Text>
            </BlurView>
          )}
          style={styles.overlay}
          showsHorizontalScrollIndicator={false}
        />
      </View> */}

      <View style={styles.serviceCard}>
        <Image
          source={require('../../assets/startimage.png')}
          style={styles.serviceImage}
        />

        <FlatList
          ref={serviceListRef}
          horizontal
          pagingEnabled
          data={testServices}
          keyExtractor={(item, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlurView intensity={60} tint="light" style={styles.serviceItem}>
              <Text style={styles.serviceTitle}>{item?.title || 'No title'}</Text>
              <Text style={styles.serviceSubtitle}>{item?.catagary || 'No category'}</Text>
              <Text style={styles.servicePrice}>${item?.price || 'N/A'}</Text>
            </BlurView>
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
      <Text style={styles.sectionTitle}>Employees</Text>
      <FlatList
        ref={employeeListRef}
        data={laundryInfo?.services || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Image
              source={
                laundryInfo?.laundryImg
                  ? { uri: laundryInfo.laundryImg }
                  : StartImage
              }
              style={styles.serviceImage}
            />
            {/* <BlurView intensity={40} tint="light" style={styles.overlay}> */}
            <Text style={styles.serviceTitle}>{item.title || 'Service'}</Text>
            <Text style={styles.serviceSubtitle}>{item.catagary || 'Category'}</Text>
            <Text style={styles.servicePrice}>${item.price || '10'}</Text>
            {/* </BlurView> */}
          </View>
        )}
        onScrollToIndexFailed={() => { }}
      />

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About Us</Text>
        <View style={styles.ratingRow}>
          <Text style={{ color: '#FFC107', fontSize: 16 }}>⭐ {laundryInfo?.rating || '4.3'}</Text>
          <Text style={{ color: '#555', marginLeft: 4 }}>({laundryInfo?.reviewCount || '12,789'} Reviews)</Text>
        </View>
        <Text style={styles.aboutText}>{laundryInfo?.about || 'Laundry description not available.'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, marginTop: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  forback: {
    top: "6.5%",
    left: "6%",
    width: '8%',
    aspectRatio: 1,
    overflow: 'hidden'
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', top: "6.5%",
    // left: "6%",right:'6%'
  },
  notificationWrapper: { position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, paddingHorizontal: 5 },
  badgeText: { color: 'white', fontSize: 12 },
  editBtn: { backgroundColor: '#A3AE95', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  editBtnText: { color: '#fff', fontWeight: 'bold' },
  laundryHeader: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  laundryName: { fontSize: 22, fontWeight: 'bold', color: '#3C4234' },
  addEmployeeBtn: { borderWidth: 1, borderColor: '#3C4234', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  addEmployeeText: { color: '#3C4234', fontWeight: 'bold' },

  
  serviceItem: {
    width: 300,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 16,
    justifyContent: 'center',
  },
  blurCard: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    borderRadius: 10,
  },
  flatlist: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },

  serviceCard: {
    marginTop: 16, borderRadius: 12, overflow: 'hidden',
    width: '100%',
    height: 200,
    position: 'relative',
    marginBottom: 20,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 12,
    borderRadius: 10,
    paddingLeft: 16,
    height: 100,
  },
  serviceTitle: { fontSize: 18, fontWeight: '600', color: '#3C4234' },
  serviceSubtitle: { fontSize: 12, fontWeight: '600', color: '#666' },
  servicePrice: {
    fontSize: 20,
    color: '#3C4234',
    marginTop: 12,
    fontWeight: '600',
    right: '12',
    position: 'absolute'
  },
  employeesBtn: { backgroundColor: '#A3AE95', marginTop: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  employeesText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, color: '#3C4234' },
  customerCard: { marginRight: 12, alignItems: 'center', marginTop: 10 },
  customerImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#ccc' },
  customerName: { marginTop: 4, fontWeight: '500', color: '#3C4234' },
  aboutSection: { marginTop: 24 },
  aboutTitle: { fontSize: 18, fontWeight: 'bold', color: '#3C4234' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  aboutText: { color: '#444', fontSize: 14, lineHeight: 20 },
});

export default LaundryHome;
