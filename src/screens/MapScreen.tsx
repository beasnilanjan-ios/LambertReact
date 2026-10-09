import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Map, Marker, Callout, Camera } from '@maplibre/maplibre-react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation';
import { AppHeader } from '../components/AppHeader';
import { RootStackParamList } from '../navigation/types';
import { ApiConstant, GOOGLE_MAPS_API_KEY } from '../constants/api';
import { LocalKeys } from '../constants/storage';
import { session } from '../services/sessionManager';
import { localGet } from '../services/storage';
import { useMenu } from '../support/menuContext';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors, fontSizes } from '../theme';

const myLocationIcon = require('../assets/icon/mylocation.png');
const activeMarker = require('../assets/imgs/parking-marker-active.png');
const fullMarker = require('../assets/imgs/parking-marker-full.png');
const curLocIcon = require('../assets/imgs/curLoc.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

type AdvanceKind = 'loading' | 'available' | 'full' | 'hidden';
interface AdvanceState {
  kind: AdvanceKind;
  data?: CheckAdvanceBookingDataModel;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_REGION: Region = {
  latitude: 22.5843346,
  longitude: 88.4105554,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const OSM_TILE_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [OSM_TILE_TEMPLATE],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

const totalFreeSlots = (space: MapParkingSpaceArrayModel): number => {
  let total = 0;
  (space.vehicles ?? []).forEach(vehicle => {
    total += Number(vehicle.Free_slots ?? 0) || 0;
  });
  return total;
};

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const { openMenu } = useMenu();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [parkingList, setParkingList] = useState<MapParkingSpaceArrayModel[]>([]);
  const [advance, setAdvance] = useState<Record<string, AdvanceState>>({});
  const [advertisements, setAdvertisements] = useState<string[]>([]);
  const adListRef = useRef<FlatList<string>>(null);
  const adIndexRef = useRef(0);
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }
    camera
      .setStop({
        center: [region.longitude, region.latitude],
        zoom: 13,
        duration: 0,
      })
      .then(() => mapRef.current?.getViewState())
      .then((viewState: any) => {
        console.log('Map camera applied', JSON.stringify(viewState));
      });
  }, [region.latitude, region.longitude]);

  const getParkingZoneList = async () => {
    console.log('Map: parking API started');
    try {
      const value: MapAreaResponseModel = await session.getResponseMapParkingSpace(
        ApiConstant.MainApi + ApiConstant.MapSpaceApi,
      );
      if (value.status === 'success') {
        const spaces = value.parkingspace_list ?? [];
        console.log('Map: parking spaces received = ' + spaces.length);
        console.log('Map: creating parking markers = ' + spaces.length);
        setParkingList(spaces);
      } else {
        console.log('Map: parking API returned non-success status');
        showAlert('Oops', 'Some error occured. Please try after some times');
      }
    } catch (error) {
      console.log('Map: parking API failed', error);
    }
    dismissLoading();
  };

  const showAd = async () => {
    console.log('Map: advertisement API started');
    try {
      const res = await session.getCitizenAdList(ApiConstant.MainApi + ApiConstant.CitizenAdApi);
      if (res.status === 'success') {
        const filenames = (res.advertisements ?? []).map(ad => ad.ad_filename);
        console.log('Map: advertisements received = ' + filenames.length);
        setAdvertisements(prev => [...prev, ...filenames]);
      }
    } catch (error) {
      console.log('Map: advertisement API failed', error);
    }
    dismissLoading();
  };

  const showMap = () => {
    console.log('Map: showMap started (map initialization)');
    Geolocation.getCurrentPosition(
      position => {
        console.log('Map: current location received');
        console.log('Map: latitude = ' + position.coords.latitude);
        console.log('Map: longitude = ' + position.coords.longitude);
        setMyLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        getParkingZoneList();
      },
      error => {
        console.log('Map: Error getting location', error);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );

    // Quirk kept verbatim: the check runs synchronously before the async
    // callback resolves, so the alert fires on every map (re)build.
    showAlert(
      'Lambert PArking',
      'Current location not found. Please enable your GPS from phone settings and wait a few seconds',
    );
  };

  useEffect(() => {
    presentLoading();
    showMap();
    showAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (advertisements.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      adIndexRef.current = (adIndexRef.current + 1) % advertisements.length;
      adListRef.current?.scrollToIndex({
        index: adIndexRef.current,
        animated: true,
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [advertisements.length]);

  const btnHistory = () => {
    navigation.push('CitizenParkingHistory');
  };

  const setAdvanceKind = (key: string, state: AdvanceState) => {
    setAdvance(prev => ({ ...prev, [key]: state }));
  };

  const fetchAdvanceBookingForPopup = async (
    parkingSpace: MapParkingSpaceArrayModel,
    key: string,
  ) => {
    setAdvanceKind(key, { kind: 'loading' });

    const vehicles = parkingSpace.vehicles ?? [];
    if (vehicles.length === 0) {
      setAdvanceKind(key, { kind: 'full' });
      return;
    }

    let pendingRequests = 0;
    let hasAvailableSlot = false;
    let noPlanAssignedCount = 0;
    let otherFailureCount = 0;
    let bookingData: CheckAdvanceBookingDataModel | undefined;

    const tasks = vehicles.map(async vehicle => {
      const parkingId = parkingSpace.parking_id || vehicle.parking_id;
      const vtId = vehicle.vt_id || vehicle.vehicle_type_id;
      const vendorId = parkingSpace.vendor_id || vehicle.vendor_id;

      if (!parkingId || !vtId || !vendorId) {
        console.warn('Missing advance booking params', { parkingId, vtId, vendorId, parkingSpace, vehicle });
        return;
      }

      pendingRequests++;
      try {
        const res = await session.checkAdvanceBookingRequest(
          ApiConstant.MainApi + ApiConstant.CheckAdvanceBookingApi,
          {
            parking_id: String(parkingId),
            vt_id: String(vtId),
            vendor_id: String(vendorId),
          },
        );
        console.log('check_advance_booking_request response:', {
          parking_id: parkingId,
          vt_id: vtId,
          vendor_id: vendorId,
          response: res,
        });

        const freeSlot = res && res.data ? Number(res.data.free_slot) : 0;
        const responseMessage = res && res.message ? res.message.trim() : '';
        const isNoPlanAssigned = responseMessage.toLowerCase() === 'sorry! no plan is assigned';

        if (res && res.status === 'success' && freeSlot > 0) {
          hasAvailableSlot = true;
          if (!bookingData) {
            bookingData = res.data;
          }
        } else if (isNoPlanAssigned) {
          noPlanAssignedCount++;
        } else {
          otherFailureCount++;
        }
      } catch (err) {
        console.error('check_advance_booking_request error:', err);
        otherFailureCount++;
      }
    });

    await Promise.all(tasks);

    if (pendingRequests === 0) {
      setAdvanceKind(key, { kind: 'full' });
      return;
    }
    if (hasAvailableSlot) {
      setAdvanceKind(key, { kind: 'available', data: bookingData });
    } else if (noPlanAssignedCount > 0 && otherFailureCount === 0) {
      setAdvanceKind(key, { kind: 'hidden' });
    } else {
      setAdvanceKind(key, { kind: 'full' });
    }
  };

  const hideSelectedCallout = () => {
    setSelected(null);
  };

  const onMarkerPress = (parkingSpace: MapParkingSpaceArrayModel, key: string) => {
    setSelected(key);
    fetchAdvanceBookingForPopup(parkingSpace, key);
  };

  const fetchAdvanceBookingToken = async (vendorId: string) => {
    console.log('advance_booking_token payload:', JSON.stringify({ vendor_id: vendorId }));
    presentLoading();
    try {
      const res = await session.advanceBookingToken(
        ApiConstant.MainApi + ApiConstant.AdvanceBookingTokenApi,
        { vendor_id: vendorId },
      );
      dismissLoading();
      console.log('advance_booking_token response:' + JSON.stringify(res));
    } catch (err) {
      dismissLoading();
      console.error('advance_booking_token error:', err);
      showAlert('Advance Booking Token', 'Request failed. Please try again.');
    }
  };

  const onAdvanceBooking = async (
    parkingSpace: MapParkingSpaceArrayModel,
    key: string,
  ) => {
    const bookingData = advance[key];
    if (!bookingData || !bookingData.data || !bookingData.data.adv_id) {
      showAlert('Advance Booking', 'Booking details not available. Please tap the marker again.');
      return;
    }

    const citizenId = await localGet(LocalKeys.citizen_id);
    if (!citizenId) {
      showAlert('Advance Booking', 'Citizen ID not found. Please log in again.');
      return;
    }

    const data = bookingData.data;
    const vendorId = data.vendor_id || parkingSpace.vendor_id;
    const parkingId = data.parking_id || parkingSpace.parking_id;
    const requestBody = {
      vendor_id: String(vendorId),
      citizen_id: String(citizenId),
      parking_id: String(parkingId),
      advance_id: String(data.adv_id),
      cars_no: '1',
    };

    console.log('advance_booking_request payload:', JSON.stringify(requestBody));
    presentLoading();
    try {
      const res = await session.advanceBookingRequest(
        ApiConstant.MainApi + ApiConstant.AdvanceBookingApi,
        requestBody,
      );
      dismissLoading();
      console.log('advance_booking_request response:' + JSON.stringify(res));
      const message = String(res.message || JSON.stringify(res)).trim();
      const isSuccessfulBooking = message.toLowerCase() === 'sucessfull';

      if (isSuccessfulBooking) {
        console.log('advance_booking_request: Sucessfull — token API will run after OK click');
        showAlert('Advance Booking', message, () => {
          fetchAdvanceBookingToken(String(vendorId));
        });
      } else {
        console.log('advance_booking_request: token API skipped. message =' + message);
        showAlert('Advance Booking', message);
      }
    } catch (err) {
      dismissLoading();
      console.error('advance_booking_request error:', err);
      showAlert('Advance Booking', 'Request failed. Please try again.');
    }
  };

  const onAdScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (width > 0) {
      adIndexRef.current = Math.round(event.nativeEvent.contentOffset.x / width);
    }
  };

  const renderCallout = (space: MapParkingSpaceArrayModel, key: string) => {
    const state = advance[key] ?? { kind: 'loading' as AdvanceKind };
    const label =
      state.kind === 'loading'
        ? 'Checking...'
        : state.kind === 'available'
        ? 'Advance Booking'
        : 'Advance Booking Slot is Full';
    const background =
      state.kind === 'loading'
        ? colors.bookingLoading
        : state.kind === 'available'
        ? colors.bookingAvailable
        : colors.bookingFull;

    return (
      <View style={styles.callout}>
        <Pressable
          style={styles.calloutClose}
          hitSlop={8}
          onPress={hideSelectedCallout}
          accessibilityLabel="Close">
          <Text style={styles.calloutCloseText}>×</Text>
        </Pressable>
        <View style={styles.calloutTitle}>
          <Text style={styles.calloutTitleText}>
            {space.start_position} To {space.end_position}
          </Text>
        </View>
        {(space.vehicles ?? []).map((vehicle, vIndex) => (
          <View key={`${vehicle.vt_id ?? vIndex}`}>
            <Text style={styles.calloutVehicleType}>{vehicle.vehicle_type}</Text>
            <Text style={styles.calloutLine}>Free Slot(s): {vehicle.Free_slots}</Text>
            <Text style={styles.calloutLine}>Fare/hr: ₹ {vehicle.price}</Text>
          </View>
        ))}
        {state.kind !== 'hidden' ? (
          <View style={styles.calloutBtnWrap}>
            <Pressable
              disabled={state.kind === 'loading'}
              onPress={() => onAdvanceBooking(space, key)}
              style={[styles.calloutBtn, { backgroundColor: background }]}>
              <Text style={styles.calloutBtnText}>{label}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Lambert Parking"
        showMenu
        onMenu={openMenu}
        titleAlign="left"
        right={
          <Pressable onPress={btnHistory} style={styles.historyBtn} accessibilityRole="button">
            <Text style={styles.historyText}>History</Text>
          </Pressable>
        }
      />

<View style={styles.mapWrap}>
        <Map
          ref={mapRef}
          mapStyle={OSM_MAP_STYLE}
          style={styles.map}
          onPress={hideSelectedCallout}
          attribution={false}
          logo={false}>
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: [region.longitude, region.latitude],
                zoom: 13,
              }}
            />
            {myLocation ? (
              <Marker
                lngLat={[myLocation.longitude, myLocation.latitude]}
                anchor="bottom"
                onPress={() => setSelected('me')}>
                <View style={styles.markerContainer}>
                  <Image source={myLocationIcon} style={styles.currentLocationMarker} />
                  {selected === 'me' ? (
                    <Callout>
                      <View style={styles.callout}>
                        <Text style={styles.myLocationTitle}>Lambert Parking</Text>
                      </View>
                    </Callout>
                  ) : null}
                </View>
              </Marker>
            ) : null}

            {parkingList.map((space, index) => {
              const key = String(index);
              const latitude = parseFloat(String(space.latitude ?? '0'));
              const longitude = parseFloat(String(space.longitude ?? '0'));
              if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                return null;
              }
              const free = totalFreeSlots(space);
              return (
                <Marker
                  key={`${space.parking_id}-${index}`}
                  lngLat={[longitude, latitude]}
                  anchor="bottom"
                  onPress={() => onMarkerPress(space, key)}>
                  <View style={styles.markerContainer}>
                    <Image
                      source={free > 0 ? activeMarker : fullMarker}
                      style={styles.parkingMarker}
                    />
                    {selected === key ? <Callout>{renderCallout(space, key)}</Callout> : null}
                  </View>
                </Marker>
              );
            })}
          </Map>

        <View style={styles.searchBar}>
          <GooglePlacesAutocomplete
            placeholder=""
            nearbyPlacesAPI="GooglePlacesSearch"
            debounce={300}
            minLength={2}
            fetchDetails
            query={{
              key: GOOGLE_MAPS_API_KEY,
              country: 'in',
            }}
            onPress={(data, details = null) => {
              const location = details?.geometry?.location;
              if (!location) {
                return;
              }
              console.log('handle address change');
              console.log(location.lng);
              console.log(location.lat);
              setRegion({
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              });
              getParkingZoneList();
            }}
            onFail={error => console.error('places error', error)}
            textInputProps={{
              placeholderTextColor: colors.label,
            }}
            styles={{
              textInput: styles.placesInput,
              container: styles.placesContainer,
              listView: styles.placesList,
              predefinedPlacesDescription: { color: 'black' },
            }}
          />
        </View>

        <Pressable style={styles.curLocButton} onPress={showMap} accessibilityLabel="My location">
          <Image source={curLocIcon} style={styles.curLocIcon} />
        </Pressable>

        {advertisements.length > 0 ? (
          <FlatList
            ref={adListRef}
            data={advertisements}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item}-${index}`}
            onMomentumScrollEnd={onAdScroll}
            style={styles.adList}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.adImage} resizeMode="cover" />
            )}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '70%',
  },
  markerContainer: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  parkingMarker: {
    width: 36,
    height: 44,
  },
  currentLocationMarker: {
    width: 32,
    height: 32,
  },
  adList: {
    height: 150,
  },
  historyBtn: {
    borderWidth: 1,
    borderColor: colors.ktm,
    borderRadius: 64,
    paddingHorizontal: 10,
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  historyText: {
    color: colors.ktm,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  searchBar: {
    position: 'absolute',
    width: '98%',
    top: '2%',
    marginHorizontal: '1%',
    backgroundColor: colors.white,
    borderRadius: 20,
    zIndex: 2,
    ...{
      shadowColor: 'rgba(0,0,0,0.14)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 4,
    },
  },
  placesContainer: {
    flex: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  placesInput: {
    width: '100%',
    paddingHorizontal: '2%',
    height: 36,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    fontSize: fontSizes.body,
  },
  placesList: {
    backgroundColor: colors.white,
    maxHeight: 240,
  },
  curLocButton: {
    position: 'absolute',
    right: 12,
    bottom: '30%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.mapFab,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  curLocIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  callout: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  calloutClose: {
    position: 'absolute',
    top: 2,
    right: 8,
    zIndex: 3,
    padding: 4,
  },
  calloutCloseText: {
    color: '#666',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  calloutTitle: {
    backgroundColor: colors.ktm,
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    marginTop: 28,
  },
  calloutTitleText: {
    color: colors.white,
    fontSize: fontSizes.mapInfoTitle,
    fontWeight: 'bold',
  },
  calloutVehicleType: {
    color: colors.yamaha,
    fontSize: 16,
    marginTop: 3,
    marginHorizontal: 12,
  },
  calloutLine: {
    color: '#333',
    fontSize: 13,
    marginHorizontal: 12,
    marginTop: 5,
  },
  calloutBtnWrap: {
    padding: 12,
    alignItems: 'stretch',
  },
  calloutBtn: {
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  calloutBtnText: {
    color: colors.white,
    fontSize: fontSizes.body,
    fontWeight: 'bold',
  },
  myLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    padding: 4,
  },
  adImage: {
    width: SCREEN_WIDTH,
    height: 150,
    backgroundColor: colors.light,
  },
});

export default MapScreen;
