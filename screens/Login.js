import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Vector from '../assets/Vector.png'
import backLogin from '../assets/backLogin.png'
import imageLoginBack from '../assets/imageLoginBack.png'
import { BlurView } from 'expo-blur'
import close from '../assets/close.png'

function Login({ navigation }) {

    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisiblenext, setModalVisiblenext] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    // const [modalVisibleall, setModalVisibleall] = useState(false);

    const scale = useRef(new Animated.Value(1)).current;

    const backtoback = () => {
        navigation.navigate('StartPage');
    }

    const sendemail = () => {
        setModalVisiblenext(true);
        // setModalVisible(false);
    }

    // const closeModals = () => {
    //     setModalVisible(false);
    //     setModalVisiblenext(false);
    //     // setModalVisibleall(false);
    //     // setKeyboardVisible(false);
    // };

    useEffect(() => {
        // if(!modalVisiblenext){setModalVisible(false);}
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.25, // Slightly enlarge
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1, // Back to original size
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();


        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, [modalVisible, keyboardVisible, modalVisiblenext]);

    return (

        <View
            style={styles.container}
        >
            <Image source={backLogin} style={styles.imageBack} />
            {/* <Text>hiiijhuyhyugyuhuyguyhygubgyg</Text> */}

            <View style={styles.backtop}></View>

            <TouchableOpacity onPress={backtoback}>
                <Image style={styles.image} source={Vector} />
            </TouchableOpacity>

            <Text style={styles.title}>
                The Smart Laundry.
            </Text>
            <Text style={styles.subTit}>
                Enter your given email and password
            </Text>

            <Image source={imageLoginBack} style={styles.imageLoginBack} />
            {/* <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: 'center' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            > */}
            {/* {keyboardVisible &&<> */}
            {/* <BlurView intensity={keyboardVisible ? 30 : 0}>
                <View style={{ marginTop: keyboardVisible ? "-35%" : '' }}>
                    
                    <View style={styles.fields}>
                        <TextInput

                            style={styles.input}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.forget}>
                        <Text style={styles.forgetfont}>Forget Password?</Text>
                        <TouchableOpacity style={styles.openButton}
                            onPress={() => { setModalVisible(true); setModalVisibleall(true); }}>
                            <Text style={styles.resetfont}>Reset the password</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView> */}

            {/* <BlurView intensity={keyboardVisible ? 30 : 0}>
                <View style={{ marginTop: keyboardVisible ? "-35%" : '' }}>
                    <View style={styles.fields}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.forget}>
                        <Text style={styles.forgetfont}>Forget Password?</Text>
                        <TouchableOpacity style={styles.openButton}
                            onPress={() => { setModalVisible(true); setModalVisibleall(true); }}>
                            <Text style={styles.resetfont}>Reset the password</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView> */}

            <BlurView style={{ marginTop: keyboardVisible ? "-35%" : '' }} intensity={keyboardVisible ? 6 : 0}>
                <View>
                    <View style={styles.fields}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            keyboardType="email-address"
                            placeholderTextColor={keyboardVisible ? "black" : ''}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={true}
                            placeholderTextColor={keyboardVisible ? "black" : ''}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.forget}>
                        <Text style={styles.forgetfont}>Forget Password?</Text>
                        <TouchableOpacity style={styles.openButton}
                            onPress={() => { setModalVisible(true) }}>
                            <Text style={styles.resetfont}>Reset the password</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            {/* </>
            } */}
            {/* {!keyboardVisible && <>
                <View style={{ marginTop: keyboardVisible ? "-35%" : "", height: keyboardVisible ? '100%' : '' }}>
                    
                    <View style={styles.fields}>
                        <TextInput

                            style={styles.input}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.forget}>
                        <Text style={styles.forgetfont}>Forget Password?</Text>
                        <TouchableOpacity style={styles.openButton}
                            onPress={() => setModalVisible(true)}>
                            <Text style={styles.resetfont}>Reset the password</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </>} */}

            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={styles.linedecl}></Text>
                <Text style={{ marginTop: '6.5', position: 'absolute' }}>or</Text>
                <Text style={styles.linedecr}></Text>
            </View>

            <TouchableOpacity style={styles.createac} onPress={() => navigation.navigate('UserRegistration')}>
                <Text style={styles.loginButtonText}>Create an account</Text>
            </TouchableOpacity>
            {/* </ScrollView> */}
            {/* </KeyboardAvoidingView> */}

            {/* <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >

                {modalVisible && <>
                    <Animated.View
                        style={[styles.closeButton, { transform: [{ scale }] }]} 
                    >
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                        >
                            <Image source={close} />
                        </TouchableOpacity>
                    </Animated.View>
                </>}
                <BlurView intensity={30} style={styles.modalBackground}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Enter your registered email</Text>
                        <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>

                            <View style={styles.innerfield}>
                                <TextInput
                                    style={styles.inputin}
                                    placeholder="Email"
                                    placeholderTextColor='rgba(0,0,0,0.4)'
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                            </View>
                            <TouchableOpacity style={styles.send} onPress={() => navigation.navigate('Home')}>
                                <Text style={styles.loginButtonText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal> */}

            {/* <Modal
                animationType='none'
                transparent={true}
                visible={modalVisibleall}
                onRequestClose={() => setModalVisibleall(false)}
            >

                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={() => { setModalVisibleall(false); }} // Close modal when outside is clicked
                > */}

            {/* <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)} // Handle back button close
                    >
                        <BlurView intensity={30} style={styles.modalBackground}>

                            <TouchableOpacity
                                style={styles.modalBackground}
                                activeOpacity={1}
                                onPress={() => setModalVisible(false)} // Close modal when outside is clicked
                            >
                                <View style={styles.modalView}>
                                    <Text style={styles.modalText}>Enter your registered email</Text>
                                    <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                        <View style={styles.innerfield}>
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.send} onPress={sendemail}>
                                            <Text style={styles.loginButtonText}>Send</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </BlurView>
                    </Modal> */}


            {/* <Modal
                        animationType="none"
                        transparent={true}
                        visible={modalVisiblenext}
                        onRequestClose={() => setModalVisiblenext(false)} // Handle back button close
                    >
                        <BlurView intensity={30} style={styles.modalBackground}>

                            <TouchableOpacity
                                style={styles.modalBackground}
                                activeOpacity={1}
                                onPress={() => { setModalVisiblenext(false) }} // Close modal when outside is clicked
                            >
                                <View style={styles.modalViewset}>
                                    <Text style={styles.modalText}>Enter your registered email</Text>
                                    <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                        <View style={styles.innerfieldall}>
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />

                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />

                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />

                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.send} onPress={() => navigation.navigate('Home')}>
                                            <Text style={styles.loginButtonText}>Update</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </BlurView>
                    </Modal> */}
            {/* </TouchableOpacity>
            </Modal> */}

            {/* <Modal
                animationType='none'
                transparent={true}
                visible={modalVisibleall}
                onRequestClose={() => setModalVisibleall(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={() => { setModalVisibleall(false); }}
                >
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <BlurView intensity={30} style={styles.modalBackground}>
                            <TouchableOpacity
                                style={styles.modalBackground}
                                activeOpacity={1}
                                onPress={() => setModalVisible(false)}
                            >
                                <View style={styles.modalView}>
                                    <Text style={styles.modalText}>Enter your registered email</Text>
                                    <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                        <View style={styles.innerfield}>
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.send} onPress={sendemail}>
                                            <Text style={styles.loginButtonText}>Send</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </BlurView>
                    </Modal>

                    <Modal
                        animationType="none"
                        transparent={true}
                        visible={modalVisiblenext}
                        onRequestClose={() => setModalVisiblenext(false)}
                    >
                        <BlurView intensity={30} style={styles.modalBackground}>
                            <TouchableOpacity
                                style={styles.modalBackground}
                                activeOpacity={1}
                                onPress={() => { setModalVisiblenext(false) }}
                            >
                                <View style={styles.modalViewset}>
                                    <Text style={styles.modalText}>Enter your registered email</Text>
                                    <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                        <View style={styles.innerfieldall}>
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TextInput
                                                style={styles.inputin}
                                                placeholder="Email"
                                                placeholderTextColor='rgba(0,0,0,0.4)'
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.send} onPress={() => navigation.navigate('Home')}>
                                            <Text style={styles.loginButtonText}>Update</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </BlurView>
                    </Modal>
                </TouchableOpacity>
            </Modal> */}

            {/* <Modal
                animationType='none'
                transparent={true}
                visible={modalVisibleall}
                onRequestClose={closeModals} // Close all modals when back button is pressed
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={closeModals} // Close all modals when clicked outside
                    pointerEvents={modalVisible || modalVisibleall || modalVisiblenext ? 'auto' : 'none'} // Only active when a modal is visible
                > */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => { setModalVisible(false) }} // Handle back button close
            // onRequestClose={closeModals}
            >
                <BlurView intensity={30} style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPress={() => { setModalVisible(false) }} // Close all modals when clicked outside
                    // onPress={closeModals}
                    >
                        <View style={styles.modalView}>
                            <Text style={styles.modalText}>Enter your registered email</Text>
                            <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                <View style={styles.innerfield}>
                                    <TextInput
                                        style={styles.inputin}
                                        placeholder="Email"
                                        placeholderTextColor='rgba(0,0,0,0.4)'
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                                <TouchableOpacity style={styles.send} onPress={sendemail}>
                                    <Text style={styles.loginButtonText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </Modal>

            {/* Modal for updating password */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisiblenext}
                onRequestClose={() => { setModalVisiblenext(false) }} // Handle back button close
            // onRequestClose={closeModals}
            >
                <BlurView intensity={30} style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPress={() => { setModalVisiblenext(false) }} // Close all modals when clicked outside
                    // onPress={closeModals}
                    >
                        <View style={styles.modalViewset}>
                            <Text style={styles.modalText}>Enter your registered email</Text>
                            <View style={{ height: '90%', marginBlock: '10', borderRadius: 10, margin: 'auto', backgroundColor: 'rgba(242,235,188,0.4)', width: '95%' }}>
                                <View style={styles.innerfieldall}>
                                    <TextInput
                                        style={styles.inputin}
                                        placeholder="Email"
                                        placeholderTextColor='rgba(0,0,0,0.4)'
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {/* Additional fields for password reset */}
                                    <TextInput
                                        style={styles.inputin}
                                        placeholder="Email"
                                        placeholderTextColor='rgba(0,0,0,0.4)'
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.inputin}
                                        placeholder="Email"
                                        placeholderTextColor='rgba(0,0,0,0.4)'
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TextInput
                                        style={styles.inputin}
                                        placeholder="Email"
                                        placeholderTextColor='rgba(0,0,0,0.4)'
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                                <TouchableOpacity style={styles.send} onPress={() => navigation.navigate('Home')}>
                                    <Text style={styles.loginButtonText}>Update</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </Modal>
            {/* </TouchableOpacity>
            </Modal> */}


        </View >
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    blurView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
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
    forgetfont: {
        fontSize: 15,
        color: '#FF0000',
        fontWeight: 'bold'
    },
    resetfont: {
        fontSize: 15,
        fontWeight: 'bold',
        color: "#A3AE95",
        marginBottom: '10',
        borderBottomWidth: 1.5, // Thickness of the underline
        borderBottomColor: '#FF0000', // Color of the underline
        paddingBottom: 1, // Gap between the text and the underline (adjust as needed)
    },
    forget: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: '10',
        marginTop: '-2',
        gap: 3,
        marginBottom: '20'
    },
    imageLoginBack: {
        bottom: 0,
        width: '100%',
        height: '47%',
        position: 'absolute',
        marginBottom: '12%'
    },
    fields: {
        width: '80%',
        alignSelf: 'center',
        marginTop: '80%',
    },
    innerfieldall: {
        // color: 'black',
        justifyContent: 'center',
        // alignContent: 'center',
        // width: '90%',
        marginRight: '3%',
        marginTop: '10',
        marginLeft: '3%'
    },
    innerfield: {
        // color: 'black',
        justifyContent: 'center',
        // alignContent: 'center',
        // width: '90%',
        marginRight: '3%',
        marginTop: '40',
        marginLeft: '3%'
    },
    inputin: {
        height: 50,
        width: '100%',
        // color: 'rgba(60,66,52,0.37)',
        borderBottomWidth: 1, // Thickness of the underline
        borderBottomColor: 'rgba(0,0,0,0.3)', // Color of the underline
        // borderWidth: 1,
        // borderRadius: 15,
        // borderColor: 'rgba(0,0,0,0.3)',
        // marginBottom: 15,
        paddingLeft: 15,
        fontSize: 20,
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
    send: {
        width: '75%',
        height: 35,
        // backgroundColor: 'red',
        borderRadius: 10,
        borderColor: 'black', // Set the border color to black
        borderWidth: 1,       // Add border width to make the line visible
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        alignSelf: 'center',
        // top: '100%'
    },
    loginButton: {
        width: '75%',
        height: 42,
        backgroundColor: '#A3AE95', // Green color
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 35,
        alignSelf: 'center',
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#3C4234',
    },
    backtop: {
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(163, 174, 149,0.6)',
        width: '100%',
        height: '70%',
    },
    title: {
        fontSize: 35,
        color: '#3C4234',
        fontWeight: 'bold',
        top: '8%',
        marginLeft: '10%'
    },
    subTit: {
        fontSize: 15,
        color: '#3C4234',
        fontWeight: '500',
        top: '8%',
        marginLeft: '10%'
    },
    imageBack: {
        position: 'absolute',
        width: '100%',
        height: '60%',
        opacity: '0.9'
    },
    back: {
        position: 'absolute',
        top: 0
    },
    image: {
        marginTop: '15%',
        marginLeft: '5%',
        // position:'abosolute'
        // zIndex:'-500'
        // height:''
    },
    container: {
        flex: 1,
        backgroundColor: '#ffff'
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalViewset: {
        width: '100%',
        height: '400',
        backgroundColor: '#A3AE95',
        // borderRadius: 10,
        padding: 20,
        // justifyContent: 'center',
        // alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalView: {
        width: '100%',
        height: '300',
        backgroundColor: '#A3AE95',
        // borderRadius: 10,
        padding: 20,
        // justifyContent: 'center',
        // alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        fontSize: 12,
        marginTop: -10,
        marginLeft: -10
        // textAlign: 'center',
        // top:0
    },
    closeButton: {
        // backgroundColor: '#F194FF',
        padding: 3,
        // borderRadius: 5,
        position: 'absolute',
        top: 50,
        right: 25,
        zIndex: '100',
        // animation: breathing
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
})

export default Login