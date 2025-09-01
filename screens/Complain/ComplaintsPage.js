// ComplaintsPage.js
import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur'; // If not using Expo: use @react-native-community/blur
import Back from '../../assets/Vector.png';
import DropDown from '../../components/Menu/DropDown';

// ==== Dummy data with unique ids + extra fields for filtering/detail =====
const dummyComplaints = [
  {
    id: '1',
    subject: 'Washer not working',
    date: '2025-08-01',
    time: '10:00 AM',
    image: require('../../assets/backLogin.png'),
    name: 'Amal Perera',
    address: 'No. 12, Galle Rd, Colombo',
    phone: '0771234567',
    email: 'amal@example.com',
    object: 'Washer #12',
    description: 'Machine does not start; error code E02.',
    avatar: null, // or a require(...) / URL
  },
  {
    id: '2',
    subject: 'Late service',
    date: '2025-08-02',
    time: '11:30 AM',
    image: require('../../assets/backLogin.png'),
    name: 'Kavindi Silva',
    address: 'Kandy Rd, Peradeniya',
    phone: '0715556666',
    email: 'kavindi@example.com',
    object: 'Delivery slot',
    description: 'Pickup arrived 45 minutes late.',
    avatar: null,
  },
  {
    id: '3',
    subject: 'Wrong item delivered',
    date: '2025-08-03',
    time: '02:45 PM',
    image: require('../../assets/backLogin.png'),
    name: 'M. Rahman',
    address: 'Main St, Jaffna',
    phone: '0751112222',
    email: 'rahman@example.com',
    object: 'Order #4521',
    description: 'Received shirts that are not mine.',
    avatar: null,
  },
  {
    id: '4',
    subject: 'No response from staff',
    date: '2025-08-04',
    time: '03:15 PM',
    image: require('../../assets/backLogin.png'),
    name: 'Tharindu Jay',
    address: 'Matara',
    phone: '0709988776',
    email: 'tharindu@example.com',
    object: 'Support ticket',
    description: 'Called twice; no call back.',
    avatar: null,
  },
  {
    id: '5',
    subject: 'Washer not working',
    date: '2025-08-01',
    time: '10:00 AM',
    image: require('../../assets/backLogin.png'),
    name: 'Amal Perera',
    address: 'No. 12, Galle Rd, Colombo',
    phone: '0771234567',
    email: 'amal@example.com',
    object: 'Washer #12',
    description: 'Machine does not start; error code E02.',
    avatar: null, // or a require(...) / URL
  },
  {
    id: '6',
    subject: 'Late service',
    date: '2025-08-02',
    time: '11:30 AM',
    image: require('../../assets/backLogin.png'),
    name: 'Kavindi Silva',
    address: 'Kandy Rd, Peradeniya',
    phone: '0715556666',
    email: 'kavindi@example.com',
    object: 'Delivery slot',
    description: 'Pickup arrived 45 minutes late.',
    avatar: null,
  },
  {
    id: '7',
    subject: 'Wrong item delivered',
    date: '2025-08-03',
    time: '02:45 PM',
    image: require('../../assets/backLogin.png'),
    name: 'M. Rahman',
    address: 'Main St, Jaffna',
    phone: '0751112222',
    email: 'rahman@example.com',
    object: 'Order #4521',
    description: 'Received shirts that are not mine.',
    avatar: null,
  },
  {
    id: '8',
    subject: 'No response from staff',
    date: '2025-08-04',
    time: '03:15 PM',
    image: require('../../assets/backLogin.png'),
    name: 'Tharindu Jay',
    address: 'Matara',
    phone: '0709988776',
    email: 'tharindu@example.com',
    object: 'Support ticket',
    description: 'Called twice; no call back.',
    avatar: null,
  },
  // ... add more as needed with unique ids
];

// ===== Helpers =====
const DEFAULT_SEARCH_KEYS = [
  'subject',
  'date',
  'time',
  'object',
  'description',
  'name',
  'address',
  'phone',
  'email',
];

const norm = (v) => (v ?? '').toString().toLowerCase();

const matchesSearch = (item, query, keys) => {
  const q = norm(query);
  if (!q) return true;
  return keys.some((k) => item[k] != null && norm(item[k]).includes(q));
};

// Shown in dropdown
const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Name', value: 'name' },
  { label: 'Address', value: 'address' },
  { label: 'Phone', value: 'phone' },
  { label: 'Subject', value: 'subject' },
  { label: 'Date', value: 'date' },
  { label: 'Time', value: 'time' },
  // You can add hidden fields too if you want to search them explicitly:
  // { label: 'Object', value: 'object' },
];

const ComplaintsPage = () => {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState({ label: 'All', value: 'all' });

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filterRef = useRef(null);

  // ===== Filtering logic with "All" =====
  const filteredComplaints = useMemo(() => {
    return dummyComplaints.filter((item) => {
      const filterValue = selectedFilter?.value;

      // If 'all' or no selection: search across all keys that exist on the item
      if (!filterValue || filterValue === 'all') {
        const keysPresent = DEFAULT_SEARCH_KEYS.filter((k) => item[k] != null);
        return matchesSearch(item, search, keysPresent);
      }

      // Specific field chosen
      return matchesSearch(item, search, [filterValue]);
    });
  }, [search, selectedFilter]);

  // ===== Item press -> open detail modal =====
  const openDetail = (item) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Back} />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>Complaints</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder={
            selectedFilter?.value && selectedFilter.value !== 'all'
              ? `Search by ${selectedFilter.label}...`
              : 'Search complaint...'
          }
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          ref={filterRef}
          onPress={() => setVisible((v) => !v)}
          activeOpacity={0.8}
          style={styles.filterIcon}
        >
          <Icon name="options" size={20} color="#3C4234" />
        </TouchableOpacity>
      </View>

      <DropDown
        visible={visible}
        anchorRef={filterRef}
        options={FILTER_OPTIONS}
        onSelect={(opt) => setSelectedFilter(opt)}
        onRequestClose={() => setVisible(false)}
        width={220}
      />

      <Text style={styles.subTitle}>
        Your complaints{selectedFilter?.value && selectedFilter.value !== 'all' ? ` • ${selectedFilter.label}` : ''}
      </Text>

      {/* Complaint List */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetail(item)} activeOpacity={0.8}>
            <View style={styles.card}>
              <Image source={item.image} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardSubject}>{item.subject}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal with blur background */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 40}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* This TouchableOpacity is the backdrop — clicking it closes the modal */}
        <TouchableOpacity
          style={styles.modalCenter}
          activeOpacity={1}
          onPress={closeDetail}
        >
          {/* Prevent closing when tapping inside the card */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.detailCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* header with avatar */}
            <View style={styles.detailHeader}>
              <Image
                source={
                  selectedItem?.avatar
                    ? selectedItem.avatar
                    : require('../../assets/backLogin.png') // fallback
                }
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{selectedItem?.subject}</Text>
                <Text style={styles.detailSub}>
                  {selectedItem?.date} • {selectedItem?.time}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                <Icon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {/* fields */}
            <View style={styles.detailBody}>
              {!!selectedItem?.name && (
                <Text style={styles.fieldLine}><Text style={styles.fieldLabel}>Name: </Text>{selectedItem.name}</Text>
              )}
              {!!selectedItem?.address && (
                <Text style={styles.fieldLine}><Text style={styles.fieldLabel}>Address: </Text>{selectedItem.address}</Text>
              )}
              {!!selectedItem?.phone && (
                <Text style={styles.fieldLine}><Text style={styles.fieldLabel}>Phone: </Text>{selectedItem.phone}</Text>
              )}
              {!!selectedItem?.email && (
                <Text style={styles.fieldLine}><Text style={styles.fieldLabel}>Email: </Text>{selectedItem.email}</Text>
              )}
              {!!selectedItem?.object && (
                <Text style={styles.fieldLine}><Text style={styles.fieldLabel}>Object: </Text>{selectedItem.object}</Text>
              )}
              {!!selectedItem?.description && (
                <Text style={[styles.fieldLine, { marginTop: 8 }]}>
                  <Text style={styles.fieldLabel}>Description: </Text>
                  {selectedItem.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

export default ComplaintsPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 25, fontWeight: 'bold', marginBottom: 20, color: '#3C4234' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
  filterIcon: { padding: 6, backgroundColor: '#d8e0d0', borderRadius: 10, marginLeft: 8 },
  subTitle: { fontSize: 17, color: '#3C4234', marginBottom: 8 },

  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 10 },
  cardImage: { width: 55, height: 55, borderRadius: 12, marginRight: 12 },
  cardContent: { flex: 1 },
  cardSubject: { fontSize: 16, fontWeight: 'bold', color: '#3C4234' },
  cardDate: { fontSize: 12, color: '#666' },
  cardTime: { fontSize: 12, color: '#3C4234' },

  // Modal
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: { width: 54, height: 54, borderRadius: 12, marginRight: 12 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  detailSub: { fontSize: 12, color: '#666', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f0f0', marginLeft: 8,
  },
  detailBody: { marginTop: 4 },
  fieldLine: { fontSize: 14, color: '#333', marginTop: 4 },
  fieldLabel: { fontWeight: '600', color: '#222' },
});
