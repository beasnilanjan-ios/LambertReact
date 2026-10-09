import React, { useState } from 'react';
import {
  Image,
  Keyboard,
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
import { ParkingHistoryArrayModel, ParkingHistoryResponseModel } from '../models';
import { session } from '../services/sessionManager';
import { useMenu } from '../support/menuContext';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors, fontSizes } from '../theme';
import { authStyles } from './authScreenStyles';

const historyIcon = require('../assets/imgs/history.png');

type Props = NativeStackScreenProps<RootStackParamList, 'CitizenParkingHistory'>;

const CitizenParkingHistoryScreen: React.FC<Props> = () => {
  const { openMenu } = useMenu();
  const [tempmobile, setTempmobile] = useState('');
  const [historyArray, setHistoryArray] = useState<ParkingHistoryArrayModel[]>([]);

  const getHistoryData = async () => {
    if (tempmobile.length === 0) {
      return;
    }
    try {
      presentLoading();
      const url = ApiConstant.MainApi + ApiConstant.ParkingHistoryApi + tempmobile;
      console.log('URl----->' + url);
      const value: ParkingHistoryResponseModel = await session.getCitizenParkingHistory(url);
      dismissLoading();
      console.log('history success----->' + JSON.stringify(value));
      if (value.status === 'success') {
        setHistoryArray(value.parking_history ?? []);
        console.log('response history-------' + JSON.stringify(value.parking_history));
      } else {
        showAlert('Parking', value.error);
        setHistoryArray([]);
      }
    } catch (error) {
      dismissLoading();
      console.log(error);
    }
  };

  const btnDone = () => {
    try {
      console.log('tempmobile---->' + tempmobile);
      if (tempmobile) {
        if (tempmobile.length === 10) {
          console.log('If mobile number found');
          console.log('Mobile: ' + tempmobile);
          getHistoryData();
        } else {
          showAlert('Parking', 'Mobile number should be 10 digits');
        }
      } else {
        console.log('Else no number');
        showAlert('Parking', 'Please enter mobile number');
      }
    } catch (error) {
      console.log('catch block---->');
      console.log(JSON.stringify(error));
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showMenu onMenu={openMenu} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>History</Text>
        <View style={styles.hr} />

        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <View style={authStyles.formControl}>
              <TextInput
                style={authStyles.input}
                placeholder="Mobile Number"
                placeholderTextColor={colors.label}
                value={tempmobile}
                onChangeText={text => setTempmobile(text.replace(/[^0-9]/g, ''))}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          <View style={styles.buttonCol}>
            <PillButton
              label="Done"
              color={colors.btnDark}
              onPress={btnDone}
              style={styles.doneButton}
              textStyle={styles.doneButtonText}
            />
          </View>
        </View>

        {historyArray.map((item, index) => (
          <View style={styles.card} key={`${item.allotment_id}-${index}`}>
            <View style={styles.cardRow}>
              <View style={styles.iconCol}>
                <Image source={historyIcon} style={styles.historyIcon} />
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Vehicle Type: </Text>
                  {item.vehicle_type}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Mobile: </Text>
                  {item.mobile}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Location: </Text>
                  {item.location}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Entry Time: </Text>
                  {item.entry_time}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Exit Time: </Text>
                  {item.exit_time}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}> Fare: </Text>
                  {item.fare}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
    paddingBottom: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  hr: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  inputCol: {
    width: '70%',
    paddingHorizontal: 4,
  },
  buttonCol: {
    width: '30%',
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  doneButton: {
    height: 32,
    backgroundColor: colors.btnDark,
  },
  doneButtonText: {
    fontSize: fontSizes.small,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: colors.white,
    ...{
      shadowColor: 'rgba(0,0,0,0.14)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  cardRow: {
    flexDirection: 'row',
    paddingVertical: 15,
  },
  iconCol: {
    width: '30%',
  },
  historyIcon: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  detailCol: {
    width: '70%',
    paddingRight: 10,
  },
  vehicleNumber: {
    fontSize: fontSizes.heading - 4,
    fontWeight: '700',
    color: 'black',
    marginBottom: 4,
  },
  row: {
    fontSize: fontSizes.body + 1,
    color: '#333',
    marginBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default CitizenParkingHistoryScreen;
