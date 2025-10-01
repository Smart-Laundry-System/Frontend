// Employees.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Pressable,
    Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import DropDown from "../../../components/Menu/DropDown"; // you already have this
import { api, authGet } from "../../../Services/api";

const FILTERS = [
    { label: "Name", value: "name" },
    { label: "Address", value: "address" },
    { label: "Phone", value: "phone" },
    { label: "Email", value: "email" },
];

const AVATAR_COLORS = ["#444", "#666", "#a3ae95", "#555", "#3C4234", "#A3AE95"];
const getInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => (p[0] || "").toUpperCase())
        .join("") || "U";
const colorFor = (name = "") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function Employees({ navigation }) {
    const route = useRoute();
    const token = route?.params?.token || null;
    const id = route?.params?.id || "";
    const refreshKey = route?.params?.refresh; // refresh after create

    const [list, setList] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState(FILTERS[0]);
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = token
                ? await authGet(`/laundries/${id}/employees`, token)
                : await api.get(`/laundries/${id}/employees`, token);
            const data = res?.data || [];
            const arr = Array.isArray(data) ? data : data?.employees || data?.content || [];
            setList(
                arr.map((e, idx) => ({
                    id: e?.id?.toString?.() ?? `${idx}`,
                    name:
                        e?.name ||
                        [e?.firstName, e?.lastName].filter(Boolean).join(" ") ||
                        e?.email ||
                        "Employee",
                    address: e?.address || "",
                    phone: e?.phone || "",
                    email: e?.email || "",
                }))
            );
        } catch (e) {
            Toast.show({
                type: "error",
                text1: "Failed to load employees",
                text2: e?.response?.data || e?.message || "",
            });
        }
    }, [token, id]);

    useFocusEffect(
        useCallback(() => {
            fetchEmployees();
        }, [fetchEmployees, refreshKey])
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list;

        const by = filter.value;
        return list.filter((e) => {
            const field =
                by === "address"
                    ? e.address
                    : by === "phone"
                        ? e.phone
                        : by === "email"
                            ? e.email
                            : e.name;
            return (field || "").toLowerCase().includes(q);
        });
    }, [list, search, filter]);

    const renderRow = ({ item }) => (
        <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colorFor(item.name) }]}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {/* add secondary line if you want, e.g., email or phone */}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color="#3C4234" />
                </TouchableOpacity>
                <Text style={styles.h1}>Employees</Text>
                <TouchableOpacity onPress={() => navigation.navigate("AddEmployee", { token, id: id })}>
                    <Ionicons name="add" size={24} color="#3C4234" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#98A29D" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search employees..."
                        placeholderTextColor="#98A29D"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <Pressable ref={filterBtnRef} style={styles.filterBtn} onPress={() => setOpenFilter(true)}>
                    <Ionicons name="options-outline" size={20} color="#3C4234" />
                </Pressable>

                <DropDown
                    visible={openFilter}
                    anchorRef={filterBtnRef}
                    options={FILTERS}
                    onSelect={(opt) => setFilter(opt)}
                    onRequestClose={() => setOpenFilter(false)}
                    width={220}
                    offsetY={8}
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(it) => it.id}
                renderItem={renderRow}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    h1: { fontSize: 24, color: "#3C4234", fontWeight: "800" },

    searchRow: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F3F1",
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: { flex: 1, color: "#3C4234", paddingVertical: 0 },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#A3AE95",
        alignItems: "center",
        justifyContent: "center",
    },

    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
    name: { color: "#3C4234", fontSize: 14, fontWeight: "600" },
});
