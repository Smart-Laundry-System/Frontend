import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { tokens } from "./styles/theme";
import { Text } from "react-native-paper";

export default function LoadingScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/loding.gif")}
        style={styles.image}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.text}>
            Loading...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#efefef",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 150,
  },
  text: {
    ...tokens.components.Typography.h2
  }
});
