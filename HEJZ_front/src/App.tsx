import '../src/polyfills/urlsearchparams';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { API_URL, API_SUNO_KEY } from '@env';
import { ApiContext } from './context/ApiContext';
import { UserProvider } from './context/UserContext';

import MainScreen from './screens/MainScreen';
import SongScreen from './screens/Song/SongScreen';
import DanceNavigator from './screens/Dance/DanceStack';
import { enableScreens } from 'react-native-screens';
import CommunityNavigator from './screens/Community/CommunityStack';
import StatsScreen from './screens/StatesScreen';
import SelectScreen from './screens/SelectScreen';
import SignUpScreen from './screens/SignUpScreen';
import SongPlayScreen from './screens/SongPlayScreen';
import SunoPreviewScreen from './screens/SunoPreviewScreen';
import LoginScreen from './screens/LoginScreen';

enableScreens();

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <ApiContext.Provider value={{ apiUrl: API_URL, apiKey: API_SUNO_KEY }}>
      <UserProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Select" component={SelectScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Music" component={SongScreen} />
            <Stack.Screen name="Dance" component={DanceNavigator} />
            <Stack.Screen name="Community" component={CommunityNavigator} />
            <Stack.Screen name="SongPlay" component={SongPlayScreen} />
            <Stack.Screen name="SunoPreviewScreen" component={SunoPreviewScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </ApiContext.Provider>
  );
};

export default App;
