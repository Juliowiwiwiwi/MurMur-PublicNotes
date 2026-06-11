import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const username = await AsyncStorage.getItem('username');
        if (username) {
          // A short timeout so navigation smooth akan
          setTimeout(() => {
            router.replace({ pathname: "/feed", params: { user: username } });
          }, 0);
        }
      } catch (e) {
        console.error('Failed to check login status.', e);
      } finally {
        setIsReady(true);
      }
    };
    checkLogin();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: "Login", headerShown: false }} />
      <Stack.Screen
        name="feed"
        options={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerLeft: () => null,
          headerBackVisible: false,
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen name="create" options={{ headerTitle: "Add Whisper" }} />
      <Stack.Screen name="[id]" options={{ headerTitle: "MurMur" }} />
      <Stack.Screen name="profile" options={{ headerTitle: "Profile", presentation: 'modal' }} />
    </Stack>
  );
}
