import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ApiConstant } from '../constants/api';
import {
  AdvanceBookingTokenItemModel,
  MapAreaResponseModel,
} from '../models';
import { session } from '../services/sessionManager';
import { useMenu } from '../support/menuContext';
import { dismissLoading, presentLoading, showAlert } from '../support/feedback';
import { colors, fontSizes } from '../theme';

const hasTokenNo = (item: AdvanceBookingTokenItemModel): boolean =>
  item.token_no != null && String(item.token_no).trim().length > 0;

const CouponsScreen: React.FC = () => {
  const { openMenu } = useMenu();
  const [couponList, setCouponList] = useState<AdvanceBookingTokenItemModel[]>([]);
  const [noCouponsMessage, setNoCouponsMessage] = useState('');

  const finishCouponLoad = (allCoupons: AdvanceBookingTokenItemModel[]) => {
    dismissLoading();
    setCouponList(allCoupons);
    if (allCoupons.length === 0) {
      setNoCouponsMessage('No coupons available.');
    }
  };

  const fetchCouponsForVendors = async (vendorIds: string[]) => {
    const results = await Promise.all(
      vendorIds.map(async vendorId => {
        const payload = { vendor_id: String(vendorId) };
        console.log('advance_booking_token payload:', JSON.stringify(payload));
        try {
          const res = await session.advanceBookingToken(
            ApiConstant.MainApi + ApiConstant.AdvanceBookingTokenApi,
            payload,
          );
          console.log('advance_booking_token response:', JSON.stringify(res));
          if (res && res.status === 'success' && res.data && res.data.length > 0) {
            return res.data.filter(item => hasTokenNo(item));
          }
        } catch (err) {
          console.error('advance_booking_token error:', err);
        }
        return [] as AdvanceBookingTokenItemModel[];
      }),
    );
    finishCouponLoad(results.flat());
  };

  const loadCoupons = async () => {
    presentLoading();
    setCouponList([]);
    setNoCouponsMessage('');
    try {
      const mapRes: MapAreaResponseModel = await session.getResponseMapParkingSpace(
        ApiConstant.MainApi + ApiConstant.MapSpaceApi,
      );
      if (mapRes.status !== 'success' || !mapRes.parkingspace_list) {
        dismissLoading();
        showAlert('Coupons', 'Unable to load parking vendors.');
        return;
      }
      const vendorIds = Array.from(
        new Set(
          mapRes.parkingspace_list
            .filter(p => p.vehicles && p.vehicles.length > 0)
            .map(p => p.vendor_id)
            .filter((id): id is string => !!id),
        ),
      );
      if (vendorIds.length === 0) {
        dismissLoading();
        setNoCouponsMessage('No vendors found.');
        return;
      }
      await fetchCouponsForVendors(vendorIds);
    } catch (err) {
      dismissLoading();
      console.error('loadCoupons parkingspace_list error:', err);
      showAlert('Coupons', 'Unable to load coupons. Please try again.');
    }
  };

  useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <AppHeader title="Coupons" showMenu onMenu={openMenu} />
      <View style={styles.hrWrap}>
        <View style={styles.hr} />
      </View>

      {noCouponsMessage.length > 0 ? (
        <Text style={styles.emptyMessage}>{noCouponsMessage}</Text>
      ) : null}

      <FlatList
        data={couponList}
        keyExtractor={(item, index) => `${item.token_no}-${index}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.token}>{item.token_no}</Text>
            <View style={styles.route}>
              <Text style={styles.routeText}>
                <Text style={styles.bold}>{item.start_position}</Text> To{' '}
                <Text style={styles.bold}>{item.end_position}</Text>
              </Text>
            </View>
            <View style={styles.address}>
              <Text style={styles.addressLabel}>Address:</Text>
              <Text style={styles.addressText}>{item.location}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hrWrap: {
    paddingHorizontal: 0,
  },
  hr: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  emptyMessage: {
    color: colors.emptyMessage,
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: colors.white,
    ...{
      shadowColor: 'rgba(0,0,0,0.14)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  token: {
    color: colors.yamaha,
    fontSize: fontSizes.couponToken,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  route: {
    backgroundColor: colors.ktm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 4,
  },
  routeText: {
    color: colors.white,
    fontSize: fontSizes.small,
  },
  bold: {
    fontWeight: 'bold',
  },
  address: {},
  addressLabel: {
    color: colors.couponAddress,
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: fontSizes.body,
  },
  addressText: {
    color: colors.couponAddress,
    fontSize: fontSizes.body,
    lineHeight: 21,
  },
});

export default CouponsScreen;
