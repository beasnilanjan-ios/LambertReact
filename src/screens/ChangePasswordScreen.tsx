import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { LocalKeys } from '../constants/storage';
import { ChangePasswordModel, CitizenChangePasswordResponseModel } from '../models';
import { localGet } from '../services/storage';
import { session } from '../services/sessionManager';
import { useMenu } from '../support/menuContext';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors } from '../theme';
import { authStyles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { openMenu } = useMenu();
  const [oldPwd, setOldPwd] = useState('');
  const [data, setData] = useState<ChangePasswordModel>({
    phone: '',
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    (async () => {
      const password = await localGet(LocalKeys.password);
      const phone = await localGet(LocalKeys.phone);
      console.log('this.oldPassword:::::' + (password ? '********' : ''));
      console.log('this.phone:::::' + phone);
      setOldPwd(password ?? '');
      setData(prev => ({ ...prev, phone: phone ?? '' }));
    })();
  }, []);

  const setField = (field: keyof ChangePasswordModel, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  const postChangedPassword = async () => {
    presentLoading();
    try {
      const response: CitizenChangePasswordResponseModel =
        await session.postCitizenChangePassword(
          ApiConstant.MainApi + ApiConstant.CitizenChangePasswordApi,
          data,
        );
      console.log('response data is::::' + JSON.stringify(response));
      dismissLoading();
      if (response.status === 'success') {
        showAlert('Parking', response.message, () => {
          navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
        });
      } else {
        showAlert('Error', response.message);
      }
    } catch (error) {
      dismissLoading();
      console.log(error);
    }
  };

  const changePassword = () => {
    console.log(
      'this.data' +
        JSON.stringify({
          ...data,
          oldPassword: '********',
          password: '********',
          confirmPassword: '********',
        }),
    );
    if ((data.oldPassword ?? '').length > 0) {
      if (data.oldPassword === oldPwd) {
        if ((data.password ?? '').length > 0) {
          if ((data.confirmPassword ?? '').length > 0) {
            if (data.password === data.confirmPassword) {
              postChangedPassword();
            } else {
              showAlert('Error', 'Your password and confirm password do not match.');
            }
          } else {
            showAlert('Error', 'Please enter confirm password');
          }
        } else {
          showAlert('Error', 'Please enter new password');
        }
      } else {
        showAlert(
          'Error',
          'THis is not your old password! Please enter your correct old password.',
        );
      }
    } else {
      showAlert('Error', 'Please enter old password');
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showMenu onMenu={openMenu} />
      <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={authStyles.heading}>Change Password</Text>

        <View style={authStyles.formControl}>
          <TextInput
            style={authStyles.input}
            placeholder="Old password"
            placeholderTextColor={colors.label}
            secureTextEntry
            value={data.oldPassword}
            onChangeText={text => setField('oldPassword', text)}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={authStyles.formControl}>
          <TextInput
            style={authStyles.input}
            placeholder="New password"
            placeholderTextColor={colors.label}
            secureTextEntry
            value={data.password}
            onChangeText={text => setField('password', text)}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={authStyles.formControl}>
          <TextInput
            style={authStyles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.label}
            secureTextEntry
            value={data.confirmPassword}
            onChangeText={text => setField('confirmPassword', text)}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
          />
        </View>

        <PillButton label="Submit" color={colors.ktm} onPress={changePassword} style={styles.submit} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  submit: {
    marginTop: 20,
    height: 40,
  },
});

export default ChangePasswordScreen;
