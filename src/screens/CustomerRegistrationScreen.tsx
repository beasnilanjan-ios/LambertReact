import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { FloatingInput } from '../components/FloatingInput';
import { PillButton } from '../components/PillButton';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { CitizenSignupResponseModel, TermsAndConditionsResponseModel } from '../models';
import { session } from '../services/sessionManager';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { appData } from '../support/appData';
import { openInAppBrowser } from '../support/inAppBrowser';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerRegistration'>;

const CustomerRegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsDetail, setTermsDetail] = useState<string | undefined>(appData.termsDetail);
  const [isSelectedTermsNCond, setIsSelectedTermsNCond] = useState(false);

  const getTermsAndConditions = async () => {
    try {
      const res: TermsAndConditionsResponseModel = await session.getTermsAndConditions(
        ApiConstant.MainApi + ApiConstant.TermsAndConditions,
      );
      console.log('termsResponse data is::::' + JSON.stringify(res));
      if (res.status === 'Success') {
        setTermsDetail(res.message);
        appData.termsDetail = res.message;
        console.log(res.message);
      } else {
        console.log(res.status);
      }
    } catch (error) {
      console.error('Terms request failed', error);
    }
  };

  useEffect(() => {
    getTermsAndConditions();
  }, []);

  const openBrowser = () => {
    console.log('in the browser function');
    console.log('this.termsDetails:::::' + termsDetail);
    openInAppBrowser(termsDetail);
  };

  const postCustomerInfo = async () => {
    presentLoading('Loading...');
    try {
      const res: CitizenSignupResponseModel = await session.getCitizenSignup(
        ApiConstant.MainApi + ApiConstant.CitizenSignupApi,
        { name, address, mobile_no: mobileNo, email, password },
      );
      console.log('response data is::::' + JSON.stringify(res));
      if (res.status === 'success') {
        dismissLoading();
        showAlert('Parking', 'Registration successful!', () => navigation.push('CitizenLogin'));
      } else {
        dismissLoading();
        showAlert('Error', res.error);
      }
    } catch (error) {
      dismissLoading();
      console.error('Signup request failed', error);
      showAlert('Error', 'Unable to reach the server');
    }
  };

  const signup = () => {
    if (name.length === 0) {
      showAlert('Error', 'Please enter name');
    } else if (address.length === 0) {
      showAlert('Error', 'Please enter address');
    } else if (mobileNo.length === 0) {
      showAlert('Error', 'Please enter mobile number');
    } else if (mobileNo.length !== 10) {
      showAlert('Error', 'Mobile number must be 10 digit');
    } else if (email.length === 0) {
      showAlert('Error', 'Please enter email id');
    } else if (password.length === 0) {
      showAlert('Error', 'Please enter password');
    } else {
      console.log('Signup details::::' + JSON.stringify({ name, address, mobileNo, email }));
      postCustomerInfo();
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="New Profile" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.flexGrow} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.heading}>Sign Up</Text>
            <FloatingInput label="Name" value={name} onChangeText={setName} />
            <FloatingInput label="Address" value={address} onChangeText={setAddress} />
            <FloatingInput
              label="Contact Number"
              value={mobileNo}
              onChangeText={setMobileNo}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <FloatingInput
              label="Email Id"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <FloatingInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.termsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelectedTermsNCond }}
                onPress={() => setIsSelectedTermsNCond(v => !v)}
                style={styles.checkbox}>
                {isSelectedTermsNCond ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
              <Pressable onPress={openBrowser} style={styles.termsLabel}>
                <Text style={styles.termsText}>
                  I agree to Lambert Parking <Text style={styles.link}>Terms &amp; Conditions</Text>
                </Text>
              </Pressable>
            </View>
            <View style={styles.signupBtn}>
              <PillButton
                label="Sign Up"
                color={colors.ktm}
                onPress={signup}
                disabled={!isSelectedTermsNCond}
                style={styles.signupButton}
              />
            </View>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  heading: {
    color: 'black',
    marginTop: 50,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingLeft: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkmark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsLabel: {
    flex: 1,
    paddingLeft: 12,
  },
  termsText: {
    color: 'black',
    fontSize: 15,
    lineHeight: 20,
  },
  link: {
    color: colors.link,
  },
  signupBtn: {
    marginTop: 20,
  },
  signupButton: {
    height: 40,
    backgroundColor: colors.ktm,
  },
});

export default CustomerRegistrationScreen;
