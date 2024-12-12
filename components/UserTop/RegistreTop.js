import React, { useEffect, useState } from 'react'
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

function RegistreTop({ navigation }) {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
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

    const controlLogin = () => {
        navigation.navigate('HotelRegister2');
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
                        onChange={(e) => setFirstName(e)}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        // secureTextEntry={true}
                        onChange={(e) => setLastName(e)}
                        value={lastName}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Address"
                        // secureTextEntry={true}
                        onChange={(e) => setAddress(e)}
                        value={address}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone"
                        // secureTextEntry={true}
                        onChange={(e) => setPhone(e)}
                        value={phone}
                        keyboardType='phone-pad'
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        onChange={(e) => setEmail(e)}
                        value={email}
                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry={true}
                        onChange={(e) => setPassword(e)}
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
        // marginTop:'35%'
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
        marginTop: '45%',
    },
    input: {
        height: 50,
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