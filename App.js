import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import StartPage from './screens/StartPage'; // Correct import
import Login from './screens/Login';
import UserRegistre from './screens/LaundryUsers/UserRegistre';
import { PaperProvider } from 'react-native-paper';
import HotelRegister2 from './screens/LaundryAdmin/HotelRegister2';
// import HotelRegFinal from './screens/HotelAdmin/HotelRegFinal';
import HotelRegisterFinal from './screens/LaundryAdmin/HotelRegisterFinal';
import LaundryHome from './screens/LaundryAdmin/LaundryHome';
import UserHome from './screens/LaundryUsers/UserHome';
import Profile from './screens/LaundryAdmin/AfterLogedIn/Profile';
import Toast from 'react-native-toast-message';
import ComplaintsPage from './screens/Complain/ComplaintsPage';
import ProfileUser from './screens/LaundryUsers/AfterLogedIn/ProfileUser';
import UserOrders from './screens/LaundryUsers/AfterLogedIn/UserOrders';
import NotificationFrmLaundry from './screens/LaundryUsers/AfterLogedIn/NotificationFrmLaundry';
import OrderHistoryCustomers from './screens/LaundryAdmin/AfterLogedIn/OrderHistoryCustomers';
import LaundryItems from './screens/LaundryAdmin/AfterLogedIn/LaundryItems';
import ComplaintsList from './screens/LaundryAdmin/AfterLogedIn/ComplaintsList';
import CustomerOrder from './screens/LaundryAdmin/AfterLogedIn/CustomerOrder';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={StartPage} options={{ headerShown: false }} />
          <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
          <Stack.Screen name='UserRegistration' component={UserRegistre} options={{ headerShown: false }} />
          <Stack.Screen name='HotelRegister2' component={HotelRegister2} options={{ headerShown: false }} />
          {/* <Stack.Screen name='HotelRegFinal' component={HotelRegFinal} options={{ headerShown: false }} /> */}
          <Stack.Screen name='HotelRegisterFinal' component={HotelRegisterFinal} options={{ headerShown: false }} />
          {/* <Stack.Screen name="StartPage" component={StartPage} options={{ title:'Startpage' }} /> */}
          {/* <Stack.Screen name='Login' component={Login} options={{ title:'Login' }} /> */}
          {/* <Stack.Screen name='UserRegistration' component={UserRegistre} options={{ title:'UserRegistre' }} /> */}
          {/* <Stack.Screen name='HotelRegister2' component={HotelRegister2} options={{ title:'HotelRegister2' }} /> */}
          {/* <Stack.Screen name='HotelRegFinal' component={HotelRegFinal} options={{ title:'HotelRegFinal' }} /> */}
          <Stack.Screen name='Profile' component={Profile} options={{ headerShown: false }} />
          <Stack.Screen name='ProfileUser' component={ProfileUser} options={{ headerShown: false }} />
          <Stack.Screen name="UserHome" component={UserHome} options={{ headerShown: false }} />
          <Stack.Screen name='LaundryHome' component={LaundryHome} options={{ headerShown: false }} />
          <Stack.Screen name='Complaint' component={ComplaintsPage} options={{ headerShown: false }} />
          <Stack.Screen name='UserOrders' component={UserOrders} options={{ headerShown: false }} />
          <Stack.Screen name='NotificationFrmLaundry' component={NotificationFrmLaundry} options={{ headerShown: false }} />
          <Stack.Screen name="ComplaintsList" component={ComplaintsList} options={{ headerShown: false }} />
          <Stack.Screen name="LaundryItems" component={LaundryItems} options={{ headerShown: false }} />
          <Stack.Screen name="OrderHistoryCustomers" component={OrderHistoryCustomers} options={{ headerShown: false }} />
          <Stack.Screen name="CustomerOrder" component={CustomerOrder} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
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
