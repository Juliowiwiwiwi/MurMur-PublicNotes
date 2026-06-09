import { supabase } from '@/supabase';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';


const AudioPlayerCard = ({ uri }: { uri: string }) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View style={styles.playerCard}>
      <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
        <Text style={styles.playIcon}>{status.playing ? "⏸" : "▶️"}</Text>
      </TouchableOpacity>
      <View style={styles.waveformContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
          <Text style={styles.timeText}>
            {status.duration > 0 ? formatTime(status.duration) : "..."}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function ID() {

  const { id } = useLocalSearchParams(); // Destructured properly
  const [replyText, setReplyText] = useState('');

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchWhisper = async () => {
    if(!id) return;
    try {
      const { data: postData, error: postError } = await supabase
        .from('whispers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      setPost(postData);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('whisper_id', id)
        .order('created_at', { ascending: true });
        
      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error("error getting whisper", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchWhisper();
  }, [id]);

  const handleSendReply = async () => {
    if (!id || replyText.trim() === '' || isSending) return;
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          whisper_id: id,
          author: 'devanarayan', // Hardcoded for now
          content: replyText.trim(),
        }]);
      
      if (error) throw error;
      
      setReplyText('');
      fetchWhisper(); // Refresh comments instantly
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Could not post your reply.");
    } finally {
      setIsSending(false);
    }
  }

  const renderMainPost = () => {
    if (!post) return null;
    return (
      <View style={styles.mainPostContainer}>
        <View style={styles.postHeader}>
          <Text style={styles.authorText}>@{post.author}</Text>
        </View>

        <Text style={styles.postContent}>{post.content}</Text> 

        {/* rendering image whisper */}
        {post.type === "Image" && post.media_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.media_url }}
              style={styles.postImage}
              resizeMode='cover'
            />
          </View>
        )}
        
        {/* rendering audio whisper */}
        {post.type === "Audio" && post.media_url && (
        <AudioPlayerCard uri={post.media_url} />
      )}

        <View style={styles.divider} />
        <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}/>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.commentText}>Whisper not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView prevents the keyboard from covering the text input */}
      <KeyboardAvoidingView 
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Stack.Screen options={{
          headerTintColor: '#fff',
          headerTitle: "Whisper",
          headerStyle: { backgroundColor: '#000' },
        }}/>

        <FlatList
          data={comments}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderMainPost}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={{color: '#666', textAlign: 'center', marginTop: 20}}>Be the first to reply...</Text>
          }
          renderItem={({item}) => (
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>@{item.author}</Text>
              </View>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          )}
        />

        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            placeholderTextColor="#666"
            value={replyText}
            onChangeText={setReplyText}
            multiline
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendButton, (replyText.trim() === '' || isSending) && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={replyText.trim() === '' || isSending}
          >
            {isSending ? (
               <ActivityIndicator size="small" color="#000" />
            ) : (
               <Text style={styles.sendButtonText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainPostContainer: {
        padding: 20,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    authorText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    postContent: {
        color: '#efefef',
        fontSize: 18,
        lineHeight: 26,
        marginBottom: 15,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 15,
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: '#1a1a1a',
        marginVertical: 20,
    },
    commentsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    commentCard: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    commentAuthor: {
        color: '#a1a1a1',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentText: {
        color: '#ccc',
        fontSize: 15,
        lineHeight: 22,
    },
    replyContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 20 : 15,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    replyInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff', 
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginBottom: 2,
    },
    sendButtonDisabled: {
        backgroundColor: '#333',
    },
    sendButtonText: {
        color: '#000000',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
    playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    width: '100%',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  playButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playIcon: {
    fontSize: 18,
    color: '#000',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
});