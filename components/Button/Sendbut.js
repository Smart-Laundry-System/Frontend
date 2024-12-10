import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function Sendbut({name}) {
    return (
        <View>
            <TouchableOpacity style={styles.send} >
                <Text style={styles.loginButtonText}>{name}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
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
    loginButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#3C4234',
    }
})

export default Sendbut