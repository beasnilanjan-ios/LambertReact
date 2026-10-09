import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
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
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import BluetoothModal from '../components/BluetoothModal';
import PrinterDialog from '../components/PrinterDialog';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { EntryResponseModel, OCRModelResponse } from '../models';
import { session } from '../services/sessionManager';
import EscPosEncoder from '../services/escPosEncoder';
import { commands } from '../services/printerCommands';
import { btnGateOpen } from '../services/gate';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { modalState } from '../support/modalState';
import { colors } from '../theme';

const printerIcon = require('../assets/icon/printer.png');
const gateIcon = require('../assets/icon/gate.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Entry'>;

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

const EntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const [tokenNo, setTokenNo] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [bluetoothVisible, setBluetoothVisible] = useState(false);
  const [printerVisible, setPrinterVisible] = useState(false);
  const [receipt, setReceipt] = useState<Uint8Array | undefined>();
  const entryResponseRef = useRef<EntryResponseModel | undefined>(undefined);

  const entryModel = useMemo(
    () => ({
      parking_id: route.params.parking_id,
      vehicle_type_id: route.params.vehicle_type_id,
      vehicle_number: vehicleNumber,
      mobile,
      vendor_userid: route.params.vendor_userid,
      entry_time: formatNow(),
      token_no: tokenNo,
    }),
    [route.params, vehicleNumber, mobile, tokenNo],
  );

  const openBluetoothModal = () => {
    modalState.active = 'BluetoothModal';
    setBluetoothVisible(true);
  };

  const closeBluetoothModal = () => {
    modalState.active = undefined;
    setBluetoothVisible(false);
  };

  const validate = (): boolean => {
    if (vehicleNumber.length > 0) {
      if (mobile.length > 0) {
        if (mobile.length === 10) {
          return true;
        }
        showAlert('Parking', 'Mobile number must be 10 digits');
      } else {
        return true;
      }
    } else {
      showAlert('Parking', 'Enter vehicle number');
    }
    return false;
  };

  const done = async () => {
    presentLoading();
    if (!validate()) {
      dismissLoading();
      return;
    }
    try {
      console.log('entry---->' + JSON.stringify(entryModel));
      const response: EntryResponseModel = await session.getResponseParkingEntry(
        ApiConstant.MainApi + ApiConstant.ParkingEntryApi,
        entryModel,
      );
      entryResponseRef.current = response;
      console.log('entry response---->' + JSON.stringify(response));
      if ((response.status ?? '').toLowerCase() === 'success') {
        showAlert('Parking Entry', 'Entry Successful', () => {
          /* Clear all previous input data for new entry — stack not popped so the
             attendant can print the receipt and open the gate. */
          setTokenNo('');
          setVehicleNumber('');
          setMobile('');
        });
      } else if ((response.status ?? '').toLowerCase() === 'fail') {
        showAlert('Oops', 'Vehicle is already inside');
      } else if ((response.status ?? '').toLowerCase() === 'invalidtoken') {
        setTokenNo('');
        showAlert('Oops', response.msg);
      } else {
        showAlert('Oops', 'Some error occured. Please try after some times');
      }
    } catch (error) {
      console.log(error);
      showAlert('Oops', 'Some error occured. Please try after some times');
    }
    dismissLoading();
  };

  const handleCameraError = (err: any) => {
    const message = String(err?.message ?? err);
    const code = String(err?.code ?? '');
    if (message.toLowerCase().includes('cancel') || code === 'E_CAMERA_CANCELLED') {
      return;
    }
    if (
      message.toLowerCase().includes('permission') ||
      code === 'E_PERMISSION' ||
      code === '20'
    ) {
      showAlert(
        'Camera Permission Required',
        'Please allow Camera access for Lambert Parking in Settings > Apps > Lambert Parking > Permissions, then try Auto Scan again.',
      );
      return;
    }
    showAlert(
      'Camera Error',
      'Unable to open the camera. Please check permissions and try again.',
    );
  };

  const sendImageToServer = async (b64: string) => {
    try {
      const data: OCRModelResponse = await session.scanCarImage(ApiConstant.OCRApi, b64);
      console.log('RESPONSE--->' + JSON.stringify(data));

      const status = (data.status || '').toLowerCase();
      const numberPlate = (data.numberPlate || '').trim();
      const mobileNo = (data.mobileNo || '').trim();

      if (status === 'success' && numberPlate.length > 0) {
        setVehicleNumber(numberPlate);
        if (mobileNo.length > 0) {
          setMobile(mobileNo);
        }
        let message = 'Vehicle no.: ' + numberPlate;
        if (mobileNo.length > 0) {
          message += '\nMobile no.: ' + mobileNo;
        }
        showAlert('Auto Scan', message);
      } else if (data.error) {
        showAlert('Sorry', data.error);
      } else {
        showAlert('Auto Scan', 'Unable to read the number plate. Please try again.');
      }
      dismissLoading();
    } catch (err: any) {
      console.log('OCR Error--->' + JSON.stringify(err));
      dismissLoading();
      if (err && err.status === 0) {
        showAlert(
          'OCR Failed',
          'Unable to reach the OCR service. Check that your phone and server (192.168.1.144:8082) are on the same network.',
        );
      } else {
        showAlert('OCR Failed', 'Some error occurred. Please try again later.');
      }
    }
  };

  const ocrScan = () => {
    presentLoading();
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.9,
        saveToPhotos: false,
        cameraType: 'back',
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('Camera error:::: user cancelled');
          dismissLoading();
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.base64) {
          console.log('Camera error::::' + JSON.stringify(response.errorMessage));
          dismissLoading();
          handleCameraError(response.errorMessage ?? 'No Image Selected');
          return;
        }
        console.log('IMAGE DATA captured for OCR');
        sendImageToServer(asset.base64);
      },
    );
  };

  const buildEntryReceipt = (): Uint8Array | undefined => {
    const response = entryResponseRef.current;
    if (!response) {
      return undefined;
    }
    if ((response.tokenNo ?? '').length === 0) {
      response.tokenNo = 'NA';
    }
    try {
      if ((response.status ?? '').toLowerCase() !== 'success') {
        showErrorDirect('First enter a vehicle');
        return undefined;
      }
      const encoder = new EscPosEncoder();
      const result = encoder.initialize();
      result
        .codepage('cp936')
        .align('center')
        .bold(true)
        .line(response.agencyName ?? '')
        .line('==== ENTRY ====')
        .raw(commands.TEXT_FORMAT.TXT_NORMAL)
        .line(commands.HORIZONTAL_LINE.HR2_58MM)
        .align('left')
        .bold(true)
        .line('# Parking Location')
        .bold(false)
        .line(response.parkingLocation ?? '')
        .bold(true)
        .line('# Vehicle Number')
        .bold(false)
        .line(response.vehicleNo ?? '')
        .bold(true)
        .line('# Vehicle Type')
        .bold(false)
        .line(response.vehicleType ?? '')
        .bold(true)
        .line('# Entry Time')
        .bold(false)
        .line(response.entryTime ?? '')
        .bold(true)
        .line('# Booking Type')
        .bold(false)
        .line(response.bookingStatus ?? '')
        .bold(true)
        .line('# Token No.')
        .bold(false)
        .line(response.tokenNo ?? '')
        .newline()
        .align('center')
        .bold(true)
        .line('== THANK YOU ==')
        .newline()
        .newline();
      return result.encode();
    } catch (err) {
      showErrorDirect('Please try again');
      console.log('Catch error: ' + JSON.stringify(err));
      return undefined;
    }
  };

  const showErrorDirect = (error: string) => {
    showAlert('Error', error);
  };

  const btnPrint = () => {
    console.log('PRINT----------------->');
    const bytes = buildEntryReceipt();
    if (bytes) {
      setReceipt(bytes);
      modalState.active = 'BluetoothModal';
      setPrinterVisible(true);
    }
  };

  const closePrinter = () => {
    modalState.active = undefined;
    setPrinterVisible(false);
  };

  const btnGate = () => {
    btnGateOpen(openBluetoothModal);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formControl}>
            <TextInput
              style={styles.input}
              placeholder="Enter Token Number"
              placeholderTextColor={colors.label}
              value={tokenNo}
              onChangeText={text => setTokenNo(text.replace(/\s/g, ''))}
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.formControl}>
            <TextInput
              style={styles.input}
              placeholder="Enter Vehicle Number"
              placeholderTextColor={colors.label}
              value={vehicleNumber}
              onChangeText={text => setVehicleNumber(text.replace(/\s/g, ''))}
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.orWrap}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Or</Text>
          </View>

          <PillButton label="Auto Scan" color={colors.ktm} onPress={ocrScan} />

          <View style={[styles.formControl, styles.mobileControl]}>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor={colors.label}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionCol}>
              <PillButton label="Cancel" color={colors.danger} onPress={() => navigation.goBack()} />
            </View>
            <View style={styles.actionCol}>
              <PillButton label="Done" color={colors.yamaha} onPress={done} />
            </View>
          </View>

          <View style={styles.iconRow}>
            <View style={styles.iconCol}>
              <Pressable style={styles.printWrap} onPress={btnPrint}>
                <Image source={printerIcon} style={styles.printIcon} />
              </Pressable>
            </View>
            <View style={styles.iconCol}>
              <Pressable style={styles.printWrap} onPress={btnGate}>
                <Image source={gateIcon} style={styles.printIcon} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BluetoothModal visible={bluetoothVisible} onClose={closeBluetoothModal} />
      <PrinterDialog visible={printerVisible} receipt={receipt} onClosed={closePrinter} />
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  formControl: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: 'transparent',
    borderRadius: 64,
    marginVertical: 20,
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  mobileControl: {
    marginTop: 30,
  },
  input: {
    color: colors.text,
    paddingHorizontal: 11,
    width: '100%',
  },
  orWrap: {
    width: '70%',
    marginHorizontal: 'auto',
    marginVertical: 50,
    position: 'relative',
    alignItems: 'center',
  },
  orLine: {
    borderTopWidth: 1,
    borderTopColor: colors.label,
    width: '100%',
  },
  orText: {
    position: 'absolute',
    backgroundColor: colors.white,
    top: -9,
    width: '20%',
    textAlign: 'center',
    zIndex: 999,
    left: '40%',
    color: 'black',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: -6,
  },
  actionCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 30,
  },
  iconCol: {
    flex: 1,
    alignItems: 'center',
  },
  printWrap: {
    textAlign: 'center',
    marginTop: 10,
    width: '50%',
    alignItems: 'center',
  },
  printIcon: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
});

export default EntryScreen;
