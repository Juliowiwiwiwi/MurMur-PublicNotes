import { supabase } from '@/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length > 2) {
      try {
        await AsyncStorage.setItem('username', trimmedUsername);

        // auto prof
        const { error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', trimmedUsername)
          .single();

        if (error && error.code === 'PGRST116') {
          // no profile:(  ? mae one
          await supabase.from('profiles').insert([{ username: trimmedUsername }]);
        }
      } catch (e) {
        console.error('Failed to save username or create profile.', e);
      }
      router.replace({
        pathname: "/feed",
        params: { user: trimmedUsername }
      });
    } else {
      alert("Enter a username (at least 3 characters)")
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}
      >
        <View style={styles.inner}>
          <View>
            <Text style={styles.logo}>
              MurMur
            </Text>
            <Text style={styles.subtitle}>Thoughts that linger.{"\n"}Notes that stay.{"\n"}Something new with every swipe away. </Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter a username"
              placeholderTextColor={'#999'}
              value={username}
              onChangeText={setUsername}
            />
            <TouchableOpacity style={styles.button} onPress={() => {
              handleLogin();
              console.log("Login Pressed");
            }}
              activeOpacity={0.5}>
              <Text style={styles.buttonText}>Let&apos;s get started! →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 48,
    fontWeight: 900,
    paddingVertical: 15,
    marginBottom: 12,
    color: "white",
  },
  subtitle: {
    fontSize: 18,
    color: "#a1a1a1",
    lineHeight: 24,
    textAlign: 'left',
  },
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: "white",
    padding: 15,
    borderRadius: 20,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'

  },
  button: {
    backgroundColor: '#131441',
    padding: 15,
    alignItems: "center",
    borderRadius: 20,
    shadowColor: "#0d4572",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, //androidil shadownokke paranjal manasilavila so elevation
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 'bold',
  },
})