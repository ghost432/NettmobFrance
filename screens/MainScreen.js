import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';

const MainScreen = ({ url, onNavigationStateChange }) => {
  const webViewRef = useRef(null);

  // Configuration des notifications
  useEffect(() => {
    const setupNotifications = async () => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'EXPO_PUSH_TOKEN',
          token: token
        }));
      }

      const subscription = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data;
        if (data.url) {
          onNavigationStateChange({ url: data.url });
        }
      });

      return () => subscription.remove();
    };

    setupNotifications();
  }, []);

  // Gestion du bouton retour Android
  useEffect(() => {
    const backAction = () => {
      webViewRef.current?.injectJavaScript(`
        if (window.history.length > 1) {
          window.history.back();
          true;
        } else {
          false;
        }
      `);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={onNavigationStateChange}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        injectedJavaScript={`
          // Détection PWA WordPress
          const isPWA = window.matchMedia('(display-mode: standalone)').matches;
          const manifest = document.querySelector('link[rel="manifest"]');
          const themeColor = document.querySelector('meta[name="theme-color"]');
          
          if (isPWA && manifest) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PWA_CONFIG',
              config: {
                themeColor: themeColor?.content,
                manifestUrl: manifest.href
              }
            }));
          }
          
          // Communication avec WordPress
          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'WP_NOTIFICATION') {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'NOTIFICATION',
                  title: data.title,
                  message: data.message,
                  url: data.url
                }));
              }
            } catch (e) {}
          });
          
          // Envoyer le token à WordPress après chargement
          setTimeout(() => {
            window.dispatchEvent(new Event('expo-app-loaded'));
          }, 1000);
          
          true;
        `}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'NAVIGATE' && data.url) {
              onNavigationStateChange({ url: data.url });
            }
          } catch (e) {}
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default MainScreen;