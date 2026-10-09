import { LocalKeys, NativeKeys } from '../constants/storage';
import { localGet, localSet, nativeGet } from '../services/storage';
import { MenuKind } from './types';

export interface RootDecision {
  route: 'Landing' | 'ParkingZone' | 'Map';
  menu: MenuKind;
}

/**
 * Port of Ionic app.component.ts root selection (MIGRATION_ANALYSIS §2.1).
 */
export const resolveRootRoute = async (): Promise<RootDecision> => {
  const attandantRememberme = await localGet(LocalKeys.attandantRememberme);
  const rememberMe = await localGet(LocalKeys.rememberme);

  if (attandantRememberme === 'true') {
    await localSet(LocalKeys.rememberme, 'false');
    try {
      const data = await nativeGet<string>(NativeKeys.NSUDIsLoggedIn);
      console.log('My value:::::' + data);
      if (data === '') {
        return { route: 'Landing', menu: 'none' };
      }
      if (data === 'true') {
        return { route: 'ParkingZone', menu: 'none' };
      }
      return { route: 'Landing', menu: 'none' };
    } catch (error) {
      console.error('Attendant Error**** ' + error);
      return { route: 'Landing', menu: 'none' };
    }
  }

  if (rememberMe === 'true') {
    await localSet(LocalKeys.attandantRememberme, 'false');
    try {
      const data = await nativeGet<string>(NativeKeys.CitizenIsLoggedIn);
      console.log('My Citizen value:::::' + data);
      if (data === '') {
        return { route: 'Landing', menu: 'none' };
      }
      if (data === 'true') {
        return { route: 'Map', menu: 'citizen' };
      }
      return { route: 'Landing', menu: 'none' };
    } catch (error) {
      console.error('Citizen Error**** ' + error);
      return { route: 'Landing', menu: 'none' };
    }
  }

  return { route: 'Landing', menu: 'none' };
};
