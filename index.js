import {AppRegistry} from 'react-native';
import App from './Apps/LMS-Project/Navigation';
import {name as appName} from './app.json';
import {LogBox} from 'react-native';
// import messaging from '@react-native-firebase/messaging';
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('Message handled in the background!', remoteMessage);
//   });
if (!__DEV__) {
  // 1. Ignore all LogBox notifications
  LogBox.ignoreAllLogs();

  // 2. Disable all console logs
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.error = noop;

  // 3. Disable YellowBox for older RN versions
  console.disableYellowBox = true;
}
AppRegistry.registerComponent(appName, () => App);
