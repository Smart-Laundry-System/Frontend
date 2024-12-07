import React from 'react'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Vector from '../assets/Vector.png'
import backLogin from '../assets/backLogin.png'
import imageLoginBack from '../assets/imageLoginBack.png'

function Login({ navigation }) {

    const backtoback = () => {
        navigation.navigate('Login');
    }
    return (
        <View
            style={styles.container}
        >
            <TouchableOpacity onPress={backtoback}>
                <Image source={backLogin} style={styles.imageBack} />
                <Text>hiiijhuyhyugyuhuyguyhygubgyg</Text>
            </TouchableOpacity>
            <View style={styles.backtop}></View>

            <Image style={styles.image} source={Vector} />
            <Text style={styles.title}>
                The Smart Laundry.
            </Text>
            <Text style={styles.subTit}>
                Enter your given email and password
            </Text>
            <Image source={imageLoginBack} style={styles.imageLoginBack} />

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
                <TouchableOpacity >
                    <Text style={styles.resetfont}>Reset the password</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={styles.linedecl}></Text>

                <Text style={{ marginTop: '6.5', position: 'absolute' }}>or</Text>
                <Text style={styles.linedecr}></Text>
            </View>

            <TouchableOpacity style={styles.createac} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.loginButtonText}>Create an account</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    linedecr: {
        textDecorationLine: "underline",
        // justifyContent:'center',
        textAlign: 'center',
        borderBottomWidth: 1,
        // paddingBottom: 1,
        marginRight: '12.5%',
        marginLeft: '25%',
        // position:'absolute'
    },
    linedecl: {
        textDecorationLine: "underline",
        // justifyContent:'center',
        textAlign: 'center',
        borderBottomWidth: 1,
        // paddingBottom: 1,
        marginLeft: '12.5%',
        marginRight: '25%',
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
        gap: 3
    },
    imageLoginBack: {
        bottom: 0,
        width: '100%',
        height: '47%',
        position: 'absolute',
        marginBottom: '5%'
    },
    fields: {
        width: '80%',
        alignSelf: 'center',
        marginTop: '90%',
    },
    input: {
        height: 50,
        width: '100%',
        borderWidth: 1,
        borderRadius: 15,
        borderColor: 'rgba(0,0,0,0.3)',
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
    },
    createac: {
        width: '75%',
        height: 45,
        backgroundColor: '#ffff', // Green color
        borderRadius: 10,
        borderColor: 'rgba(0,0,0,0.53)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'center',
    },
    loginButton: {
        width: '75%',
        height: 45,
        backgroundColor: '#A3AE95', // Green color
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
        // height:''
    },
    container: {
        flex: 1,
        backgroundColor: '#ffff'
    }
})

export default Login