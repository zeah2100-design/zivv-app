import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zivv.app',
  appName: 'zivv',
  webDir: 'out',
  server: {
    url: 'https://zivv-app.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f0f23',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f0f23',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#8b5cf6',
    },
  },
};

export default config;
