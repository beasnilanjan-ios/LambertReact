/**
 * Lambert Parking — React Native port of the Ionic 3 app.
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { FeedbackProvider, showConfirm } from './src/support/feedback';
import { MenuContext } from './src/support/menuContext';
import { events } from './src/support/events';
import { fetchAppData } from './src/support/appData';
import { NativeKeys } from './src/constants/storage';
import { localClear, nativeSet } from './src/services/storage';
import { MenuKind, MenuPage, RootStackParamList } from './src/navigation/types';
import { resolveRootRoute } from './src/navigation/rootDecision';
import RootNavigator, {
  getCurrentRouteName,
  isReady,
  resetTo,
} from './src/navigation/RootNavigator';
import DrawerMenu from './src/components/DrawerMenu';
import { openInAppBrowser } from './src/support/inAppBrowser';
import { modalState } from './src/support/modalState';
import { appData } from './src/support/appData';

const EXIT_CONFIRM_ROUTES = ['Landing', 'Map', 'ParkingZone'];
const BACK_TO_LANDING = ['AttendantLogin', 'CitizenLogin'];
const BACK_TO_CITIZEN_LOGIN = ['CustomerRegistration', 'ForgotPassword'];
const BACK_TO_ATTENDANT_LOGIN = ['AttandantForgotPassword'];
const BACK_TO_MAP = [
  'ChangePassword',
  'CustomerDeregistration',
  'Coupons',
  'Support',
  'Logout',
  'CitizenParkingHistory',
  'BookingHistory',
];
const BACK_DEFAULT_POP = ['Entry', 'Exit'];

function App(): React.JSX.Element {
  const [rootRoute, setRootRoute] = useState<keyof RootStackParamList | null>(null);
  const [menuKind, setMenuKind] = useState<MenuKind>('none');
  const [menuOpen, setMenuOpen] = useState(false);
  const alertShown = useRef(false);

  useEffect(() => {
    fetchAppData();

    events.subscribe('attendant:loggedin', () => setMenuKind('none'));
    events.subscribe('citizen:loggedin', () => setMenuKind('citizen'));
    events.subscribe('guest:visited', () => setMenuKind('guest'));

    // App terminated → writes DeviceConnected = "false"
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        console.log('App terminated-------->');
        nativeSet(NativeKeys.DeviceConnected, 'false')
          .then(() => console.log('login stored!!!'))
          .catch(error => console.error('Error storing item', error));
      }
    });

    resolveRootRoute()
      .then(decision => {
        console.log('root route:', decision.route, 'menu:', decision.menu);
        setMenuKind(decision.menu);
        setRootRoute(decision.route);
        BootSplash.hide({ fade: true });
      })
      .catch(error => {
        console.error('Root decision failed', error);
        setRootRoute('Landing');
        BootSplash.hide({ fade: true });
      });

    return () => appStateSub.remove();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isReady()) {
        return true;
      }
      const route = getCurrentRouteName() ?? 'Landing';

      if (alertShown.current) {
        return true;
      }

      // ViewPlanModal open → setRoot(ParkingZone) (dismisses modal + resets attendant stack)
      if (modalState.active === 'ViewPlanModal') {
        resetTo('ParkingZone');
        return true;
      }

      if (EXIT_CONFIRM_ROUTES.includes(route)) {
        alertShown.current = true;
        showConfirm(
          'Confirm Exit',
          'Do you want Exit?',
          'Cancel',
          'Yes',
          async () => {
            if (route === 'ParkingZone') {
              await localClear();
            }
            BackHandler.exitApp();
          },
          () => {
            alertShown.current = false;
          },
        );
        return true;
      }

      if (BACK_TO_LANDING.includes(route)) {
        resetTo('Landing');
        return true;
      }
      if (BACK_TO_CITIZEN_LOGIN.includes(route)) {
        resetTo('CitizenLogin');
        return true;
      }
      if (BACK_TO_ATTENDANT_LOGIN.includes(route)) {
        resetTo('AttendantLogin');
        return true;
      }
      if (BACK_TO_MAP.includes(route)) {
        resetTo('Map');
        return true;
      }
      if (BACK_DEFAULT_POP.includes(route)) {
        return false;
      }
      return false;
    });

    return () => subscription.remove();
  }, []);

  const openMenu = () => {
    if (menuKind !== 'none') {
      setMenuOpen(true);
    }
  };

  const onSelectMenuPage = (page: MenuPage) => {
    console.log('Page::::::::' + JSON.stringify(page));
    setMenuOpen(false);
    if (page.title === 'Contact Us') {
      resetTo(page.route);
      openInAppBrowser(appData.contactDetails);
      return;
    }
    if (page.title === 'Terms & Conditions') {
      resetTo(page.route);
      openInAppBrowser(appData.termsDetail);
      return;
    }
    resetTo(page.route);
  };

  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <MenuContext.Provider value={{ openMenu }}>
          <StatusBar barStyle="dark-content" />
          {rootRoute ? (
            <>
              <RootNavigator initialRouteName={rootRoute} />
              <DrawerMenu
                visible={menuOpen}
                menuKind={menuKind}
                onClose={() => setMenuOpen(false)}
                onSelect={onSelectMenuPage}
              />
            </>
          ) : null}
        </MenuContext.Provider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}

export default App;
