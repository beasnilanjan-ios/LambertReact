import React from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import LandingScreen from '../screens/LandingScreen';
import AttendantLoginScreen from '../screens/AttendantLoginScreen';
import CitizenLoginScreen from '../screens/CitizenLoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import CustomerRegistrationScreen from '../screens/CustomerRegistrationScreen';
import LogoutScreen from '../screens/LogoutScreen';
import ParkingZoneScreen from '../screens/ParkingZoneScreen';
import EntryScreen from '../screens/EntryScreen';
import ExitScreen from '../screens/ExitScreen';
import SupportScreen from '../screens/SupportScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CustomerDeregistrationScreen from '../screens/CustomerDeregistrationScreen';
import CouponsScreen from '../screens/CouponsScreen';
import CitizenParkingHistoryScreen from '../screens/CitizenParkingHistoryScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import MapScreen from '../screens/MapScreen';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const isReady = () => navigationRef.isReady();

export const navigate = <T extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[T]
    ? [screen: T, params?: RootStackParamList[T]]
    : [screen: T, params: RootStackParamList[T]]
) => {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(...args);
  }
};

export const resetTo = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name, params }] as any });
  }
};

export const getCurrentRouteName = (): string | undefined =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;

const Stack = createNativeStackNavigator<RootStackParamList>();


export const RootNavigator: React.FC<{ initialRouteName: keyof RootStackParamList }> = ({
  initialRouteName,
}) => (
  <NavigationContainer ref={navigationRef}>
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="AttendantLogin" component={AttendantLoginScreen} />
      <Stack.Screen name="CitizenLogin" component={CitizenLoginScreen} />
      <Stack.Screen name="AttandantForgotPassword">
        {props => <ForgotPasswordScreen {...props} variant="attendant" />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword">
        {props => <ForgotPasswordScreen {...props} variant="citizen" />}
      </Stack.Screen>
      <Stack.Screen name="CustomerRegistration" component={CustomerRegistrationScreen} />
      <Stack.Screen name="Logout" component={LogoutScreen} />
      <Stack.Screen name="ParkingZone" component={ParkingZoneScreen} />
      <Stack.Screen name="Entry" component={EntryScreen} />
      <Stack.Screen name="Exit" component={ExitScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="CitizenParkingHistory" component={CitizenParkingHistoryScreen} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="CustomerDeregistration" component={CustomerDeregistrationScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;
