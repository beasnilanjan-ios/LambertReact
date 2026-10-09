import { Platform } from 'react-native';
import { InAppBrowser, InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

const options: InAppBrowserOptions =
  Platform.OS === 'ios'
    ? { dismissButtonStyle: 'done', animated: true, enableBarCollapsing: false }
    : { showTitle: false, toolbarColor: '#ffffff', enableUrlBarHiding: false };

export const openInAppBrowser = async (url?: string): Promise<void> => {
  if (!url) {
    console.log('InAppBrowser: no url');
    return;
  }
  try {
    const opened = await InAppBrowser.open(url, options);
    console.log('InAppBrowser result', opened);
  } catch (e) {
    console.error('InAppBrowser error', e);
  }
};
