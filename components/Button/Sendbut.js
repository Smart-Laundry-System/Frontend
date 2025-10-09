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
        borderRadius: 10,
        borderColor: 'black', 
        borderWidth: 1,      
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        alignSelf: 'center'
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#3C4234',
    }
})

export default Sendbut