import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiConstant } from '../constants/api';
import { ExitResponseModel } from '../models';
import { session } from '../services/sessionManager';
import EscPosEncoder from '../services/escPosEncoder';
import { commands } from '../services/printerCommands';
import PrinterDialog from './PrinterDialog';
import { dismissLoading, presentLoading, showAlert, showAlertWithButtons } from '../support/feedback';
import { modalState } from '../support/modalState';
import { colors, fontSizes } from '../theme';
import { TOOLBAR_HEIGHT } from './AppHeader';

export interface ExitModalParams {
  baseFare?: string;
  gstAmount?: string;
  gstPercentage?: string;
  token_no?: string;
  fare?: string;
  totalTime?: string;
  vehicleType?: string;
  allotmentId?: string;
  time?: string;
}

export interface ExitModalProps {
  visible: boolean;
  params?: ExitModalParams;
  onClosed: (refresh: boolean) => void;
}

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

/** Port of `exit-modal` page (Parking Charges). */
const ExitModal: React.FC<ExitModalProps> = ({ visible, params, onClosed }) => {
  const [couponCode, setCouponCode] = useState('');
  const [fare, setFare] = useState('');
  const [printerVisible, setPrinterVisible] = useState(false);
  const [receipt, setReceipt] = useState<Uint8Array | undefined>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setCouponCode('');
      setFare(params?.fare ?? '');
      console.log('got value---->' + JSON.stringify(params?.token_no));
    }
  }, [visible, params]);

  const cancel = () => onClosed(false);

  const doExit = async (withPrint: boolean) => {
    try {
      const url = ApiConstant.MainApi + ApiConstant.ExitVehicle;
      presentLoading();
      const time = formatNow();
      const data = {
        allotmentId: params?.allotmentId,
        fare,
        coupon: '',
        exempted: '',
        time,
      };
      console.log('DATA TO SEND--->' + JSON.stringify(data));
      try {
        const response: ExitResponseModel = await session.getExitVehicle(url, data);
        dismissLoading();
        console.log(`response:${JSON.stringify(response)}`);
        if (response.status === 'success') {
          showAlert('Parking Exit', response.msg, () => {
            if (withPrint) {
              const bytes = buildExitReceipt(response);
              if (bytes) {
                setReceipt(bytes);
                modalState.active = 'BluetoothModal';
                setPrinterVisible(true);
              } else {
                onClosed(true);
              }
            } else {
              onClosed(true);
            }
          });
        } else {
          showAlert('Parking', 'Some error occured. Please try after sometimes');
        }
      } catch (error) {
        dismissLoading();
        console.log(error);
        showAlert('Parking', 'Some error occured. Please try after sometimes');
      }
    } catch (error) {
      dismissLoading();
      console.log(error);
    }
  };

  const didSelect = () => {
    console.log('did select ----->');
    showAlertWithButtons('Parking', 'Exit the vehicle ?', [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Exit', onPress: () => doExit(false) },
      { text: 'Exit & Print', onPress: () => doExit(true) },
    ]);
  };

  const done = () => {
    if (fare.toString().length > 0) {
      if ((fare as any) <= (params?.fare as any)) {
        console.log('IF GOT FARE--->' + JSON.stringify(fare));
        didSelect();
      } else {
        showAlert(
          'Parking Exit',
          'Entered amount cannot be greater than total fare',
        );
      }
    } else {
      console.log('ELSE GOT FARE--->' + JSON.stringify(fare));
      showAlert('Parking Exit', 'Please enter amount');
    }
  };

  const buildExitReceipt = (response: ExitResponseModel): Uint8Array | undefined => {
    try {
      if ((response.tokenNo ?? '').length === 0) {
        response.tokenNo = 'NA';
      }
      if ((response.fare ?? '').length === 0) {
        response.fare = 'NA';
      }
      const encoder = new EscPosEncoder();
      const result = encoder.initialize();
      result
        .codepage('cp936')
        .align('center')
        .bold(true)
        .line(response.agencyName ?? '')
        .line('==== EXIT ====')
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
        .line('# Exit Time')
        .bold(false)
        .line(response.exit_time ?? '')
        .bold(true)
        .line('# Total Duration')
        .bold(false)
        .line(response.hourdiff ?? '')
        .bold(true)
        .line('# Total Fare')
        .bold(false)
        .line(response.fare ?? '')
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
      console.log('Catch error: ' + JSON.stringify(err));
      return undefined;
    }
  };

  const closePrinter = (printed: boolean) => {
    modalState.active = undefined;
    setPrinterVisible(false);
    if (printed) {
      onClosed(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cancel}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>
              <Text style={styles.underline}>Parking Charges</Text>
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.row}>
            <Text style={styles.bold}>Base Fare: ₹ </Text>
            {params?.baseFare}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>GST Percentage (%): </Text>
            {params?.gstPercentage}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>GST Amount (₹): </Text>
            {params?.gstAmount}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>Total Fare: ₹ </Text>
            {params?.fare}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>Vehicle Type: </Text>
            {params?.vehicleType}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>Total Time: </Text>
            {params?.totalTime}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.bold}>Token no.: </Text>
            {params?.token_no}
          </Text>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Coupon Code</Text>
            <TextInput
              style={styles.itemInput}
              value={couponCode}
              onChangeText={setCouponCode}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="transparent"
            />
          </View>
          <View style={styles.item}>
            <Text style={styles.itemLabel}>Amount</Text>
            <TextInput
              style={styles.itemInput}
              value={fare}
              onChangeText={setFare}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionCol}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={cancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </View>
            <View style={styles.actionCol}>
              <Pressable style={[styles.button, styles.confirmButton]} onPress={done}>
                <Text style={styles.buttonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
      <PrinterDialog visible={printerVisible} receipt={receipt} onClosed={closePrinter} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.toolbarBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.toolbarBorderMd,
  },
  headerBar: {
    height: TOOLBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.titleIos,
    fontWeight: '600',
    color: '#424242',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    fontSize: fontSizes.body + 2,
    color: 'black',
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  item: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dedede',
    minHeight: 56,
    justifyContent: 'center',
  },
  itemLabel: {
    color: colors.label,
    fontSize: 12,
    marginBottom: 2,
  },
  itemInput: {
    color: 'black',
    fontSize: 16,
    paddingVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 30,
    marginHorizontal: -6,
  },
  actionCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  button: {
    height: 40,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.danger,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.body,
  },
});

export default ExitModal;
