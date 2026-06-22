import { supabase } from '@/supabase';
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTimeout(() => {
          router.replace({ pathname: "/feed", params: { user: session.user.user_metadata.username } });
        }, 0);
      }
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace({ pathname: "/feed", params: { user: session.user.user_metadata.username } });
      } else {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
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
