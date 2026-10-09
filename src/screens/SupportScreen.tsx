import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { useMenu } from '../support/menuContext';
import { authStyles } from './authScreenStyles';

const SupportScreen: React.FC = () => {
  const { openMenu } = useMenu();

  return (
    <View style={styles.root}>
      <AppHeader title="Lambert Parking" showMenu onMenu={openMenu} />
      <ScrollView contentContainerStyle={authStyles.content}>
        <Text style={[authStyles.heading, styles.title]}>Support</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 0,
  },
});

export default SupportScreen;
