import { supabase } from '@/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { getRelativeTime } from './utils/time';

export default function Profile() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [userWhispers, setUserWhispers] = useState<any[]>([]);
  const [stats, setStats] = useState({ whispers: 0, replies: 0, daysActive: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Whisperer classlogic
  const getWhispererClass = (totalActions: number) => {
    if (totalActions <= 5) return { rank: "The Phantom", color: "#666666" };
    if (totalActions <= 20) return { rank: "The Echo", color: "#08ded6" };
    if (totalActions <= 50) return { rank: "The Oracle", color: "#a855f7" };
    return { rank: "The Architect", color: "#ef4444" };
  };

  const fetchProfileData = useCallback(async (user: string) => {
    try {
      //prof
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', user)
        .single();

      setProfileData(profile);

      //whispCount
      const { count: whispersCount } = await supabase
        .from('whispers')
        .select('*', { count: 'exact', head: true })
        .eq('author', user);

      //ReplCount
      const { count: repliesCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author', user);

      // DaysCaitve
      let daysActive = 0;
      if (profile?.created_at) {
        const createdDate = new Date(profile.created_at);
        const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysActive === 0) daysActive = 1; // ensure at least 1 day
      }

      setStats({
        whispers: whispersCount || 0,
        replies: repliesCount || 0,
        daysActive: daysActive
      });

      //UsrWhisprs
      const { data: whispers } = await supabase
        .from('whispers')
        .select('*')
        .eq('author', user)
        .order('created_at', { ascending: false });

      setUserWhispers(whispers || []);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('username');
      if (storedUser) {
        setUsername(storedUser);
        fetchProfileData(storedUser);
      } else {
        router.replace('/');
      }
    };
    loadUser();
  }, [fetchProfileData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('username');
      router.replace('/');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsUploading(true);
    try {
      const ext = 'jpg';
      const filename = `avatar_${username}_${Date.now()}.${ext}`;

      const localFile = new File(uri);
      const base64String = await localFile.base64();
      const arrayBuffer = decode(base64String);

      const { error } = await supabase.storage
        .from('media')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filename);

      //up prof tb;e
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('username', username);

      if (updateError) throw updateError;

      //rfrsh
      fetchProfileData(username);
    } catch (e) {
      console.error("Avatar upload failed: ", e);
      Alert.alert("Error", "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderWhisper = ({ item }: { item: any }) => (
    <View style={styles.noteCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.authorText}>@{item.author}</Text>
        <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
      </View>
      {item.type !== "Audio" && item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
      {item.content ? <Text style={styles.cardContent}>{item.content}</Text> : null}

      {item.type === "Image" && item.media_url && (
        <View style={styles.noteImageContainer}>
          <Image
            source={{ uri: item.media_url }}
            style={styles.noteImage}
            resizeMode="cover" />
        </View>
      )}
      {item.type === "Audio" && item.media_url && (
        <AudioPlayerCard uri={item.media_url} title={item.title} author={item.author} />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#08ded6" />
      </SafeAreaView>
    );
  }

  const whispererClass = getWhispererClass(stats.whispers + stats.replies);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: "Profile",
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Text style={{ color: '#ff4444', fontSize: 16, fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        )
      }} />

      <View style={styles.headerSection}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer} activeOpacity={0.8}>
          {isUploading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color="#08ded6" />
            </View>
          ) : profileData?.avatar_url ? (
            <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{username ? username.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}
          <View style={styles.editIconContainer}>
            <Text style={styles.editIcon}>✎</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.usernameText}>@{username}</Text>

        <View style={[styles.badgeContainer, { borderColor: whispererClass.color }]}>
          <Text style={[styles.badgeText, { color: whispererClass.color }]}>{whispererClass.rank}</Text>
        </View>
      </View>

      <View style={styles.statsDashboard}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.whispers}</Text>
          <Text style={styles.statLabel}>Whispers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.replies}</Text>
          <Text style={styles.statLabel}>Replies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.daysActive}</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </View>

      <View style={styles.feedSection}>
        <Text style={styles.feedTitle}>Your Whispers</Text>
        <FlatList
          data={userWhispers}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWhisper}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You haven't whispered anything yet.</Text>
          }
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#08ded6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  editIcon: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  badgeContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsDashboard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1a1',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  feedSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feedTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
  noteCard: {
    backgroundColor: '#111',
    marginBottom: 15,
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardContent: {
    color: '#efefef',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  noteImageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  noteImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
});
