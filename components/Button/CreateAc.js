import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function CreateAc({butname, navigation, path}) {
  return (
    <View>
      <TouchableOpacity style={styles.createac} onPress={() => navigation.navigate(path)}>
        <Text style={styles.loginButtonText}>{butname}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
  loginButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3C4234',
  }
})

export default CreateAc