import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, Keyboard, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from 'react-native';
import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';
import { BlurView } from 'expo-blur'
import { Icon, Switch } from 'react-native-paper';
import RegistreTop from '../../components/UserTop/RegistreTop'
import Or from '../../components/Button/Or'
import CreateAc from '../../components/Button/CreateAc';
import Toast from 'react-native-toast-message';

function UserRegistre({ navigation }) {

    const [laundryName, setLaundryName] = useState("");
    const [phone, setPhone] = useState("");
    const [phone2, setPhone2] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");
    const [isSwitchOn, setIsSwitchOn] = React.useState(true);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);

    const [selectedOptions, setSelectedOptions] = React.useState([]);
    const [isDropdownVisible, setDropdownVisible] = React.useState(false);

    const options = ['Ironing', 'Dry Clean', 'Detergent Wash'];

    const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    const isValidPassword = (s) => /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(s); // ≥8 & at least one symbol
    const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

    const toggleOption = (option) => {
        setSelectedOptions((prev) =>
            prev.includes(option)
                ? prev.filter((item) => item !== option)
                : [...prev, option]
        );
    };

    const controlLogin = () => {

        const errors = [];

        if (!isNonEmpty(laundryName)) errors.push("Laundry name");
        if (!isNonEmpty(address)) errors.push("Address");
        if (!isNonEmpty(phone)) errors.push("Phone");
        // phone2 optional? If required, uncomment next line
        // if (!isNonEmpty(phone2)) errors.push("LAN Phone");

        if (!isNonEmpty(email)) {
            errors.push("Email");
        } else if (!isValidEmail(email.trim())) {
            errors.push("Valid email");
        }

        if (!isNonEmpty(password)) {
            errors.push("Password");
        } else if (!isValidPassword(password)) {
            errors.push("Strong password (8+ & 1 symbol)");
        }

        // IMPORTANT: check array length (not array inequality)
        // if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
        //     errors.push("At least one service type");
        // }

        if (errors.length) {
            Toast.show({
                type: "error",
                text1: "Smart Laundry",
                text2: `Please provide: ${errors.join(", ")}`,
                position: "bottom",
                visibilityTime: 2500,
            });
            return;
        }

        // All good → navigate with params
        navigation.navigate("HotelRegister2", {
            laundryName: laundryName.trim(),
            address: address.trim(),
            phone: phone.trim(),
            phone2: phone2.trim(),
            email: email.trim(),
            password, // keep as is; don't trim passwords usually
            selectedOptions,
        });
    }

    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);



    // const handleValueChange = (value) => {
    //     setSelectedValue(value);
    // };

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

    // const customTheme = {
    //     ...PaperProvider,
    //     colors: {
    //         ...PaperProvider.colors,
    //         accent: '#F2EBBC', // Customize theme accent color
    //     },
    // };

    return (
        <View style={styles.container}>

            {/* <RegistreTop /> */}
            <Image source={registeroverlay} style={styles.image} />
            <View style={styles.switchset}>
                <Text style={styles.switchText}>
                    {!isSwitchOn && "Hotel Admin"}
                    {isSwitchOn && "Personal"}
                </Text>
                <View style={[styles.switch, { backgroundColor: isSwitchOn ? '#F2EBBC' : 'rgba(0,0,0,0.8)' }]}>
                    <Switch
                        trackColor={{ false: 'rgba(0,0,0,0.8)', true: '#F2EBBC' }}
                        thumbColor={isSwitchOn ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)'}
                        value={isSwitchOn}
                        onValueChange={onToggleSwitch}
                    />

                </View>
            </View>
            <View style={styles.backtop}></View>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.forback}>
                <Image source={inerbutton} style={styles.imagein} />
            </TouchableOpacity>
            <Image source={overlap} style={styles.regback} />
            <Text style={styles.text}>
                The Smart Laundry.
            </Text>
            <Text style={styles.textsub}>
                Create Account
            </Text>

            <BlurView style={{ marginTop: keyboardVisible ? '-35%' : '' }} intensity={keyboardVisible ? 20 : 0}>
                <TouchableOpacity activeOpacity={1} onPress={() => setDropdownVisible(false)}>
                    {isSwitchOn && <RegistreTop navigation={navigation} />}

                    {!isSwitchOn && <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.fields}>

                            <View style={{ flexDirection: 'row' }}>
                                <Icon icon="camera" size={100} color="red" style={styles.icon} />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Name of the laundry"
                                    keyboardType="default"
                                    value={laundryName}
                                    onChangeText={setLaundryName}
                                    placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Address"
                                value={address}
                                onChangeText={setAddress}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone"
                                keyboardType='phone-pad'
                                value={phone}
                                onChangeText={setPhone}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="LAN Phone"
                                keyboardType='phone-pad'
                                value={phone2}
                                onChangeText={setPhone2}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                keyboardType='email-address'
                                value={email}
                                onChangeText={setEmail}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                secureTextEntry={true}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={styles.dropdownContainer}>
                                <TouchableOpacity style={styles.dropdownHeader} onPress={toggleDropdown}>
                                    <Text style={[styles.dropdownHeaderText, { color: keyboardVisible ? 'black' : '#999' }]}>
                                        {/* {selectedOptions.length > 0
                                            ? selectedOptions.join(', ')
                                            : 'Select Options'} */}
                                        Services Type
                                    </Text>
                                </TouchableOpacity>

                                {isDropdownVisible && (
                                    <View style={styles.dropdownMenu}>
                                        {options.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={styles.dropdownItem}
                                                onPress={() => toggleOption(option)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.checkbox,
                                                        selectedOptions.includes(option) && styles.checked,
                                                    ]}
                                                >
                                                    {selectedOptions.includes(option) ? '✓' : ' '}
                                                </Text>
                                                <Text style={[styles.dropdownItemText, { color: keyboardVisible ? 'black' : '#999' }]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>}
                </TouchableOpacity>
                {/* </KeyboardAvoidingView> */}
            </BlurView>


            {!isSwitchOn && <TouchableOpacity style={styles.loginButton} onPress={controlLogin}>
                <Text style={styles.loginButtonText}>
                    Next
                </Text>
            </TouchableOpacity>}

            <Or />
            <CreateAc butname="For Login" navigation={navigation} path="Login" />
            <Toast />
        </View >
    );
}

const styles = StyleSheet.create({
    icon: {
        width: 100,
        height: 100,
        // margin: '100%',
    },
    dropdownContainer: {
        marginBottom: 15
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 3,
        textAlign: 'center',
        lineHeight: 20,
    },
    checked: {
        backgroundColor: '#3E4B1F',
        color: '#fff',
        fontWeight: 'bold',
    },
    dropdownMenu: {
        borderWidth: 0.3,
        borderColor: '#ccc',
        borderRadius: 5,
        marginTop: 5,
        marginBottom: '-15',
        backgroundColor: '#fff',
        maxHeight: 150,
        overflow: 'scroll',
        // zIndex: 1010
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    dropdownItemText: {
        fontSize: 16,
        // color: '#999',
        marginLeft: 10,
    },
    dropdownHeader: {
        // borderWidth: 1,
        // borderColor: '#ccc',
        // borderRadius: 5,
        padding: 15,
        // backgroundColor: '#f9f9f9',
        height: 50,
        width: '100%',
        borderBottomWidth: 1, // Thickness of the underline
        borderBottomColor: 'rgba(0,0,0,0.3)', // Color of the underline
    },
    dropdownHeaderText: {
        fontSize: 16,
    },
    textArea: {
        height: 80,  // Adjusted height for multi-line text box
        textAlignVertical: 'top',  // Ensures the text starts from the top
    },
    switch: {
        position: 'absolute',
        right: '30',
        top: '50',
        zIndex: '100',
        borderRadius: 50
    },
    switchText: {
        fontSize: 15,
        position: 'absolute',
        right: '85',
        top: '58',
        zIndex: '90',
        color: '#F2EBBC'
    },
    switchset: {
        flexDirection: 'row',
        // position:'absolute'
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
    linedecr: {
        textDecorationLine: "underline",
        // justifyContent:'center',
        textAlign: 'center',
        borderBottomWidth: 1,
        // paddingBottom: 1,
        // marginRight: '21%',
        marginLeft: '2.5%',
        width: '34%'
        // position:'absolute'
    },
    linedecl: {
        textDecorationLine: "underline",
        // justifyContent:'center',
        textAlign: 'center',
        borderBottomWidth: 1,
        // paddingBottom: 1,
        // marginLeft: '21%',
        marginRight: '2.5%',
        width: '34%'
        // position: 'relative'
    },
    createac: {
        width: '75%',
        height: 42,
        // backgroundColor: 'red',
        borderRadius: 10,
        borderColor: 'black', // Set the border color to black
        borderWidth: 1,       // Add border width to make the line visible
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: '10%',
        // marginTop:'35%'
    },
    regback: {
        bottom: 0,
        width: '100%',
        height: '53%',
        position: 'absolute',
        marginBottom: '21%'
    },
    container: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#ffff', // Light background
    },
    image: {
        position: 'absolute',
        width: '100%',
        height: '40%',
        // opacity: '0.9'
    },
    forback: {
        top: "6.5%",
        left: "6%",
        width: '8%',
        aspectRatio: 1,
        overflow: 'hidden'
    },
    imagein: {
        resizeMode: 'cover'
        // marginTop: '15%',
        // marginLeft: '5%',
        // width: '10%',
        // height: '20%',
        // resizeMode: 'contain', // Maintain aspect ratio
    },
    text: {
        fontSize: 35,
        color: '#F2EBBC',
        fontWeight: 'bold',
        top: '8%',
        marginLeft: '10%' // Adds space between text and other elements
    },
    backtop: {
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(60,66,52,0.7)',
        width: '100%',
        height: '40%',
    },
    textsub: {
        fontSize: 15,
        color: '#F2EBBC',
        fontWeight: '500',
        top: '8%',
        marginLeft: '10%'
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
    forget: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: '10',
        marginTop: '-2',
        gap: 3,
        marginBottom: '20'
    },
    forgetfont: {
        fontSize: 15,
        color: '#FF0000',
        fontWeight: 'bold'
    }
});

export default UserRegistre;
