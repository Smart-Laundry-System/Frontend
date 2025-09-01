import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, Keyboard, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from 'react-native';
import registeroverlay from '../../assets/backReg.png';
import inerbutton from '../../assets/Vector1.png';
import overlap from '../../assets/registeroverlay.png';
import { BlurView } from 'expo-blur'
import { Icon, Switch } from 'react-native-paper';
import RegistreTop from '../../components/UserTop/RegistreTop';
import Or from '../../components/Button/Or';
import CreateAc from '../../components/Button/CreateAc';

function HotelRegisterFinal({ navigation }) {

    const [isSwitchOn, setIsSwitchOn] = React.useState(false);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);
    const [message, setMessage] = React.useState("");

    const controlLogin = () => {
        // if (isSwitchOn) {
            navigation.navigate('Login');
        // } else if (!isSwitchOn) {
        //     navigation.navigate('HotelRegister2');
        // }
    }

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

            <TouchableOpacity onPress={() => navigation.navigate("HotelRegister2")}>
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
                {isSwitchOn && <RegistreTop navigation={navigation} />}

                {!isSwitchOn &&
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.fields}>

                            <TextInput
                                style={styles.input}
                                placeholder="About the laundry"
                                keyboardType="default"
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={styles.inputin}
                                placeholder="Message"
                                keyboardType='default'
                                multiline={true} // Enable multiline input
                                numberOfLines={4} // Specify default number of visible lines
                                value={message}
                                onChange={(e) => setMessage(e)}
                                placeholderTextColor={keyboardVisible ? "black" : '#999'}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                        </View>
                    </ScrollView>}
            </BlurView>


            <TouchableOpacity style={styles.loginButton} onPress={controlLogin}>
                <Text style={styles.loginButtonText}>
                    Sign up
                </Text>
            </TouchableOpacity>

            <Or />
            <CreateAc butname="For Login" navigation={navigation} path="Login" />

        </View >
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: '#ffff', // Light background
    },
    image: {
        position: 'absolute',
        width: '100%',
        height: '40%',
        // opacity: '0.9'
    },
    imagein: {
        marginTop: '15%',
        marginLeft: '5%'
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
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
    },
    inputin: {
        height: 150,
        width: '100%',
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
        borderColor: 'rgba(0,0,0,0.3)',
        borderWidth: '1',
        borderRadius: 10,
        textAlignVertical: 'top'
    }
});


export default HotelRegisterFinal