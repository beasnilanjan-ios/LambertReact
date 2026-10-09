import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { LocalKeys, NativeKeys } from '../constants/storage';
import { LoginResponseModel } from '../models';
import { localSet, nativeSet } from '../services/storage';
import { session } from '../services/sessionManager';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors } from '../theme';
import { authStyles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendantLogin'>;

const AttendantLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const forgotPassword = () => navigation.push('AttandantForgotPassword');

  const login = async () => {
    try {
      presentLoading();
      if (phone.length === 0) {
        dismissLoading();
        showAlert('Error', 'Please enter mobile number');
        return;
      }
      if (password.length === 0) {
        dismissLoading();
        showAlert('Error', 'Please enter password');
        return;
      }
      console.log('Username ' + phone);
      const response: LoginResponseModel = await session.getResponseLogin(
        ApiConstant.MainApi + ApiConstant.Login,
        { phone, password },
      );
      console.log('Attendant login response::::' + JSON.stringify(response));
      dismissLoading();
      if (response.login_status === 'success') {
        await localSet(LocalKeys.attandantRememberme, 'true');

        // Store Enable boom gate default value
        await nativeSet(NativeKeys.EnableBoomGate, 'Nil');
        await nativeSet(NativeKeys.DeviceConnected, 'false');

        // Store login details (normalize attendant user id for parking APIs)
        const loginDetail = Object.assign({}, response, {
          vender_user_id: response.vender_user_id || response.vendor_user_id,
        });
        try {
          await nativeSet(NativeKeys.NSUDloginDetail, loginDetail);
          await nativeSet(NativeKeys.NSUDIsLoggedIn, 'true');
        } catch (error) {
          console.error('Error storing login item', error);
        }
        console.log('login stored!!!');
        navigation.push('ParkingZone', { loginDetail });
      } else {
        showAlert('Parking', 'No user found');
      }
      console.log(response.name);
    } catch (error: any) {
      dismissLoading();
      console.error('Login request failed', error);
      const status = error && error.status ? ' (HTTP ' + error.status + ')' : '';
      showAlert(
        'Login failed',
        'Unable to reach the login service' +
          status +
          '. Check the server address and network connection.',
      );
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.flexGrow} keyboardShouldPersistTaps="handled">
          <View style={authStyles.content}>
            <Text style={authStyles.heading}>Attendant Login</Text>
            <View style={authStyles.formControl}>
              <TextInput
                style={authStyles.input}
                placeholder="Mobile Number"
                placeholderTextColor={colors.label}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={authStyles.formControl}>
              <TextInput
                style={authStyles.input}
                placeholder="Password"
                placeholderTextColor={colors.label}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                underlineColorAndroid="transparent"
              />
            </View>
            <Pressable onPress={forgotPassword}>
              <Text style={authStyles.linkButton}>
                <Text style={authStyles.linkText}>Forgot password?</Text>
              </Text>
            </Pressable>
            <PillButton
              label="Log In"
              color={colors.ktm}
              onPress={login}
              style={authStyles.orangeButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
});

export default AttendantLoginScreen;
