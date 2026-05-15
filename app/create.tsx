import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Create() {


    const router=useRouter();

    const { type }=useLocalSearchParams();

    const[title,setTitle]=useState('');
    const[note,setNote]=useState('');
    const[selectedImage,setSelectedImage]=useState<string | null>(null);

    const pickImage= async () => {
        let result= await ImagePicker.launchImageLibraryAsync({
            mediaTypes:['images'],
            allowsEditing:true,
            quality:0.8,
        });

        if(!result.canceled){
            setSelectedImage(result.assets[0].uri);
        }
    };

    useEffect(()=>{
        if(type==='Image'){
            pickImage()
        }
    },[type]);

    

    const handlePost=()=>{
        console.log(`Posting new ${type} Whisper: `, title, note)
        router.back()
    }

    const isPostDisabled = title.trim().length===0 && note.trim().length===0 && !selectedImage;

  return (
    <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS==="ios"? "padding" : "height"}
    >

        <Stack.Screen
        options={{
            headerTitle:`Add ${type} Whisper`,
            headerStyle:{backgroundColor:'#000'},
            headerTintColor:'white',
            headerRight:()=>(
                <TouchableOpacity onPress={handlePost} disabled={isPostDisabled}>
                    <Text style={[styles.postButton, isPostDisabled && styles.postButtonDisabled]}>Post</Text>
                </TouchableOpacity>
            )
        }} />

        <ScrollView style={styles.editor}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}>

            <TextInput
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
            />


            {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{uri:selectedImage}}
                        style={styles.imagePreview} />
                    <TouchableOpacity onPress={()=> setSelectedImage(null)} style={styles.removeImageButton}>
                        <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
            {(!selectedImage && type==='Image') &&(
                <TouchableOpacity style={styles.dashedPlaceholder} onPress={pickImage}>
                    <Text style={styles.placeholderIcon}>🖼️</Text>
                    <Text style={styles.placeholderText}>Tap to add image</Text>
                </TouchableOpacity>
            )}


            <TextInput
                style={styles.noteInput}
                placeholder={type==='Audio'? "Audio note attached" : "Note"}
                placeholderTextColor="#666"
                multiline
                autoFocus={type === 'Text' || !type}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
            />
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:'#000',
    },
    postButton: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    postButtonDisabled: {
        color: '#333', 
    },
    editor: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 10,
    },
    titleInput: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'normal',
        marginBottom: 15,
    },
    noteInput:{
        flex: 1,
        color: '#efefef',
        fontSize: 18,
        lineHeight: 28,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 15,
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dashedPlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        backgroundColor: '#111', // Slightly lighter than the background to pop
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    placeholderIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    placeholderText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },

});