import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { ApiConstant } from '../constants/api';
import {
  CitizenForgotPasswordResponseModel,
  AttendantForgotPasswordResponseModel,
} from '../models';
import { session } from '../services/sessionManager';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors } from '../theme';
import { authStyles } from './authScreenStyles';

const ForgotPasswordScreen: React.FC<any> = ({ navigation, variant }) => {
  const [phone, setPhone] = useState('');
  const isCitizen = variant === 'citizen';

  const showAlertMessage = (title: string, msg: string | undefined) => showAlert(title, msg ?? '');

  const postForgotPasswordData = async () => {
    presentLoading('Loading...');
    try {
      if (isCitizen) {
        const response: CitizenForgotPasswordResponseModel =
          await session.getCitizenForgotPassword(
            ApiConstant.MainApi + ApiConstant.CitizenForgotPasswordApi,
            { phone },
          );
        console.log('response data is::::' + JSON.stringify(response));
        dismissLoading();
        if (response.status === 'success') {
          showAlert('Parking', response.message ?? '', () =>
            navigation.reset({ index: 0, routes: [{ name: 'CitizenLogin' }] }),
          );
        } else {
          showAlertMessage('Error', response.message ?? '');
        }
      } else {
        const response: AttendantForgotPasswordResponseModel =
          await session.getAtendantForgotPassword(
            ApiConstant.MainApi + ApiConstant.AttendantForgotPasswordApi,
            { phone },
          );
        console.log('response data is::::' + JSON.stringify(response));
        dismissLoading();
        if (response.status === 'success') {
          showAlert('Parking', response.message ?? '', () =>
            navigation.reset({ index: 0, routes: [{ name: 'AttendantLogin' }] }),
          );
        } else {
          showAlertMessage('Error', response.message ?? '');
        }
      }
    } catch (error) {
      dismissLoading();
      console.error('Forgot password request failed', error);
      showAlertMessage('Error', 'Unable to reach the server');
    }
  };

  const forgotPassword = () => {
    if (phone.length === 0) {
      showAlertMessage('Error', 'Please enter mobile number');
      return;
    }
    if (phone.length !== 10) {
      showAlertMessage('Error', 'Mobile number must be 10 digit');
      return;
    }
    postForgotPasswordData();
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.flexGrow} keyboardShouldPersistTaps="handled">
          <View style={authStyles.content}>
            <Text style={authStyles.heading}>
              {isCitizen ? 'Citizen Forgot Password' : 'Attendant Forgot Password'}
            </Text>
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
            <PillButton
              label="Submit"
              color={colors.ktm}
              onPress={forgotPassword}
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

export default ForgotPasswordScreen;
