import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { SelectPill } from '../components/SelectPill';
import ViewPlanModal from '../components/ViewPlanModal';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant } from '../constants/api';
import { LocalKeys, NativeKeys } from '../constants/storage';
import {
  LoginResponseModel,
  ParkingArrayModel,
  ParkingZoneResponseModel,
  ValidateUserResponseModel,
  VehicleListModel,
  VehicleTypeArray,
  ViewPlanModel,
  ViewPlansArray,
} from '../models';
import { localSet, nativeClear, nativeGet } from '../services/storage';
import { session } from '../services/sessionManager';
import { dismissLoading, presentLoading, showAlert, showConfirm } from '../support/feedback';
import { modalState } from '../support/modalState';
import { colors, fontSizes } from '../theme';

const arrow1 = require('../assets/imgs/arrow1.png');
const arrow2 = require('../assets/imgs/arrow2.png');
const check1 = require('../assets/imgs/check1.png');
const check2 = require('../assets/imgs/check2.png');

type Props = NativeStackScreenProps<RootStackParamList, 'ParkingZone'>;

const ParkingZoneScreen: React.FC<Props> = ({ navigation, route }) => {
  const [defaultData, setDefaultData] = useState<LoginResponseModel | undefined>();
  const [response, setResponse] = useState<ParkingZoneResponseModel | undefined>();
  const [response2, setResponse2] = useState<VehicleListModel | undefined>();
  const [_viewPlanResponse, setViewPlanResponse] = useState<ViewPlanModel | undefined>();
  const [buttonClicked, setButtonClicked] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>();
  const [preselect2, setPreselect2] = useState<string | undefined>();
  const [parkingId, setParkingId] = useState<string | undefined>();
  const [vehicleTypeIdString, setVehicleTypeIdString] = useState<string | undefined>();
  const [valueToDisplay, setValueToDisplay] = useState<ParkingArrayModel | undefined>();
  const [valueToDisplay2, setValueToDisplay2] = useState<VehicleTypeArray | undefined>();
  const [viewPlanVisible, setViewPlanVisible] = useState(false);
  const [viewPlanArray, setViewPlanArray] = useState<ViewPlansArray[] | undefined>();
  const [viewPlanVehicleType, setViewPlanVehicleType] = useState<string | undefined>();
  const [viewPlanDisclaimer, setViewPlanDisclaimer] = useState<string | undefined>();

  const getVendorUserId = (): string => {
    if (!defaultData) {
      return '';
    }
    // users_parking expects attendant user id (e.g. 24), not vendor_id (e.g. 23).
    return defaultData.vender_user_id || defaultData.vendor_user_id || '';
  };

  const getVehicleTypeList = useCallback(async (lotId: string) => {
    presentLoading();
    const url = ApiConstant.MainApi + ApiConstant.GetParkingDetails + lotId;
    console.log('Vehicle type API -> ' + url);
    try {
      const value: VehicleListModel = await session.getResponseVehicleType(url);
      setResponse2(value);
      console.log('VEHICLE LIST json response---> ' + JSON.stringify(value));
      const vehicleTypes = value && Array.isArray(value.parkings) ? value.parkings : [];
      if (value && value.status === 'success' && vehicleTypes.length > 0) {
        const first = vehicleTypes[0];
        setValueToDisplay2(first);
        console.log('VEHICLE GOT value onchange--->' + JSON.stringify(first));
        setButtonClicked(true);
        setPreselect2(first.vehicle_type);
        setParkingId(first.parking_id);
        setVehicleTypeIdString(first.vehicle_type_id);
      } else {
        setButtonClicked(false);
        setValueToDisplay2(undefined);
        setPreselect2(undefined);
        setVehicleTypeIdString(undefined);
        showAlert(
          'Vehicle types unavailable',
          'No vehicle types were returned for this parking lot.',
        );
      }
      dismissLoading();
    } catch (error) {
      setButtonClicked(false);
      dismissLoading();
      console.error('Vehicle type request failed', error);
      showAlert(
        'Vehicle types unavailable',
        'Unable to load vehicle types for this parking lot.',
      );
    }
  }, []);

  const onChange = useCallback(
    (parkingLot: ParkingArrayModel) => {
      setValueToDisplay(parkingLot);
      setPreselect(parkingLot.position);
      console.log('GOT value onchange--->' + JSON.stringify(parkingLot.position));
      setParkingId(parkingLot.parking_id);
      getVehicleTypeList(parkingLot.parking_id ?? '');
    },
    [getVehicleTypeList],
  );

  const getParkingZoneList = useCallback(async () => {
    const vendorUserId = getVendorUserId();
    const url = ApiConstant.MainApi + ApiConstant.UserParking + vendorUserId;

    if (!vendorUserId) {
      showAlert(
        'Parking Lot Unavailable',
        'Attendant login details are missing. Please logout and login again.',
      );
      return;
    }

    console.log('Parking lot API -> ' + url);

    try {
      const value: ParkingZoneResponseModel = await session.getResponseParkingZones(url);
      console.log('json response---> ' + JSON.stringify(value));
      const parkingLots = value && Array.isArray(value.parking) ? value.parking : [];

      if (value.status === 'success' && parkingLots.length > 0) {
        if (preselect !== undefined) {
          const match = parkingLots.find(element => element.position === preselect);
          if (match) {
            onChange(match);
          }
        } else {
          setPreselect(parkingLots[0].position);
          onChange(parkingLots[0]);
        }
      } else if (value.status === 'success') {
        setPreselect(undefined);
        setPreselect2(undefined);
        setButtonClicked(false);
        showAlert(
          'Parking Lot Unavailable',
          'No parking lot is assigned to this attendant account. Please contact admin.',
        );
      } else {
        showAlert('Oops', 'Some error occured. Please try after some times');
      }
      setResponse(value);
    } catch (error) {
      console.error('Parking lot request failed', error);
      showAlert(
        'Parking Lot Unavailable',
        'Unable to load parking lots. Check server connection and try Refresh.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, preselect]);

  const applyLoginDetail = useCallback(
    (loginDetail: LoginResponseModel) => {
      const data = { ...loginDetail };
      if (!data.vender_user_id && data.vendor_user_id) {
        data.vender_user_id = data.vendor_user_id;
      }
      setDefaultData(data);
      setPreselect(undefined);
      getParkingZoneList();
    },
    [getParkingZoneList],
  );

  const getUserDefault = useCallback(async () => {
    console.log('ParkingZone focus — load login detail');
    const navLoginDetail = (route.params as any)?.loginDetail;
    if (navLoginDetail) {
      applyLoginDetail(navLoginDetail);
      return;
    }
    try {
      const NSUDdata = await nativeGet<LoginResponseModel>(NativeKeys.NSUDloginDetail);
      console.log('NSUSERDefault--->' + JSON.stringify(NSUDdata));
      applyLoginDetail(NSUDdata);
    } catch (error) {
      console.error('Storage getItem failed', error);
      showAlert(
        'Login Error',
        'Unable to read login details. Please logout and login again.',
      );
    }
  }, [applyLoginDetail, route.params]);

  useFocusEffect(
    useCallback(() => {
      getUserDefault();
      return () => {
        modalState.active = undefined;
      };
    }, [getUserDefault]),
  );

  const refreshData = () => {
    getParkingZoneList();
  };

  const yearChange = (val: string) => {
    console.log('Year Change:' + val);
    if (val !== '' && response?.parking) {
      const match = response.parking.find(element => element.position === val);
      if (match) {
        setValueToDisplay(match);
        setPreselect(match.position);
        setParkingId(match.parking_id);
        getVehicleTypeList(match.parking_id ?? '');
      }
    }
  };

  const yearChange2 = (val: string) => {
    console.log('VEHICLE Year Change:' + val);
    if (val !== '' && response2?.parkings) {
      const match = response2.parkings.find(el => el.vehicle_type === val);
      if (match) {
        setValueToDisplay2(match);
        setButtonClicked(true);
        setPreselect2(match.vehicle_type);
        setVehicleTypeIdString(match.vehicle_type_id);
      }
    }
  };

  const blockedAccountLogout = async () => {
    console.log('Logout clicked');
    await nativeClear();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  };

  const exitVehicle = async () => {
    try {
      presentLoading();
      const value: ValidateUserResponseModel = await session.getValidateLoggedInUser(
        ApiConstant.MainApi + ApiConstant.ValidateLoggedInUser + getVendorUserId(),
      );
      console.log('json response---> ' + JSON.stringify(value));
      if (value.status === 'success') {
        if (value.value === '1') {
          navigation.push('Exit', {
            parking_id: valueToDisplay2?.parking_id ?? '',
            startLocation: valueToDisplay?.start_position ?? '',
            endLocation: valueToDisplay?.end_position ?? '',
          });
        } else {
          showAlert(
            'Alert !!!',
            'Your account had been blocked due to some temporary technical difficulties. Please contact your admin',
            blockedAccountLogout,
          );
        }
      } else {
        showAlert('Oops', 'Some error occured. Please try after some times');
      }
    } catch (error) {
      console.log(error);
    }
    dismissLoading();
  };

  const entryVehicle = async () => {
    try {
      presentLoading();
      const value: ValidateUserResponseModel = await session.getValidateLoggedInUser(
        ApiConstant.MainApi + ApiConstant.ValidateLoggedInUser + getVendorUserId(),
      );
      console.log('json response---> ' + JSON.stringify(value));
      if (value.status === 'success') {
        if (value.value === '1') {
          navigation.push('Entry', {
            parking_id: valueToDisplay2?.parking_id ?? '',
            vehicle_type_id: valueToDisplay2?.vehicle_type_id ?? '',
            vendor_userid: getVendorUserId(),
          });
        } else {
          showAlert(
            'Alert !!!',
            'Your account had been blocked due to some temporary technical difficulties. Please contact your admin',
            blockedAccountLogout,
          );
        }
      } else {
        showAlert('Oops', 'Some error occured. Please try after some times');
      }
    } catch (error) {
      console.log(error);
    }
    dismissLoading();
  };

  const logout = () => {
    showConfirm('Confirm logout', 'Do you want logout?', 'Cancel', 'Logout', async () => {
      console.log('Logout clicked');
      await nativeClear();
      await localSet(LocalKeys.attandantRememberme, null);
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    });
  };

  const btnViewPlan = async () => {
    presentLoading();
    try {
      const url =
        ApiConstant.MainApi +
        ApiConstant.GetViewPlan +
        parkingId +
        '/' +
        vehicleTypeIdString;
      const value: ViewPlanModel = await session.getResponseViewPlan(url);
      setViewPlanResponse(value);
      console.log('VIEW PLAN json response---> ' + JSON.stringify(value));
      if (value.status === 'success') {
        setViewPlanArray(value.plans);
        setViewPlanVehicleType(preselect2);
        setViewPlanDisclaimer(value.disclaimer);
        modalState.active = 'ViewPlanModal';
        setViewPlanVisible(true);
      } else {
        showAlert('Oops', value.message);
      }
    } catch (error: any) {
      console.log(error?.status);
    }
    dismissLoading();
  };

  const closeViewPlan = () => {
    modalState.active = undefined;
    setViewPlanVisible(false);
  };

  const parkingOptions = response?.parking?.length
    ? response.parking.map(p => p.position ?? '')
    : [];
  const vehicleOptions = response2?.parkings?.length
    ? response2.parkings.map(p => p.vehicle_type ?? '')
    : [];

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showPower onPower={logout} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.welcomeItem}>
          {defaultData ? (
            <Text style={styles.welcomeText}>Welcome, {defaultData.name}</Text>
          ) : null}
        </View>

        <Text style={styles.fieldLabel}>Select Parking Lot</Text>
        <SelectPill
          options={parkingOptions}
          value={preselect}
          disabled={!response?.parking?.length}
          onSelect={yearChange}
        />
        {response && (!response.parking || response.parking.length === 0) ? (
          <Text style={styles.emptyMsg}>No parking lot assigned to this account.</Text>
        ) : null}

        <Text style={styles.fieldLabel}>Select Vehicle Type</Text>
        <SelectPill
          options={vehicleOptions}
          value={preselect2}
          disabled={!response2?.parkings?.length}
          onSelect={yearChange2}
        />
        {response2 && (!response2.parkings || response2.parkings.length === 0) ? (
          <Text style={styles.emptyMsg}>No vehicle type available for selected parking lot.</Text>
        ) : null}

        <View style={styles.viewPlanWrap}>
          <PillButton label="View Plan" color={colors.viewPlan} onPress={btnViewPlan} />
        </View>

        {buttonClicked ? (
          <>
            <Pressable style={styles.card} onPress={entryVehicle}>
              <View style={styles.cardBg}>
                <View style={styles.tableRow}>
                  <Text style={styles.cellLeft}>
                    Total Slot - <Text style={styles.bold}>{valueToDisplay2?.Total_slot}</Text>
                  </Text>
                  <Text style={styles.cellRight}>
                    Total Advance Slot -{' '}
                    <Text style={styles.bold}>{valueToDisplay2?.advance_slot}</Text>
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellLeft}>
                    Occupied Slot - <Text style={styles.bold}>{valueToDisplay2?.Occupied}</Text>
                  </Text>
                  <Text style={styles.cellRight}>
                    Occupied Advance Slot -{' '}
                    <Text style={styles.bold}>{valueToDisplay2?.occupied_advance_slot}</Text>
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Image source={arrow2} style={styles.arrow} />
                  <View style={styles.cellRightRow}>
                    <Text style={styles.entryLabel}>Entry</Text>
                    <Image source={check1} style={styles.check} />
                  </View>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.card} onPress={exitVehicle}>
              <View style={styles.cardBg}>
                <View style={[styles.tableRow, styles.exitRow]}>
                  <Image source={arrow1} style={styles.arrowSmall} />
                  <Text style={styles.exitVehicleLabel}>Exit Vehicle</Text>
                  <View style={styles.cellRightRow}>
                    <Text style={styles.entryLabel}>Exit</Text>
                    <Image source={check2} style={styles.check} />
                  </View>
                </View>
              </View>
            </Pressable>
          </>
        ) : null}

        <PillButton label="Refresh" color={colors.ktm} onPress={refreshData} style={styles.refreshBtn} />
      </ScrollView>

      <ViewPlanModal
        visible={viewPlanVisible}
        viewPlanArray={viewPlanArray}
        vehicleType={viewPlanVehicleType}
        disclaimer={viewPlanDisclaimer}
        onDone={closeViewPlan}
      />
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
    paddingBottom: 40,
  },
  welcomeItem: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  welcomeText: {
    fontWeight: 'bold',
    color: 'black',
    fontSize: fontSizes.body + 2,
    textAlign: 'center',
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 8,
    fontSize: fontSizes.body + 1,
  },
  emptyMsg: {
    color: colors.emptyText,
    fontSize: fontSizes.small,
    marginTop: 8,
  },
  viewPlanWrap: {
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.14)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  cardBg: {
    backgroundColor: colors.white,
    padding: 7,
    minHeight: 70,
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
  },
  cellLeft: {
    flex: 1,
    textAlign: 'left',
    fontSize: fontSizes.small + 1,
    color: 'black',
    textTransform: 'uppercase',
  },
  cellRight: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSizes.small + 1,
    color: 'black',
    textTransform: 'uppercase',
  },
  cellRightRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bold: {
    fontWeight: 'bold',
  },
  arrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  arrowSmall: {
    width: 19,
    resizeMode: 'contain',
  },
  check: {
    width: 22,
    height: 22,
    marginLeft: 5,
    resizeMode: 'contain',
  },
  entryLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textTransform: 'uppercase',
  },
  exitRow: {
    marginTop: 14,
    marginBottom: 14,
  },
  exitVehicleLabel: {
    flex: 1,
    textAlign: 'left',
    fontSize: fontSizes.small + 1,
    fontWeight: 'bold',
    color: 'black',
    textTransform: 'uppercase',
  },
  refreshBtn: {
    marginTop: 20,
    height: 40,
    backgroundColor: colors.ktm,
  },
});

export default ParkingZoneScreen;
