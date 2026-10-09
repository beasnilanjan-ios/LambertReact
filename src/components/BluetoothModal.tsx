import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeKeys } from '../constants/storage';
import { bluetoothSerial } from '../services/bluetoothSerial';
import { nativeSet } from '../services/storage';
import { showError, showToast } from '../support/feedback';
import { colors, fontSizes } from '../theme';
import { TOOLBAR_HEIGHT } from './AppHeader';

export interface BluetoothModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PairedDevice {
  address: string;
  name?: string;
}

/** Port of `bluetooth-modal` page. */
const BluetoothModal: React.FC<BluetoothModalProps> = ({ visible, onClose }) => {
  const [pairedList, setPairedList] = useState<PairedDevice[]>([]);
  const [listToggle, setListToggle] = useState(false);
  const [pairedDeviceID, setPairedDeviceID] = useState(0);
  const [nativeSetBool, setNativeSetBool] = useState(false);

  const listPairedDevices = async () => {
    try {
      const devices = await bluetoothSerial.list();
      setPairedList(devices);
      setListToggle(true);
    } catch {
      showError('Please Enable Bluetooth');
      setListToggle(false);
    }
  };

  const checkBluetoothEnabled = async () => {
    try {
      await bluetoothSerial.isEnabled();
      await listPairedDevices();
    } catch {
      showError('Please Enable Bluetooth');
    }
  };

  useEffect(() => {
    if (visible) {
      setNativeSetBool(false);
      checkBluetoothEnabled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const connect = async (address: string) => {
    try {
      await bluetoothSerial.connect(address);
      deviceConnected();
      showToast('Successfully Connected');
      await nativeSet(NativeKeys.DeviceConnected, 'true');
      console.log('login stored!!!');
      setNativeSetBool(true);
    } catch {
      showError('Error:Connecting to Device');
      await nativeSet(NativeKeys.DeviceConnected, 'false');
      console.log('login stored!!!');
      setNativeSetBool(false);
    }
  };

  const deviceConnected = () => {
    showToast('Connected Successfullly');
  };

  const selectDevice = async () => {
    const connectedDevice = pairedList[pairedDeviceID];
    if (!connectedDevice?.address) {
      showError('Select Paired Device to connect');
      return;
    }
    await connect(connectedDevice.address);
  };

  const back = async () => {
    if (nativeSetBool === false) {
      try {
        await nativeSet(NativeKeys.DeviceConnected, 'notSet');
        console.log('login stored!!!');
      } catch (e) {
        console.error('Error storing item', e);
      }
    }
    onClose();
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Bluetooth Modal</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable style={styles.submitButton} onPress={listPairedDevices}>
            <Text style={styles.buttonText}>⟳ Refresh Bluetooth Devices</Text>
          </Pressable>

          {listToggle
            ? pairedList.map((device, index) => (
                <Pressable
                  key={device.address}
                  style={styles.deviceRow}
                  onPress={() => setPairedDeviceID(index)}>
                  <View
                    style={[styles.radio, pairedDeviceID === index ? styles.radioOn : undefined]}
                  />
                  <Text style={styles.deviceName}>{device.name}</Text>
                </Pressable>
              ))
            : null}

          {listToggle ? (
            <Pressable style={styles.submitButton} onPress={selectDevice}>
              <Text style={styles.buttonText}>⟳ Connect Bluetooth Devices</Text>
            </Pressable>
          ) : null}

          <Pressable style={[styles.submitButton, styles.backButton]} onPress={back}>
            <Text style={styles.buttonText}>▶ Back</Text>
          </Pressable>
        </ScrollView>
      </View>
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
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: colors.btnDark,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 14,
  },
  radioOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  deviceName: {
    fontSize: fontSizes.body,
    color: 'black',
    flexShrink: 1,
  },
});

export default BluetoothModal;
