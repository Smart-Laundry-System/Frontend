// StartPage.js
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import background from '../assets/startimage.png'
import backPart from '../assets/backPart.png'
import inerbutton from '../assets/inerbutton.png'
import { LinearGradient } from 'expo-linear-gradient'; // Uncomment if using Expo

const { width, height } = Dimensions.get("window");

function StartPage({navigation}) {

    const tologin = () => {
        navigation.navigate('Login')
    }

    return (
        <View style={styles.container}>
            <Image style={styles.image} source={background} />
            {/* <View style={styles.overlayr}></View>
            <View style={styles.overlayl}></View> */}
            <Image style={styles.overlayr} source={backPart} />
            <Text style={styles.title}>Welcome to The{"\n"} Smart Laundry</Text>
            {/* <Image source={backPart}/> */}
            {/* <TouchableOpacity onPress={() => alert('Button Pressed')} style={styles.buttonContainer}>
                <LinearGradient
                    colors={['#3CB371', '#2E8B57']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Next</Text>
                </LinearGradient>
            </TouchableOpacity> */}
            {/* <TouchableOpacity>
                <LinearGradient colors={['#3CB371', '#2E8B57']}                >
                    <View style={styles.button}></View>
                </LinearGradient>
            </TouchableOpacity> */}
            <TouchableOpacity onPress={tologin}>
                <LinearGradient colors={['#3C4234', 'rgba(163, 174, 149,0.64)']} style={styles.button}>
                    {/* <Text style={styles.buttonText}>Next</Text> */}
                    <View style={styles.linecon}>
                        <Image style={styles.arrow} source={inerbutton} />
                        {/* </View>
                    <View> */}
                        <Image style={styles.arrow} source={inerbutton} />
                        {/* </View>
                    <View> */}
                        <Image style={styles.arrow} source={inerbutton} />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

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
        backgroundColor: '#A3AE95'
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
    // buttonContainer: {
    //     position: 'absolute',
    //     top: '75%',
    //     width: 200,
    //     height: 50,
    //     borderRadius: 25,
    //     overflow: 'hidden', // Ensures the gradient fits within the rounded border
    // },
    // button: {
    //     width: 200,
    //     height: 50,
    //     borderRadius: 25,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },

    // buttonText: {
    //     color: '#fff',
    //     fontSize: 18,
    //     fontWeight: 'bold',
    // },
    button: {
        // borderBottomRightRadius:'200',
        // backgroundColor: 'red', // Green button
        width: 200,
        height: 50,
        // justifyContent: 'center',
        // alignItems: 'center',
        borderRadius: 15, // Make it rounded
        position: 'absolute',
        left: '30%',
        marginTop: '20%',
        // top: '95%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    overlayr: {
        position: 'absolute',
        width: '100%',
        height: '59%',
        // backgroundColor: '#A3AE95',
        // borderTopRightRadius: 200,
        // borderTopLeftRadius: 200,
        // transform: [{ rotate: '45deg' }], // Rotate for wave effect
        top: '43%',
        // right: '-25%',
    },
    // overlayl: {
    //     position: 'absolute',
    //     width: '50%',
    //     height: 200,
    //     backgroundColor: '#A3AE95',
    //     borderTopRightRadius: 200,
    //     borderTopLeftRadius: 200,
    //     transform: [{ rotate: '-45deg' }], // Rotate for wave effect
    //     top: '40%',
    //     left: '-25%',
    // },
    title: {
        marginTop: '65%',
        fontSize: 30,
        fontWeight: 'bold',
        color: '#3C4234',
        textAlign: 'center'
    },
    bottitle: {
        fontSize: 11,
        color: '#3C4234',
        textShadowColor: 'rgba(0,0,0,0.4)', // Shadow color
        textShadowRadius: 5, // Increased radius for a stronger shadow effect
        textShadowOffset: { width: 1, height: 1 }, // Offset for shadow position
        textShadowOpacity: 0.3, // Adjust the opacity for a more subtle shadow
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

export default StartPage; // Correct default export


// ...// StartPage.js
// import background from '../assets/startimage.png'
// import React from 'react';
// import { StyleSheet, Text, View, ImageBackground, TouchableOpacity } from 'react-native';

// const StartPage = () => {
//   return (
//     <ImageBackground
//       source={background} // Replace with the correct path to your image
//       style={styles.background}
//     >
//       <View style={styles.overlay}>
//         <Text style={styles.title}>Welcome to The Smart Laundry</Text>
//         <Text style={styles.subtitle}>
//           We provide services related to laundry.
//           {'\n'}-Delivery of Clothes & online booking for laundry-
//         </Text>

//         <TouchableOpacity style={styles.button} onPress={() => alert('Button Pressed')}>
//           <Text style={styles.buttonText}>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </ImageBackground>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     resizeMode: 'cover',
//   },
//   overlay: {
//     backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slight overlay to make text more visible
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 10,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   button: {
//     backgroundColor: '#3CB371', // Green color
//     padding: 15,
//     borderRadius: 30,
//     width: 200,
//     alignItems: 'center',
//   },
//   buttonText: {
//     fontSize: 18,
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });

// export default StartPage;

// ..
