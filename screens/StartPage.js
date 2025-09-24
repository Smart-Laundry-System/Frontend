import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import background from '../assets/startimage.png'
import backPart from '../assets/backPart.png'
import Buttoncom from '../components/Button/Buttoncom'
import { tokens } from '../styles/theme';

function StartPage({ navigation }) {

    const [statenav] = useState("Login");

    return (
        <View style={styles.container}>
            <Image style={styles.image} source={background} />
            <Image style={styles.overlayr} source={backPart} />
            <Text style={styles.title}>Welcome to The{"\n"} Smart Laundry</Text>

            <Buttoncom statenav={statenav} navigation={navigation} />
            <Text style={styles.bottitle}>We provide services related to laundry.
                {"\n"}-Delivery of Clothes & online booking for laundry-
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: tokens.colors.greenButton,
        elevation: 5,
    },
    linecon: {
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 'auto',
        marginLeft: '15'
    },
    overlayr: {
        position: 'absolute',
        width: '100%',
        height: '59%',
        top: '43%',
    },
    title: {
        marginTop: '65%',
        fontSize: tokens.components.Typography.h1.fontSize,
        fontWeight: 'bold',
        color: tokens.colors.darkText,
        textAlign: 'center'
    },
    bottitle: {
        fontSize: tokens.components.Typography.small.fontSize,
        color: tokens.colors.darkText,
        ...tokens.shadows.level3,
        top: '25%',
        textAlign: 'center'
    },
    image: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: '50%',
        flex: 1
    }
});

export default StartPage;

