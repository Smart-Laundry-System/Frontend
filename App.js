import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import StartPage from './screens/StartPage';
import Login from './screens/Login';
import UserRegistre from './screens/LaundryUsers/UserRegistre';
import { PaperProvider } from 'react-native-paper';
import HotelRegister2 from './screens/LaundryAdmin/HotelRegister2';
import HotelRegisterFinal from './screens/LaundryAdmin/HotelRegisterFinal';
import LaundryHome from './screens/LaundryAdmin/LaundryHome';
import UserHome from './screens/LaundryUsers/UserHome';
import Profile from './screens/LaundryAdmin/AfterLogedIn/Profile';
import ComplaintsPage from './screens/LaundryAdmin/AfterLogedIn/Complain/ComplaintsPage';
import ProfileUser from './screens/LaundryUsers/AfterLogedIn/ProfileUser';
import UserOrders from './screens/LaundryUsers/AfterLogedIn/UserOrders';
import NotificationFrmLaundry from './screens/LaundryUsers/AfterLogedIn/NotificationFrmLaundry';
import OrderHistoryCustomers from './screens/LaundryAdmin/AfterLogedIn/OrderHistoryCustomers';
import LaundryItems from './screens/LaundryAdmin/AfterLogedIn/LaundryItems';
import ComplaintsList from './screens/LaundryAdmin/AfterLogedIn/ComplaintsList';
import CustomerOrder from './screens/LaundryAdmin/AfterLogedIn/CustomerOrder';
import OrderDetails from './screens/LaundryUsers/AfterLogedIn/OrderDetails';
import { RegistrationProvider } from "./context/RegistrationContext";
import UserLaundry from './screens/LaundryUsers/AfterLogedIn/UserLaundry';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from "expo-constants";
import Toast from 'react-native-toast-message';
import Employees from './screens/LaundryAdmin/AfterLogedIn/Employees';
import AddEmployee from './screens/LaundryAdmin/AfterLogedIn/AddEmployee';
import { useState } from 'react';
import LoadingScreen from './LoadingScreen';
import UpdateUser from './screens/LaundryUsers/AfterLogedIn/UpdateUser';
import Customers from './screens/LaundryAdmin/AfterLogedIn/Customers';

const Stack = createStackNavigator();

const extra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

export default function App() {
  return (
    <PaperProvider>
      <RegistrationProvider>
        <StripeProvider
          publishableKey={extra.STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.smartlaundry"
          urlScheme="smartlaundry"
        >
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen name="Home" component={StartPage} options={{ headerShown: false }} />
              <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
              <Stack.Screen name='UserRegistration' component={UserRegistre} options={{ headerShown: false }} />
              <Stack.Screen name='HotelRegister2' component={HotelRegister2} options={{ headerShown: false }} />
              <Stack.Screen name='HotelRegisterFinal' component={HotelRegisterFinal} options={{ headerShown: false }} />
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
              <Stack.Screen name="OrderDetails" component={OrderDetails} options={{ headerShown: false }} />
              <Stack.Screen name="UserLaundry" component={UserLaundry} options={{ headerShown: false }} />
              <Stack.Screen name="Employees" component={Employees} options={{ headerShown: false }} />
              <Stack.Screen name="AddEmployee" component={AddEmployee} options={{ headerShown: false }} />
              <Stack.Screen name="UpdateUser" component={UpdateUser} options={{ headerShown: false }} />
              <Stack.Screen name="Customers" component={Customers} options={{ headerShown: false }} />
            </Stack.Navigator>
            <Toast topOffset={50} bottomOffset={50} />
          </NavigationContainer>
        </StripeProvider>
      </RegistrationProvider>
    </PaperProvider>
  );
}
