import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import inerbutton from '../../assets/inerbutton.png'


export default function Button({ statenav, navigation }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate(statenav)}>
                <View style={styles.button}>
                    <View style={styles.linecon}>
                        <Image style={styles.arrow} source={inerbutton} />
                        <Image style={styles.arrow} source={inerbutton} />
                        <Image style={styles.arrow} source={inerbutton} />
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        bottom: '21%',
        right: '25%',
        position: 'absolute',
        elevation: 5
    },
    button: {
        width: 200,
        height: 50,
        borderRadius: 15, // Make it rounded
        position: 'absolute',
        left: '30%',
        marginTop: '20%',
        elevation: 5,
        backgroundColor:"#3C4234"
    },
    linecon: {
        // alignItems: 'center', // Vertically center the content
        // justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 'auto',
        marginLeft: '15'
    },
    arrow: {
        width: 25, // Adjust size of the arrow icon
        height: 30,
        marginRight: '-8',
        resizeMode: 'contain',
    },
})
