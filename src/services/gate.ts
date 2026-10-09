import { NativeKeys } from '../constants/storage';
import { nativeGet, nativeSet } from './storage';
import { bluetoothSerial } from './bluetoothSerial';
import { showAlert, showConfirm, showError, showToast } from '../support/feedback';

export type OpenBluetoothModal = () => void;

/**
 * Shared port of `btnGateOpen()` / `checkBluetoothEnabled()` used identically
 * by EntryPage and ExitPage (boom gate via Bluetooth Serial 'E' command).
 */
export const btnGateOpen = async (openBluetoothModal: OpenBluetoothModal): Promise<void> => {
  try {
    const data = await nativeGet<string>(NativeKeys.EnableBoomGate);
    console.log('My value enable boom gate:::::' + data);
    if (data === 'YES') {
      await checkBluetoothEnabled(openBluetoothModal);
    } else if (data === 'NO') {
      console.log('btnGateOpen--- enableBoomGate NO--->');
    } else {
      // Ionic shows an alert with Yes/No, each with its own handler.
      showBoomGateActivation(openBluetoothModal);
    }
  } catch (error) {
    console.error('enable boom gate Error**** ' + error);
  }
};

const showBoomGateActivation = (openBluetoothModal: OpenBluetoothModal): void => {
  showConfirm(
    'Activated Boom Gate?',
    undefined,
    'No',
    'Yes',
    async () => {
      try {
        await nativeSet(NativeKeys.EnableBoomGate, 'YES');
      } catch (error) {
        console.error('Error storing item', error);
      }
      await checkBluetoothEnabled(openBluetoothModal);
    },
    async () => {
      try {
        await nativeSet(NativeKeys.EnableBoomGate, 'NO');
        console.error('stored enable boom gate!!!');
      } catch (error) {
        console.error('Error storing item', error);
      }
    },
  );
};

export const checkBluetoothEnabled = async (
  openBluetoothModal: OpenBluetoothModal,
): Promise<void> => {
  try {
    await bluetoothSerial.isEnabled();
  } catch {
    showAlert('Please Enable Bluetooth and connect', undefined, openBluetoothModal);
    return;
  }

  try {
    const data = await nativeGet<string>(NativeKeys.DeviceConnected);
    console.log('My value:::::' + data);
    if (data === 'true') {
      showToast('OPEN');
      try {
        const success = await bluetoothSerial.write('E');
        showToast(String(success));
        // Forced disconnect written back immediately (original behavior kept).
        await nativeSet(NativeKeys.DeviceConnected, 'false');
        console.log('login stored!!!');
        await bluetoothSerial.disconnect();
      } catch (error) {
        showError(String(error));
      }
    } else {
      showAlert('Bluetooth not connected', undefined, openBluetoothModal);
    }
  } catch (error) {
    console.error('Attendant Error**** ' + error);
  }
};
