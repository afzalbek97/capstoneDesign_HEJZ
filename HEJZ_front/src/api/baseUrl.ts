import { Platform } from 'react-native';

const DEV_PORT = 8080;
const LAN_IP = '192.168.0.1'; // Replace with your local machine IP when using a physical device

const USE_LAN = false;         // true: physical device over Wi-Fi
const USE_ADB_REVERSE = false; // true: USB + `adb reverse tcp:8080 tcp:8080`

const DEV_URLS = {
  emulator: `http://10.0.2.2:${DEV_PORT}`,
  lan: `http://${LAN_IP}:${DEV_PORT}`,
  reverse: `http://127.0.0.1:${DEV_PORT}`,
};

const PROD_URL = 'https://your-production-domain.com';

function getDevBaseUrl() {
  if (Platform.OS === 'android') {
    if (USE_ADB_REVERSE) return DEV_URLS.reverse;
    if (USE_LAN) return DEV_URLS.lan;
    return DEV_URLS.emulator;
  }
  return DEV_URLS.lan;
}

export const BASE_URL = __DEV__ ? getDevBaseUrl() : PROD_URL;
export default BASE_URL;
