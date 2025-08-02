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
import RegistreTop from '../../components/UserTop/RegistreTop';


function HotelRegister2({ navigation }) {

    const [isSwitchOn, setIsSwitchOn] = React.useState(false);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);

    const [selectedTypes, setSelectedTypes] = React.useState([]);
    const [selectedCloths, setSelectedCloths] = React.useState([]);
    const [isDropdownVisiblet, setDropdownVisiblet] = React.useState(false);
    const [selectedImageL, setSelectedImageL] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [images, setImages] = useState([]); // Define images state


    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission required", "You need to enable permission to access the image library.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
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

    const removeImageL = () => {
        Alert.alert(
            "Remove Image",
            "Are you sure you want to remove the selected image?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => setSelectedImageL(null) },
            ]
        );
    };

    const pickImageL = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImages((prevImages) => [...prevImages, result.assets[0]]);
        }
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
        navigation.navigate('HotelRegisterFinal');
    }

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

    const uploadImageToBackend = async (uri) => {
        const fileName = uri.split('/').pop();
        const formData = new FormData();

        formData.append('image', {
            uri,
            name: fileName,
            type: 'image/jpeg', // make sure the image you're uploading is JPEG
        });

        try {
            const response = await fetch('http://172.20.10.2:8082/auth/v1/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Image upload failed: ${response.status}`);
            }

            const imageUrl = await response.text(); // The backend returns plain text URL
            return imageUrl;
        } catch (error) {
            console.error("Image Upload Error:", error);
            return null;
        }
    };

    const handleRegister = async () => {
        const imageUrl = await uploadImageToBackend(selectedImage);

        if (!imageUrl) {
            console.error("Image URL is missing. Registration aborted.");
            return;
        }

        try {
            const userData = {
                name: "Hotel ABC",
                email: "hotel@smart.com",
                password: "securepass",
                address: "123 Street",
                phone: "0771234567",
                role: "LAUNDRY",
                image: imageUrl,
                cloths: selectedCloths,
                types: selectedTypes
            };

            const response = await axios.post("http://172.20.10.2:8082/auth/v1/addLaundry", userData);

            if (response.status === 200) {
                navigation.navigate("Login");
            } else {
                console.error("User registration failed:", response.status);
            }
        } catch (error) {
            console.error("Registration Error:", error);
        }
    };


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
                    <TouchableOpacity activeOpacity={1} onPress={() => setDropdownVisiblet(false)}>
                        {isSwitchOn && <RegistreTop navigation={navigation} />}

                        {!isSwitchOn && <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.fields, {
                                marginTop: selectedImage ? "62%" : "45%", top: selectedImageL && selectedImage ? "25%" : selectedImageL ? "100%" : "0%"
                            }]}>

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
                                <TouchableOpacity onPress={pickImageL}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Upload a Laundry Image"
                                        keyboardType="default"
                                        placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={false}
                                    />
                                    <Image
                                        source={upload}
                                        style={{ position: 'absolute', width: 25, height: 25, right: 15, top: 15 }}
                                    />
                                </TouchableOpacity>

                                {images.length > 0 ? (
                                    images.map((image, index) => (
                                        <>
                                            <Image
                                                key={index} // Use key prop for each child
                                                source={{ uri: image.uri }}
                                                style={{ width: 100, height: 100 }}
                                            />
                                            <TouchableOpacity onPress={removeImageL} style={styles.removeButtonL}>
                                                <Text style={styles.removeText}>Remove Image</Text>
                                            </TouchableOpacity>
                                        </>
                                    ))
                                ) : (
                                    <Text>No images selected</Text>
                                )}


                            </View>
                        </ScrollView>
                        }
                    </TouchableOpacity>
                </BlurView>


                <TouchableOpacity style={[styles.loginButton, { marginTop: selectedImageL ? "30%" : "0%" }]} onPress={handleRegister}>
                    <Text style={styles.loginButtonText}>
                        Next
                    </Text>
                </TouchableOpacity>

                <Or />

                <CreateAc butname="For Login" navigation={navigation} path="Login" />
            </View >
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    imageWrapperL: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: 10,
    },
    imagePreviewL: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
    },
    removeButtonL: {
        marginTop: 10,
        backgroundColor: '#ff4d4d',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    // removeText: {
    //     color: '#fff',
    //     fontWeight: 'bold',
    // },

    scrollContainertop: {
        flexGrow: 1,
    },
    removeButton: {
        backgroundColor: '#A3AE95',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    // removeButtonL: {
    //     backgroundColor: '#A3AE95',
    //     padding: 10,
    //     borderRadius: 5,
    //     alignItems: 'center',
    //     position: 'absolute',
    //     marginTop: 250
    // },
    removeText: {
        color: '#3C4234',
        fontWeight: 'bold',
        // fontSize: 16,
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.3)'
    },
    dropdownHeaderText: {
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top'
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
        flexDirection: 'row'
    },
    loginButton: {
        width: '75%',
        height: 42,
        backgroundColor: '#A3AE95',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '35',
        alignSelf: 'center'
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
        borderColor: 'black',
        borderWidth: 1,
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
        backgroundColor: '#ffff'
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
        marginLeft: '10%'
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
        marginTop: '45%'
    },
    fieldsL: {
        width: '80%',
        alignSelf: 'center'
    },
    input: {
        height: 50,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.3)',
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16
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
