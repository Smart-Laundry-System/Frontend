import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, Keyboard, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';
import { BlurView } from 'expo-blur'
import { Button, Switch } from 'react-native-paper';
import IconOpen from '../../assets/icon.png'
import IconClose from '../../assets/iconopen.png';
import CreateAc from '../../components/Button/CreateAc';
import Or from '../../components/Button/Or';
import upload from '../../assets/upload.png';
import * as ImagePicker from 'expo-image-picker';


function HotelRegister2({ navigation }) {

    const [isSwitchOn, setIsSwitchOn] = React.useState(false);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);

    const [selectedOptions, setSelectedOptions] = React.useState([]);
    const [selectedTypes, setSelectedTypes] = React.useState([]);
    const [selectedCloths, setSelectedCloths] = React.useState([]);
    const [isDropdownVisible, setDropdownVisible] = React.useState(false);
    const [isDropdownVisiblet, setDropdownVisiblet] = React.useState(false);

    const [selectedImage, setSelectedImage] = useState(null);

    const pickImage = async () => {
        // Request permission to access media library
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission required", "You need to enable permission to access the image library.");
            return;
        }

        // Launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri); // Save the selected image URI
        }
    };

    const removeImage = () => {
        Alert.alert(
            "Remove Image",
            "Are you sure you want to remove the selected image?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => setSelectedImage(null) },
            ]
        );
    };

    const clothes = ['Jackets', 'Veshti', 'Others(Upload an image)'];

    const types = ['Carpet', 'Curtain'];

    const toggleCloths = (option) => {
        setSelectedCloths((prev) =>
            prev.includes(option)
                ? prev.filter((item) => item !== option)
                : [...prev, option]
        );
    };

    const toggleTypes = (option) => {
        setSelectedTypes((prev) =>
            prev.includes(option)
                ? prev.filter((item) => item !== option)
                : [...prev, option]
        );
    };


    const controlLogin = () => {
        if (isSwitchOn) {
            navigation.navigate('Login');
        } else if (!isSwitchOn) {
            navigation.navigate('HotelRegister2');
        }
    }

    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    const toggleDropdownt = () => {
        setDropdownVisiblet(!isDropdownVisiblet);
    };

    const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

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

    return (
        <ScrollView contentContainerStyle={styles.scrollContainertop}>
            <View style={styles.container}>

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

                <TouchableOpacity onPress={() => navigation.navigate("UserRegistration")}>
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
                        {isSwitchOn &&
                            <ScrollView
                                contentContainerStyle={styles.scrollContainer}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.fields}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="First Name"
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Last Name"
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Address"
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Phone"
                                        keyboardType='phone-pad'
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        secureTextEntry={true}
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </ScrollView>}

                        {!isSwitchOn && <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.fields,{marginTop: selectedImage ? "62%" : "45%"}]}>

                                <TextInput
                                    style={styles.input}

                                    placeholder="Available Item"
                                    keyboardType="default"
                                    placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={false}
                                />

                                <View style={styles.dropdownContainer}>

                                    <View style={styles.dropdownMenu}>
                                        {types.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={styles.dropdownItem}
                                                activeOpacity={1}
                                                onPress={() => toggleTypes(option)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.checkbox,
                                                        selectedTypes.includes(option) && styles.checked,
                                                    ]}
                                                >
                                                    {selectedTypes.includes(option) ? '✓' : ' '}
                                                </Text>
                                                <Text style={[styles.dropdownItemText, { color: keyboardVisible ? 'black' : '#999' }]}>{option}</Text>
                                            </TouchableOpacity>

                                        ))}
                                        <TouchableOpacity activeOpacity={1} onPress={toggleDropdownt} style={[styles.dropdownItem, { flexDirection: 'row' }]}>
                                            <Text style={{ color: keyboardVisible ? 'black' : '#999' }}>Clothes Item (KG)</Text>
                                            <Image source={IconOpen} style={{ marginLeft: '30%', opacity: '0.6', display: isDropdownVisiblet ? 'none' : 'flex' }} />
                                            <Image source={IconClose} style={{ marginLeft: '30%', display: isDropdownVisiblet ? 'flex' : 'none' }} />
                                        </TouchableOpacity>
                                    </View>

                                    {isDropdownVisiblet && (
                                        <View style={styles.dropdownMenuc}>
                                            {clothes.map((optionc) => (
                                                <>
                                                    <TouchableOpacity
                                                        key={optionc}
                                                        style={styles.dropdownItem}
                                                        activeOpacity={1}
                                                        onPress={() => toggleCloths(optionc)}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.checkbox,
                                                                selectedCloths.includes(optionc) && styles.checked,
                                                            ]}
                                                        >
                                                            {selectedCloths.includes(optionc) ? '✓' : ' '}
                                                        </Text>
                                                        <Text style={[styles.dropdownItemText, { color: keyboardVisible ? 'black' : '#999' }]}>
                                                            {optionc}
                                                        </Text>
                                                        {optionc === "Others(Upload an image)" && selectedCloths.includes(optionc) && (
                                                            <TouchableOpacity onPress={pickImage}>
                                                                <Image source={upload} style={{ width: 25, height: 25, right: '-10' }} />
                                                            </TouchableOpacity>
                                                        )}
                                                    </TouchableOpacity>
                                                </>
                                            ))}

                                            {selectedImage ? (<>
                                                <View style={{ alignItems: 'center', height: '100%', width: '100%' }}>
                                                    <Image source={{ uri: selectedImage }} style={{ width: "50%", height: "50%", padding: '10' }} />
                                                    <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
                                                        <Text style={styles.removeText}>Remove Image</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                            ) : (
                                                <Text></Text>
                                            )}
                                        </View>
                                    )}
                                </View>


                            </View>
                        </ScrollView>}
                    </TouchableOpacity>
                </BlurView>


                <TouchableOpacity style={styles.loginButton} onPress={controlLogin}>
                    <Text style={styles.loginButtonText}>
                        {!isSwitchOn && 'Next'}
                        {isSwitchOn && 'Sign up'}
                    </Text>
                </TouchableOpacity>

                <Or />

                <CreateAc butname="Login" navigation={navigation} path="Login" />
{/* <View style={{height:'40'}}></View> */}
            </View >
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainertop: {
        flexGrow: 1, // Ensures content grows and is scrollable
        // width:'100%'
    },
    // container: {
    //     flex: 1,
        // justifyContent: 'center',
    // },
    removeButton: {
        backgroundColor: '#A3AE95', // Button background color
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: '10'
    },
    removeText: {
        color: '#3C4234', // Button text color
        fontWeight: 'bold',
        fontSize: 16,
    },
    icon: {
        margin: '100%',
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
    },
    dropdownMenuc: {
        borderWidth: 0.3,
        borderColor: '#ccc',
        borderRadius: 5,
        marginTop: 20,
        backgroundColor: '#fff',
        maxHeight: 350,
        overflow: 'scroll',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    dropdownItemText: {
        fontSize: 16,
        marginLeft: 10,
    },
    dropdownHeader: {
        padding: 15,
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
        textAlign: 'center',
        borderBottomWidth: 1,
        marginLeft: '2.5%',
        width: '34%'
    },
    linedecl: {
        textDecorationLine: "underline",
        textAlign: 'center',
        borderBottomWidth: 1,
        marginRight: '2.5%',
        width: '34%'
    },
    createac: {
        width: '75%',
        height: 42,
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
        backgroundColor: '#ffff', // Light background
    },
    image: {
        position: 'absolute',
        width: '100%',
        height: '40%',
    },
    imagein: {
        marginTop: '15%',
        marginLeft: '5%',
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
        marginTop: '45%',
    },
    input: {
        height: 50,
        width: '100%',
        borderBottomWidth: 1, // Thickness of the underline
        borderBottomColor: 'rgba(0,0,0,0.3)', // Color of the underline
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

export default HotelRegister2;
