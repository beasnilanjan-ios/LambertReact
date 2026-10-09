import { StyleSheet } from 'react-native';
import { colors, pillRadius } from '../theme';

export const authStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    flex: 1,
  },
  heading: {
    color: 'black',
    marginTop: 50,
    marginBottom: '20%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },
  formControl: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: 'transparent',
    borderRadius: pillRadius,
    marginVertical: 20,
    width: '100%',
    height: 40,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    color: colors.text,
    paddingHorizontal: 11,
    paddingVertical: 11,
    width: '100%',
  },
  linkButton: {
    backgroundColor: 'transparent',
    fontSize: 15,
    marginTop: 20,
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  linkText: {
    color: colors.link,
  },
  orangeButton: {
    backgroundColor: colors.ktm,
    marginTop: 20,
    height: 40,
  },
});
