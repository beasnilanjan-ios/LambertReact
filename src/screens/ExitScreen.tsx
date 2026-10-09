import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
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
import BluetoothModal from '../components/BluetoothModal';
import ExitModal, { ExitModalParams } from '../components/ExitModal';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { ExitModel, FareResponseModel, ParkedVehicleModel, ParkedVehicleResponseModel } from '../models';
import { session } from '../services/sessionManager';
import { btnGateOpen } from '../services/gate';
import { dismissLoading, presentLoading, showAlert, showAlertWithButtons } from '../support/feedback';
import { modalState } from '../support/modalState';
import { colors, fontSizes } from '../theme';

const licon = require('../assets/imgs/Licon.png');
const gateIcon = require('../assets/icon/gate.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Exit'>;

const formatNow = (): string => {
  const date = new Date();
  return (
    date.getFullYear() +
    '-' +
    (date.getMonth() + 1) +
    '-' +
    date.getDate() +
    ' ' +
    date.getHours() +
    ':' +
    date.getMinutes() +
    ':' +
    date.getSeconds()
  );
};

const ExitScreen: React.FC<Props> = ({ navigation, route }) => {
  const [vehicleList, setVehicleList] = useState<ParkedVehicleModel[]>([]);
  const [preFilterVehicleNumber, setPreFilterVehicleNumber] = useState('');
  const [modalParams, setModalParams] = useState<ExitModalParams | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [bluetoothVisible, setBluetoothVisible] = useState(false);
  // Shared `this.data` equivalent — fare/exempted are pre-set by the modal / exempted flow.
  const dataRef = useRef<ExitModel>({ allotmentId: '', fare: '', exempted: '', coupon: '', time: '' });

  const location = route.params.startLocation + ' To ' + route.params.endLocation;

  const openBluetoothModal = () => {
    modalState.active = 'BluetoothModal';
    setBluetoothVisible(true);
  };

  const closeBluetoothModal = () => {
    modalState.active = undefined;
    setBluetoothVisible(false);
  };

  const getVehicleList = async () => {
    try {
      const url = ApiConstant.MainApi + ApiConstant.ParkedVehicles;
      presentLoading();
      const data = { parking_id: route.params.parking_id };
      console.log('Parking_id--->' + data.parking_id);
      const response: ParkedVehicleResponseModel = await session.getParkedVehicleList(url, data);
      dismissLoading();
      console.log(`response:${JSON.stringify(response)}`);
      if (response.status === 'success') {
        setVehicleList(response.parkedvehicle_list ?? []);
      } else {
        setVehicleList([]);
        showAlert('Parking', 'No vehicle available');
      }
    } catch (error) {
      dismissLoading();
      console.log('error--->' + JSON.stringify(error));
    }
  };

  useEffect(() => {
    getVehicleList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doExit = async (item: ParkedVehicleModel) => {
    try {
      const url = ApiConstant.MainApi + ApiConstant.ExitVehicle;
      presentLoading();
      dataRef.current.time = formatNow();
      dataRef.current.allotmentId = item.allotment_id;
      console.log('DATA TO SEND--->' + JSON.stringify(dataRef.current));
      const response = await session.getExitVehicle(url, dataRef.current);
      dismissLoading();
      console.log(`response:${JSON.stringify(response)}`);
      if (response.status === 'success') {
        /* Ionic's own `Exit & Print` handler is identical to `Exit`
           (no receipt is printed from this screen) — kept verbatim. */
        showAlert('Parking Exit', 'Exit Successful', () => {
          getVehicleList();
        });
      } else {
        showAlert('Parking', 'Some error occured. Please try after sometimes');
      }
    } catch (error) {
      dismissLoading();
      console.log(error);
    }
  };

  const didSelect = (item: ParkedVehicleModel) => {
    console.log('did select ----->');
    showAlertWithButtons('Parking', 'Exit the vehicle ?', [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Exit', onPress: () => doExit(item) },
      { text: 'Exit & Print', onPress: () => doExit(item) },
    ]);
  };

  const exit = async (item: ParkedVehicleModel) => {
    try {
      presentLoading();
      const time = formatNow();
      console.log('Current Date Moment.js---> ' + time);
      const url = ApiConstant.MainApi + ApiConstant.CalculateFareApi;
      const fareData = { allotmentId: item.allotment_id, time };
      console.log('allotment id--->' + fareData.allotmentId);
      console.log('time--->' + fareData.time);
      console.log('url--->' + url);
      const fareResponse: FareResponseModel = await session.getTotalFare(url, fareData);
      console.log('exit response---->' + JSON.stringify(fareResponse));
      if ((fareResponse.status ?? '').toLowerCase() === 'success') {
        if ((fareResponse.gstAmount ?? '').length === 0) {
          fareResponse.gstAmount = 'NA';
        }
        if ((fareResponse.gstPercentage ?? '').length === 0) {
          fareResponse.gstPercentage = 'NA';
        }
        if ((fareResponse.token_no ?? '').length === 0) {
          fareResponse.token_no = 'NA';
        }
        setModalParams({
          baseFare: fareResponse.baseFare,
          gstAmount: fareResponse.gstAmount,
          gstPercentage: fareResponse.gstPercentage,
          token_no: fareResponse.token_no,
          fare: fareResponse.fare,
          totalTime: fareResponse.hourdiff,
          vehicleType: item.vehicle_type,
          allotmentId: fareData.allotmentId,
          time: fareData.time,
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.log(error);
    }
    dismissLoading();
  };

  const exemptedVehicle = async (item: ParkedVehicleModel) => {
    try {
      presentLoading();
      const time = formatNow();
      console.log('Current Date ' + time);
      const url = ApiConstant.MainApi + ApiConstant.CalculateFareApi;
      const fareData = { allotmentId: item.allotment_id, time };
      const fareResponse: FareResponseModel = await session.getTotalFare(url, fareData);
      console.log('exit response---->' + JSON.stringify(fareResponse));
      if (fareResponse.status === 'success') {
        showAlertWithButtons('Exempted Vehicle', undefined, [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              dataRef.current.fare = '0';
              dataRef.current.coupon = '';
              dataRef.current.exempted = '1';
              console.log(dataRef.current.fare);
              didSelect(item);
            },
          },
        ]);
      }
    } catch (error) {
      console.log(error);
    }
    dismissLoading();
  };

  const filterVehicle = ((): ParkedVehicleModel[] => {
    const val = preFilterVehicleNumber;
    if (!val || val.trim() === '') {
      return vehicleList;
    }
    return vehicleList.filter(item =>
      (item.vehicle_number ?? '').toLowerCase().includes(val.toLowerCase()),
    );
  })();

  const onModalClosed = () => {
    modalState.active = undefined;
    setModalVisible(false);
    getVehicleList();
  };

  const btnGate = () => {
    btnGateOpen(openBluetoothModal);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.location}>{location}</Text>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search with vehicle number"
            placeholderTextColor={colors.label}
            value={preFilterVehicleNumber}
            onChangeText={setPreFilterVehicleNumber}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
          />
        </View>

        {filterVehicle.map((item, index) => (
          <View style={styles.card} key={`${item.allotment_id}-${index}`}>
            <Image source={licon} style={styles.avatar} />
            <View style={styles.cardBody}>
              <Text style={styles.vehicleNumber}>
                {(item.vehicle_number ?? '').toUpperCase()}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.bold}> Vehicle Type: </Text>
                {item.vehicle_type}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.bold}> Mobile: </Text>
                {item.mobile}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.bold}> Start Time: </Text>
                {item.entry_time}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.bold}> Type: </Text>
                {item.type}
              </Text>

              <View style={styles.buttonRow}>
                <View style={styles.exitCol}>
                  <PillButton
                    label="Exit"
                    color={colors.yamaha}
                    style={styles.smallButton}
                    textStyle={styles.smallButtonText}
                    onPress={() => exit(item)}
                  />
                </View>
                {item.type === 'Normal' ? (
                  <View style={styles.exemptCol}>
                    <PillButton
                      label="Exempted ?"
                      color={colors.ktm}
                      style={styles.smallButton}
                      textStyle={styles.smallButtonText}
                      onPress={() => exemptedVehicle(item)}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={btnGate}>
        <Image source={gateIcon} style={styles.fabIcon} />
        <Text style={styles.fabText}>Gate Open</Text>
      </Pressable>

      <BluetoothModal visible={bluetoothVisible} onClose={closeBluetoothModal} />
      <ExitModal visible={modalVisible} params={modalParams} onClosed={onModalClosed} />
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
    paddingBottom: 100,
  },
  location: {
    fontSize: fontSizes.body + 4,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.itemUnderline,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchInput: {
    color: colors.text,
    fontSize: fontSizes.body + 2,
    paddingVertical: 6,
  },
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: colors.white,
    padding: 10,
    marginBottom: 12,
    ...{
      shadowColor: 'rgba(0,0,0,0.14)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  avatar: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  cardBody: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: fontSizes.heading - 6,
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
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'flex-start',
  },
  exitCol: {
    width: '50%',
    marginRight: 5,
  },
  exemptCol: {
    flex: 1,
  },
  smallButton: {
    height: 32,
    paddingHorizontal: 8,
  },
  smallButtonText: {
    fontSize: fontSizes.small,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  fabIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginRight: 8,
    resizeMode: 'contain',
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSizes.body,
  },
});

export default ExitScreen;
