import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { LocalKeys } from '../constants/storage';
import { CitizenDeRegistrationResponseModel } from '../models';
import { localGet } from '../services/storage';
import { session } from '../services/sessionManager';
import { useMenu } from '../support/menuContext';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDeregistration'>;

const CustomerDeregistrationScreen: React.FC<Props> = ({ navigation }) => {
  const { openMenu } = useMenu();
  const loadData = async () => {
    const citizenId = await localGet(LocalKeys.citizen_id);
    console.log('this.data.citizen_id::::' + citizenId);
    return citizenId ?? '';
  };

  const btnYes = async () => {
    presentLoading();
    const citizenId = await loadData();
    console.log('this.data in getCitizenDeRegistration()*****' + citizenId);
    try {
      const response: CitizenDeRegistrationResponseModel =
        await session.getCitizenDeRegistration(
          ApiConstant.MainApi + ApiConstant.CitizenDeRegistrationApi,
          { citizen_id: citizenId },
        );
      console.log('response data is::::' + JSON.stringify(response));
      dismissLoading();
      if (response.status === 'success') {
        showAlert('Parking', response.message, () => {
          navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
        });
      } else {
        showAlert('Error', response.message);
      }
    } catch (error) {
      dismissLoading();
      console.log(error);
    }
  };

  const btnNo = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showMenu onMenu={openMenu} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>
          Are you sure you want to de-register yourself?
        </Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <PillButton label="Yes" color={colors.ktm} onPress={btnYes} style={styles.button} />
          </View>
          <View style={styles.col}>
            <PillButton label="No" color={colors.ktm} onPress={btnNo} style={styles.button} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 16,
  },
  question: {
    color: 'black',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginTop: 25,
  },
  col: {
    flex: 1,
    paddingHorizontal: 6,
  },
  button: {
    height: 40,
    marginTop: 25,
  },
});

export default CustomerDeregistrationScreen;
