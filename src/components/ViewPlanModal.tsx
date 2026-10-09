import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewPlansArray } from '../models';
import { colors, fontSizes } from '../theme';
import { TOOLBAR_HEIGHT } from './AppHeader';

const backIcon = require('../assets/icon/back.png');

export interface ViewPlanModalProps {
  visible: boolean;
  viewPlanArray?: ViewPlansArray[];
  vehicleType?: string;
  disclaimer?: string;
  onDone: () => void;
}

const Row: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const ViewPlanModal: React.FC<ViewPlanModalProps> = ({
  visible,
  viewPlanArray,
  vehicleType,
  disclaimer,
  onDone,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDone}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerBar}>
            <Pressable
              onPress={onDone}
              hitSlop={8}
              accessibilityLabel="Back"
              style={styles.backBtn}>
              <Image source={backIcon} style={styles.backIcon} />
            </Pressable>
            <Text style={styles.title}>Lambert Parking</Text>
          </View>
        </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>{vehicleType}</Text>
        </View>
        {(viewPlanArray ?? []).map((item, index) => (
          <View style={styles.card} key={`${item.scheme_id}-${index}`}>
            {item.scheme_id === '1' ? (
              <>
                <Row label="Free Minutes:" value={item.free_minute} />
                <Row label="Upto (hh.mm):" value={item.from_hour} />
                <Row label="Upto Price (₹):" value={item.upto_price} />
                <Row label="Repeat Hour (h):" value={item.repeat_hour} />
                <Row label="Charge (₹):" value={item.charge} />
              </>
            ) : null}
            {item.scheme_id === '2' ? (
              <>
                <Row label="Free Minutes:" value={item.free_minute} />
                <Row label="Upto (hh.mm):" value={item.from_hour} />
                <Row label="Upto Price (₹):" value={item.upto_price} />
              </>
            ) : null}
            {item.scheme_id === '3' ? (
              <>
                <Row label="Free Minutes:" value={item.free_minute} />
                <Row label="Repeat Hour (h):" value={item.repeat_hour} />
                <Row label="Charge (₹):" value={item.charge} />
              </>
            ) : null}
          </View>
        ))}
        {disclaimer && disclaimer.length > 0 ? (
          <Text style={styles.disclaimer}>Note: {disclaimer}</Text>
        ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  title: {
    color: '#424242',
    fontSize: fontSizes.titleIos,
    fontWeight: '600',
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  headingWrap: {
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    marginVertical: 12,
    color: 'black',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    fontSize: fontSizes.body,
  },
  value: {
    marginLeft: 6,
    color: 'black',
    fontSize: fontSizes.body,
  },
  disclaimer: {
    color: 'red',
    marginTop: 8,
    fontSize: fontSizes.body,
  },
});

export default ViewPlanModal;
