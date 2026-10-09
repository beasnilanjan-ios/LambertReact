import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from './AppHeader';

export interface PlaceholderScreenProps {
  title: string;
}

/** Temporary scaffold for screens ported in later phases. */
const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => (
  <View style={styles.root}>
    <AppHeader title={title} />
    <View style={styles.body}>
      <Text style={styles.text}>{title} — pending port</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#666',
  },
});

export default PlaceholderScreen;
