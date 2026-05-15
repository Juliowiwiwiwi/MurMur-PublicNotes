import { Stack } from "expo-router";


export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerTitle:"Login", headerShown:false}}/>
      <Stack.Screen 
        name="feed" 
        options={{
          headerStyle:{backgroundColor:'#000'},
          headerTintColor:'#fff',
          headerLeft:() => null,
          headerBackVisible: false,
          headerTitleAlign:'center',
        }}
      />
      <Stack.Screen name="create" options={{headerTitle:"Add Whisper"}}/>
      <Stack.Screen name="[id]" options={{headerTitle:"MurMur"}}/>
    </Stack>
  );
}
