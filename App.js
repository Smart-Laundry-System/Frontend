import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import StartPage from './screens/StartPage'; // Correct import
import Login from './screens/Login';
import UserRegistre from './screens/HotelUser/UserRegistre';
import { PaperProvider } from 'react-native-paper';
import HotelRegister2 from './screens/HotelAdmin/HotelRegister2';
import HotelRegFinal from './screens/HotelAdmin/HotelRegFinal';
import HotelRegisterFinal from './screens/HotelAdmin/HotelRegisterFinal';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="StartPage">
          <Stack.Screen name="StartPage" component={StartPage} options={{ headerShown: false }} />
          <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
          <Stack.Screen name='UserRegistration' component={UserRegistre} options={{ headerShown: false }} />
          <Stack.Screen name='HotelRegister2' component={HotelRegister2} options={{ headerShown: false }} />
          {/* <Stack.Screen name='HotelRegFinal' component={HotelRegFinal} options={{ headerShown: false }} /> */}
          <Stack.Screen name=' HotelRegisterFinal' component={ HotelRegisterFinal} options={{ headerShown: false }} />
          {/* <Stack.Screen name="StartPage" component={StartPage} options={{ title:'Startpage' }} /> */}
          {/* <Stack.Screen name='Login' component={Login} options={{ title:'Login' }} /> */}
          {/* <Stack.Screen name='UserRegistration' component={UserRegistre} options={{ title:'UserRegistre' }} /> */}
          {/* <Stack.Screen name='HotelRegister2' component={HotelRegister2} options={{ title:'HotelRegister2' }} /> */}
          {/* <Stack.Screen name='HotelRegFinal' component={HotelRegFinal} options={{ title:'HotelRegFinal' }} /> */}
          {/* <Stack.Screen name=' HotelRegisterFinal' component={ HotelRegisterFinal} options={{ title:'HotelRegisterFinal' }} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
