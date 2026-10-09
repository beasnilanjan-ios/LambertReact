import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { PillButton } from '../components/PillButton';
import { RootStackParamList } from '../navigation/types';
import { LocalKeys } from '../constants/storage';
import { localClear, localSet, nativeClear } from '../services/storage';
import { useMenu } from '../support/menuContext';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Logout'>;

const LogoutScreen: React.FC<Props> = ({ navigation }) => {
  const { openMenu } = useMenu();

  const btnYes = async () => {
    await localClear();
    await localSet(LocalKeys.phone, null);
    await localSet(LocalKeys.password, null);
    await localSet(LocalKeys.isCitizenLogin, null);
    await nativeClear();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  };

  const btnNo = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Logout" showMenu onMenu={openMenu} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>Are you sure you want to log out now?</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <PillButton label="Yes" color={colors.ktm} onPress={btnYes} style={styles.button} />
          </View>
          <View style={styles.col}>
            <PillButton label="No" color={colors.ktm} onPress={btnNo} style={styles.button} />
          </View>
        </View>
      </ScrollView>
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
  },
  question: {
    color: 'black',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  col: {
    flex: 1,
    paddingHorizontal: 6,
  },
  button: {
    height: 40,
    marginTop: 25,
  },
});

export default LogoutScreen;
