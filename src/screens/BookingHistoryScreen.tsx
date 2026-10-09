import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { useMenu } from '../support/menuContext';
import { colors } from '../theme';

const BookingHistoryScreen: React.FC = () => {
  const { openMenu } = useMenu();

  return (
    <View style={styles.root}>
      <AppHeader title="Booking History" showMenu onMenu={openMenu} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default BookingHistoryScreen;
