import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PillButton } from '../components/PillButton';
import { events } from '../support/events';
import { colors } from '../theme';
import { RootStackParamList } from '../navigation/types';

const backgroundImage = require('../assets/imgs/backgroundImage.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const guestLogin = () => {
    events.publish('guest:visited', true);
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  const userLogin = () => {
    events.publish('citizen:loggedin', true);
    navigation.push('CitizenLogin');
  };

  const forAttendant = () => {
    events.publish('attendant:loggedin', true);
    navigation.push('AttendantLogin');
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.bg} resizeMode="cover">
      <View style={styles.content}>
        <View style={styles.buttons}>
          <PillButton
            label="For Citizen"
            color={colors.ktm}
            onPress={userLogin}
            style={styles.buttonSpacing}
          />
          <PillButton
            label="For Attendant"
            color={colors.yamaha}
            onPress={forAttendant}
            style={styles.buttonSpacing}
          />
          <PillButton
            label="For Guest"
            color={colors.primary}
            onPress={guestLogin}
            style={styles.buttonSpacing}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  buttons: {
    position: 'absolute',
    bottom: '9%',
    width: '91%',
    alignSelf: 'center',
  },
  buttonSpacing: {
    marginTop: 30,
  },
});

export default LandingScreen;
