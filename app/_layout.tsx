import { Stack } from "expo-router";

const getGreeting =() =>{
  const hr = new Date().getHours();
  if(hr<12) return "Good Morning";
  if(hr<18) return "Good Afternoon";
  return "Good Evening";
};

export default function RootLayout() {

  const greeting = getGreeting();
  const username="Devanarayan C S";//pull from state after implementing fr now js testeing
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerTitle:"Login", headerShown:false}}/>
      <Stack.Screen 
        name="feed" 
        options={{
          headerTitle:`${greeting}, ${username}`,
          headerStyle:{backgroundColor:'#000'},
          headerTintColor:'#fff',
          headerLeft:() => null,
          headerBackVisible: false,
          headerTitleAlign:'center',
        }}
      />
      <Stack.Screen name="[id]" options={{headerTitle:"MurMur"}}/>
    </Stack>
  );
}
