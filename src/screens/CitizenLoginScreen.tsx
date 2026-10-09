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
import { CitizenLoginResponseModel } from '../models';
import { localSet, nativeSet } from '../services/storage';
import { session } from '../services/sessionManager';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors } from '../theme';
import { authStyles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'CitizenLogin'>;

const CitizenLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const postLoginData = async () => {
    presentLoading('Loading...');
    try {
      const response: CitizenLoginResponseModel = await session.getCitizenLogin(
        ApiConstant.MainApi + ApiConstant.CitizenLoginApi,
        { phone, password },
      );
      console.log('response data is::::' + JSON.stringify(response));
      if (response.login_status === 'success') {
        console.log('this.response.mobile_no::::' + response.mobile_no);
        await localSet(LocalKeys.phone, response.mobile_no ?? null);
        await localSet(LocalKeys.password, password);
        await localSet(LocalKeys.rememberme, 'true');
        const citizenId =
          response.citizen_id || (response.citizen_profile && response.citizen_profile.citizen_id);
        if (citizenId) {
          await localSet(LocalKeys.citizen_id, String(citizenId));
        }
        await nativeSet(NativeKeys.CitizenIsLoggedIn, 'true');
        dismissLoading();
        navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
      } else {
        dismissLoading();
        showAlert('Parking', response.error);
      }
    } catch (error) {
      dismissLoading();
      console.error('Citizen login failed', error);
      showAlert('Parking', 'Unable to reach the login service');
    }
  };

  const login = () => {
    console.log(
      'Citizen login request started for phone: ' +
        '*'.repeat(Math.max(0, phone.length - 2)) +
        phone.slice(-2),
    );
    if (phone.length === 0) {
      showAlert('Error', 'Please enter mobile number');
      return;
    }
    if (phone.length !== 10) {
      showAlert('Error', 'Mobile number must be 10 digit');
      return;
    }
    if (password.length === 0) {
      showAlert('Error', 'Please enter password');
      return;
    }
    postLoginData();
  };

  const newRegistration = () => navigation.push('CustomerRegistration');
  const forgotPassword = () => navigation.push('ForgotPassword');

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.flexGrow} keyboardShouldPersistTaps="handled">
          <View style={authStyles.content}>
            <Text style={authStyles.heading}>Citizen Login</Text>
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
            <Pressable onPress={newRegistration}>
              <Text style={authStyles.linkButton}>
                Don't have an account? <Text style={authStyles.linkText}>Sign Up.</Text>
              </Text>
            </Pressable>
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

export default CitizenLoginScreen;
