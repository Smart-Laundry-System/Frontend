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
    // justifyContent:'center',
    textAlign: 'center',
    borderBottomWidth: 1,
    // paddingBottom: 1,
    // marginLeft: '21%',
    marginRight: '2.5%',
    width: '34%'
    // position: 'relative'
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
  }
})

export default Or