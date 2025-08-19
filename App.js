import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './components/WelcomeScreen';
import MainScreen from './screens/MainScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://app.nettmobfrance.fr/user-dashboard/');

  useEffect(() => {
    const prepareApp = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (!hasLaunched) {
          setShowWelcome(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  const handleStart = () => {
    setShowWelcome(false);
    setCurrentUrl('https://www.nettmobfrance.fr/type-de-profil/');
    AsyncStorage.setItem('hasLaunched', 'true');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  return (
    <MainScreen 
      url={currentUrl}
      onNavigationStateChange={(navState) => setCurrentUrl(navState.url)}
    />
  );
}