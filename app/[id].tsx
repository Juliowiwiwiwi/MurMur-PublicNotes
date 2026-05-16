import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ID() {

  const id =useLocalSearchParams();
  const[replyText,setReplyText]=useState('');

  const mockPost = {
        id: id,
        author: 'lyra_notes',
        time: '45m ago',
        content: "Caught this view while thinking about the new app design. It's coming together nicely!",
        type: 'Image', 
        imageUrl: 'https://images3.memedroid.com/images/UPLOADED274/58ccc9a89e2ca.jpeg',
    };

  const mockComments = [
        { id: 'c1', author: 'pixel_poet', text: 'This looks incredibly peaceful.', time: '30m ago' },
        { id: 'c2', author: 'devanarayan', text: 'The UI is looking sharp so far!', time: '15m ago' },
        { id: 'c3', author: 'juliocodes', text: 'What stack are you using for the backend?', time: '2m ago' },
    ];

  const handleSendReply=()=>{
    console.log("Sending relpy:", replyText);
    setReplyText('');//cleanup after sending
  };


  const renderMainPost=()=>(
    <View style={styles.mainPostContainer}>

      <View style={styles.postHeader}>
        <Text style={styles.authorText}>@{mockPost.author}</Text>
        <Text style={styles.timeText}>@{mockPost.time}</Text>
      </View>

      <Text style={styles.postContent} >{mockPost.content}</Text> 

      {mockPost.type==="Image" && mockPost.imageUrl &&(
        <View style={styles.imageContainer}>
          <Image
          source={{uri:mockPost.imageUrl}}
          style={styles.postImage} resizeMode='contain'/>
        </View>
      )}
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>Comments({mockComments.length})</Text>
    </View>
  );



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex:1}}
        behavior={Platform.OS==="ios"? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS==="ios"? 90: 0}>


          <Stack.Screen options={{
            headerTintColor:'#fff',
            headerTitle:"Whisper",
            headerStyle:{backgroundColor:'#000'},
          }}/>


          <FlatList
            data={mockComments}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item)=>item.id}
            ListHeaderComponent={renderMainPost}
            contentContainerStyle={{paddingBottom:30}}
            renderItem={({item})=>(
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>@{item.author}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            )}
          />

          
          <View style={styles.replyContainer}>
            <TextInput 
              style={styles.replyInput}
              placeholder='Reply to this Whisper'
              placeholderTextColor='#666'
              value={replyText}
              onChangeText={setReplyText}
              multiline
              scrollEnabled={true}
              textAlignVertical="center"
            />
            <TouchableOpacity 
              style={[styles.sendButton, replyText.trim().length === 0 && styles.sendButtonDisabled]}
              onPress={handleSendReply}
            >
              <Text style={styles.sendButtonText}>↑</Text>
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
    timeText: {
        color: '#666',
        fontSize: 12,
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
        paddingTop:15,
        paddingBottom:Platform.OS==='ios'? 20 : 15,
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
    }
});