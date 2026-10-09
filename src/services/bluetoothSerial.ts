import BluetoothClassic from 'react-native-bluetooth-classic';

export interface BluetoothDeviceItem {
  address: string;
  name?: string;
}

let connectedAddress: string | undefined;

/**
 * Port of `@ionic-native/bluetooth-serial` (`BluetoothSerial`) on top of
 * react-native-bluetooth-classic. Keeps the same call shapes used by the
 * Ionic pages (enable / isEnabled / list / connect / write / disconnect).
 */
export const bluetoothSerial = {
  isEnabled(): Promise<boolean> {
    return BluetoothClassic.isBluetoothEnabled().then(enabled => {
      if (!enabled) {
        throw new Error('Bluetooth is not enabled');
      }
      return true;
    });
  },

  enable(): Promise<boolean> {
    return BluetoothClassic.requestBluetoothEnabled();
  },

  async list(): Promise<BluetoothDeviceItem[]> {
    const devices = await BluetoothClassic.getBondedDevices();
    return devices.map(device => ({ address: device.address, name: device.name }));
  },

  async connect(address: string): Promise<any> {
    const device = await BluetoothClassic.connectToDevice(address);
    connectedAddress = address;
    return device;
  },

  async write(data: string | number[] | Uint8Array): Promise<string> {
    if (!connectedAddress) {
      const connected = await BluetoothClassic.getConnectedDevices();
      if (!connected.length) {
        throw new Error('No device connected');
      }
      connectedAddress = connected[0].address;
    }
    if (typeof data === 'string') {
      await BluetoothClassic.writeToDevice(connectedAddress, data, 'utf-8');
      return data;
    }
    const bytes = data instanceof Uint8Array ? data : Uint8Array.from(data);
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    await BluetoothClassic.writeToDevice(connectedAddress, binary, 'latin1');
    return 'Ok';
  },

  async disconnect(): Promise<boolean> {
    if (!connectedAddress) {
      return true;
    }
    const result = await BluetoothClassic.disconnectFromDevice(connectedAddress);
    connectedAddress = undefined;
    return result;
  },

  getConnectedAddress(): string | undefined {
    return connectedAddress;
  },
};
