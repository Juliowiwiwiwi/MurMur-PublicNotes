import { supabase } from '@/supabase';
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter an email and password.");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        Alert.alert("Error", "Enter a username (at least 3 characters)");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: trimmedUsername },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          Alert.alert("Oops", "That email is already in use!");
        } else {
          Alert.alert("Signup Failed", error.message);
        }
      } else {
        Alert.alert("Success", "Account created successfully!");
        setIsSignUp(false); // Switch to login
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
      }
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <View style={styles.inner}>
          <View>
            <Text style={styles.logo}>MurMur</Text>
            <Text style={styles.subtitle}>Thoughts that linger.{"\n"}Notes that stay.{"\n"}Something new with every swipe away.</Text>
          </View>
          <View style={styles.inputContainer}>
            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={'#999'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={'#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={'#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? "Create Account" : "Sign In"} →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </Text>
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
    fontWeight: '900',
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  button: {
    backgroundColor: '#ffffffff',
    padding: 15,
    alignItems: "center",
    borderRadius: 20,
    shadowColor: "#0d4572",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10,
    height: 55,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#000000ff",
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#a1a1a1',
    fontSize: 16,
  }
});