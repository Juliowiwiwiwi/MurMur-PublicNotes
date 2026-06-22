import { supabase } from '@/supabase';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { getRelativeTime } from './utils/time';


export default function ID() {

  const { id, user } = useLocalSearchParams();
  const router = useRouter();
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  const fetchWhisper = useCallback(async () => {
    if (!id) return;
    try {
      const { data: postData, error: postError } = await supabase
        .from('whispers')
        .select('*, profiles(avatar_url)')
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
  }, [id]);

  useEffect(() => {
    if (id) fetchWhisper();
  }, [id, fetchWhisper]);

  const handleSendReply = async () => {
    if (!id || replyText.trim() === '' || isSending) return;
    setIsSending(true);
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
          Alert.alert("Authentication Error", "You must be logged in to reply.");
          setIsSending(false);
          return;
      }

      const { error } = await supabase
        .from('comments')
        .insert([{
          whisper_id: id,
          author: currentUser.user_metadata.username,
          user_id: currentUser.id,
          content: replyText.trim(),
          parent_comment_id: replyingTo ? replyingTo.id : null,
        }]);

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      fetchWhisper(); // Refresh comments instantly
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Could not post your reply.");
    } finally {
      setIsSending(false);
    }
  }

  const handleDeletePost = () => {
    Alert.alert("Delete Whisper", "Are you sure you want to delete this whisper?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            setIsLoading(true);
            if (post.media_url) {
              const fileName = post.media_url.split('/').pop();
              if (fileName) {
                await supabase.storage.from('media').remove([fileName]);
              }
            }
            const { error } = await supabase.from('whispers').delete().eq('id', id);
            if (error) throw error;
            router.back();
          } catch (e) {
            console.error("Error deleting post", e);
            Alert.alert("Error", "Could not delete post.");
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;
            fetchWhisper();
          } catch (e) {
            console.error("Error deleting comment", e);
            Alert.alert("Error", "Could not delete comment.");
          }
        }
      }
    ]);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel = comments.filter(c => !c.parent_comment_id);
    const replies = comments.reduce((acc, comment) => {
      if (comment.parent_comment_id) {
        if (!acc[comment.parent_comment_id]) acc[comment.parent_comment_id] = [];
        acc[comment.parent_comment_id].push(comment);
      }
      return acc;
    }, {} as Record<string, any[]>);
    return { topLevelComments: topLevel, repliesByParent: replies };
  }, [comments]);

  const renderMainPost = () => {
    if (!post) return null;
    return (
      <View style={styles.mainPostContainer}>
        <View style={styles.postHeader}>
          <Text style={styles.authorText}>@{post.author}</Text>
          {user === post.author && (
            <TouchableOpacity onPress={handleDeletePost}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>


        {post.type !== "Audio" && post.title ? (
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{post.title}</Text>
        ) : null}

        <Text style={styles.postContent}>{post.content}</Text>

        {/* the image whisper */}
        {post.type === "Image" && post.media_url && (
          <View style={styles.imageContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsImageFullscreen(true)}>
              <Image
                source={{ uri: post.media_url }}
                style={styles.postImage}
                resizeMode='cover'
              />
            </TouchableOpacity>
          </View>
        )}

        {/* teh audio whisper */}
        {post.type === "Audio" && post.media_url && (
          <AudioPlayerCard uri={post.media_url} title={post.title} author={post.author} avatarUrl={post.profiles?.avatar_url} />
        )}

        <View style={styles.divider} />
        <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Stack.Screen options={{
          headerTintColor: '#fff',
          headerTitle: "Whisper",
          headerStyle: { backgroundColor: '#000' },
        }} />

        <FlatList
          data={topLevelComments}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderMainPost}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>Be the first to reply...</Text>
          }
          renderItem={({ item }) => {
            const commentReplies = repliesByParent[item.id] || [];
            const isExpanded = expandedComments[item.id];

            return (
              <View style={styles.commentThread}>
                <View style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthorRow}>
                      <Text style={styles.commentAuthor}>@{item.author}</Text>
                      <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
                    </View>
                    {user === item.author && (
                      <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>

                  <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => setReplyingTo({ id: item.id, author: item.author })}>
                      <Text style={styles.actionText}>Reply</Text>
                    </TouchableOpacity>
                    {commentReplies.length > 0 && (
                      <TouchableOpacity onPress={() => toggleReplies(item.id)}>
                        <Text style={styles.actionText}>
                          {isExpanded ? "Hide Replies" : `Show Replies (${commentReplies.length})`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {isExpanded && commentReplies.map(reply => (
                  <View key={reply.id} style={styles.replyCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthor}>@{reply.author}</Text>
                        <Text style={styles.timeText}>{getRelativeTime(reply.created_at)}</Text>
                      </View>
                      {user === reply.author && (
                        <TouchableOpacity onPress={() => handleDeleteComment(reply.id)}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{reply.content}</Text>
                  </View>
                ))}
              </View>
            );
          }}
        />

        <View style={styles.replyContainerWrapper}>
          {replyingTo && (
            <View style={styles.replyingToBanner}>
              <Text style={styles.replyingToText}>Replying to @{replyingTo.author}</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReplyText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
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
        </View>

      </KeyboardAvoidingView>

      <Modal visible={isImageFullscreen} transparent={true} animationType="fade" onRequestClose={() => setIsImageFullscreen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }} activeOpacity={1} onPress={() => setIsImageFullscreen(false)}>
          {post?.media_url && (
            <Image
              source={{ uri: post.media_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>

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
  commentThread: {
    marginBottom: 20,
  },
  commentCard: {
    paddingHorizontal: 20,
  },
  replyCard: {
    paddingRight: 20,
    paddingLeft: 40,
    paddingTop: 15,
    marginTop: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#333',
    marginLeft: 20,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthor: {
    color: '#a1a1a1',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  commentText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 15,
  },
  replyContainerWrapper: {
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  replyingToBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  replyingToText: {
    color: '#a1a1a1',
    fontSize: 13,
  },
  cancelReplyText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: 'bold',
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
  deleteText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
});