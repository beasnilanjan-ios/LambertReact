import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { printer } from '../services/printer';
import { showToast, showAlert } from '../support/feedback';
import { colors, fontSizes } from '../theme';

export interface PrinterDialogProps {
  visible: boolean;
  receipt?: Uint8Array;
  onClosed: (printed: boolean) => void;
}

interface Device {
  address: string;
  name?: string;
}

/** Port of `mountAlertBt` / `printData` from EntryPage & ExitModalPage. */
const PrinterDialog: React.FC<PrinterDialogProps> = ({ visible, receipt, onClosed }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [printing, setPrinting] = useState(false);

  const mountAlertBt = async () => {
    try {
      await printer.enableBluetooth();
      try {
        const list = await printer.searchBluetooth();
        list.forEach(device => console.log('Devices: ', JSON.stringify(device)));
        setDevices(list);
      } catch (error) {
        console.log(error);
        showToast('There was an error connecting the printer, please try again!');
        mountAlertBt();
      }
    } catch (error) {
      console.log(error);
      showToast('Error activating bluetooth, please try again!');
      mountAlertBt();
    }
  };

  useEffect(() => {
    if (visible) {
      setSelected(undefined);
      setDevices([]);
      mountAlertBt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cancel = () => {
    setDevices([]);
    onClosed(false);
  };

  const selectPrinter = async () => {
    if (!selected) {
      showToast('Select a printer!');
      return;
    }
    console.log(selected);
    await printData(selected, receipt);
  };

  const printData = async (device: string, data?: Uint8Array) => {
    console.log('Device mac: ', device);
    setPrinting(true);
    try {
      await printer.connectBluetooth(device);
      console.log('connected');
      try {
        const printStatus = await printer.printData(data);
        console.log(printStatus);
        setPrinting(false);
        showAlert('Successful print!', undefined, () => {
          printer.disconnectBluetooth();
          onClosed(true);
        });
      } catch (error) {
        console.log(error);
        setPrinting(false);
        showAlert('There was an error printing, please try again!');
      }
    } catch (error) {
      console.log(error);
      setPrinting(false);
      showAlert('There was an error connecting to the printer, please try again!');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Select your printer</Text>
          {devices.map(device => (
            <Pressable
              key={device.address}
              style={styles.deviceRow}
              onPress={() => setSelected(device.address)}>
              <View style={[styles.radio, selected === device.address ? styles.radioOn : undefined]} />
              <Text style={styles.deviceName}>{device.name ?? device.address}</Text>
            </Pressable>
          ))}
          <View style={styles.buttonRow}>
            <Pressable style={styles.dialogButton} onPress={cancel}>
              <Text style={styles.dialogButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.dialogButton} onPress={selectPrinter}>
              <Text style={styles.dialogButtonText}>Select printer</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {printing ? (
        <Modal transparent visible animationType="fade">
          <View style={styles.loadingBackdrop}>
            <ActivityIndicator size="large" color={colors.loadingText} />
            <Text style={styles.loadingText}>Printing...</Text>
          </View>
        </Modal>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    backgroundColor: colors.alertBackground,
    borderRadius: 2,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.87)',
    marginBottom: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
    color: 'rgba(0,0,0,0.87)',
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  dialogButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 8,
  },
  dialogButtonText: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: fontSizes.body,
  },
  loadingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.loadingText,
    fontSize: fontSizes.body,
  },
});

export default PrinterDialog;
