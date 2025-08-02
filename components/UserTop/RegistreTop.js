import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message';

function RegistreTop({ navigation }) {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [phone2, setPhone2] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const controlLogin = async () => {
        if (!email.trim() || !firstName.trim() || !lastName.trim()
            || !password.trim() || !phone.trim() || !address.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Register filed',
                text2: 'Please fill all the requered credantial',
                position: 'bottom',
                visibilityTime: 2000
            });
        }
        const data = {
            email: email,
            name: firstName + " " + lastName,
            password: password,
            role: "CUSTOMER",
            phone: phone,
            phone_2: phone2,
            address: address
        }

        try {
            const response = await axios.post("http://172.20.10.2:8082/auth/v1/addUser", data);

            if (response.status === 200 && response.data) {
                Toast.show({
                    type: 'success',
                    text1: 'Registered success',
                    text2: 'Use yore credantial for login',
                    position: 'top',
                    visibilityTime: 2000
                });
                navigation.navigate('Login');
            } else {
                console.log("Error on adding user");
                // Alert.alert(
                //     "Registration Failed",
                //     "Do you want to re-enter your details?",
                //     [
                //         { text: "Yes", style: "cancel" },
                //         { text: "No", onPress: () => navigation.navigate("Login") },
                //     ]
                // );
                Toast.show({
                    type: 'error',
                    text1: 'Register filed',
                    text2: 'Server error',
                    position: 'bottom',
                    visibilityTime: 2000
                });
            }

        } catch (error) {
            console.log("User register error: ", error.message);
            // Alert.alert(
            //     "Registration Failed",
            //     "Do you want to re-enter your details?",
            //     [
            //         { text: "Yes", style: "cancel" },
            //         { text: "No", onPress: () => navigation.navigate("Login") },
            //     ]
            // );
            Toast.show({
                type: 'error',
                text1: 'Register filed',
                text2: 'Check your internet',
                position: 'bottom',
                visibilityTime: 2000
            });
        }
    }

    return (
        <View>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.fields}>
                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        // keyboardType="email-address"
                        value={firstName}
                        onChangeText={(e) => setFirstName(e)}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        // secureTextEntry={true}
                        onChangeText={(e) => setLastName(e)}
                        value={lastName}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Address"
                        // secureTextEntry={true}
                        onChangeText={(e) => setAddress(e)}
                        value={address}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone"
                        // secureTextEntry={true}
                        onChangeText={(e) => setPhone(e)}
                        value={phone}
                        keyboardType='phone-pad'
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="LAN Phone(Optional)"
                        // secureTextEntry={true}
                        onChangeText={(e) => setPhone2(e)}
                        value={phone2}
                        keyboardType='phone-pad'
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        onChangeText={(e) => setEmail(e)}
                        value={email}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry={true}
                        onChangeText={(e) => setPassword(e)}
                        value={password}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.loginButton} onPress={controlLogin}>
                <Text style={styles.loginButtonText}>
                    Sign up
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: '10%',
        // marginTop:'-10%'
    },
    loginButton: {
        width: '75%',
        height: 42,
        backgroundColor: '#A3AE95', // Green color
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '35',
        alignSelf: 'center',
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#3C4234',
    },
    fields: {
        width: '80%',
        alignSelf: 'center',
        marginTop: '58%',
    },
    input: {
        height: 40,
        width: '100%',
        borderBottomWidth: 1, // Thickness of the underline
        borderBottomColor: 'rgba(0,0,0,0.3)', // Color of the underline
        // borderWidth: 1,
        // borderRadius: 15,
        // borderColor: 'rgba(0,0,0,0.3)',
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
    },
})

export default RegistreTop