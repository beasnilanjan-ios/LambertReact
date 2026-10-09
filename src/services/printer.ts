import { bluetoothSerial } from './bluetoothSerial';

/** Port of `providers/printer/printer.ts` (PrinterProvider). */
export const printer = {
  enableBluetooth(): Promise<any> {
    return bluetoothSerial.enable();
  },

  searchBluetooth(): Promise<{ address: string; name?: string }[]> {
    return bluetoothSerial.list();
  },

  connectBluetooth(address: string): Promise<any> {
    return bluetoothSerial.connect(address);
  },

  printData(data: any): Promise<any> {
    return bluetoothSerial.write(data);
  },

  disconnectBluetooth(): Promise<any> {
    return bluetoothSerial.disconnect();
  },
};
