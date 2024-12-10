import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function LoginBut({ login, navigation }) {
  return (
    <View>
      <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.loginButtonText}>{login}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
  }
})

export default LoginBut