import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

function Or() {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={styles.linedecl}></Text>
        <Text style={{ marginTop: '6.5', position: 'absolute' }}>or</Text>
        <Text style={styles.linedecr}></Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  linedecl: {
    textDecorationLine: "underline",
    textAlign: 'center',
    borderBottomWidth: 1,
    marginRight: '2.5%',
    width: '34%'
  },
  linedecr: {
    textDecorationLine: "underline",
    textAlign: 'center',
    borderBottomWidth: 1,
    marginLeft: '2.5%',
    width: '34%'
  }
})

export default Or