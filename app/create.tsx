    import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";





    const AudioPlayerCard=({uri ,onDelete}:{uri : string, onDelete:()=>void}) => {
        const player=useAudioPlayer(uri);
        const status=useAudioPlayerStatus(player);
        const togglePlay=()=>{
            if (status.playing){
                player.pause();
            }else{
                if(status.currentTime>=status.duration && status.duration>0){
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


        return(
            <View style={styles.playerCard}>
                <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                    <Text style={styles.playIcon}>{player.playing? "⏸" : "▶️"}</Text>
                </TouchableOpacity>
                <View style={styles.waveformContainer}>
                    <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarFill,{width:`${progressPercent}%`}]} />

                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
                        <Text style={styles.timeText}>
                            {status.duration>0 ? formatTime(status.duration):"..."}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.trashButton} onPress={onDelete}>
                    <Text style={styles.trashIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>
        )
    }







    export default function Create() {


        const router=useRouter();

        const { type }=useLocalSearchParams();

        const[title,setTitle]=useState('');
        const[note,setNote]=useState('');

        const[selectedImage,setSelectedImage]=useState<string | null>(null);

        const[audioUri,setAudioUri]=useState<string | null>(null);
        const audioRecorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
        const recorderState=useAudioRecorderState(audioRecorder);



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


        const handleRecordToggle= async ()=>{
            if(recorderState.isRecording){
                await audioRecorder.stop();
                setAudioUri(audioRecorder.uri);
            }else{
                const permission = await AudioModule.requestRecordingPermissionsAsync();
                if(permission.granted){
                    await setAudioModeAsync({
                        allowsRecording:true,
                        playsInSilentMode : true
                    });
                    await audioRecorder.prepareToRecordAsync();
                    audioRecorder.record();
                }else{
                    console.log("Microphone no perms");
                }
            }
        };


        

        const handlePost=()=>{
            console.log(`Posting new ${type} Whisper: `, title, note, selectedImage, audioUri)
            router.back()
        }

        const isPostDisabled = title.trim().length===0 && note.trim().length===0 && !selectedImage && !audioUri;

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



                {type==="Audio"? (
                    <View style={styles.audioMainContainer}>
                        {audioUri? (
                            <AudioPlayerCard 
                            uri={audioUri}
                            onDelete={()=>setAudioUri(null)}
                            />
                        ):(
                            <TouchableOpacity onPress={handleRecordToggle}
                            style={[styles.recordButtonBase, recorderState.isRecording? styles.recordingActive : styles.recordingIdle]}
                            >
                                <Text style={styles.recordIcon}>
                                    {recorderState.isRecording? "⏹" : "🅡"}
                                </Text>
                                <Text style={styles.recordStatusText}>
                                    {recorderState.isRecording? "Recording..Tap to stop":"Tap to record"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                    </View>

                ) : (

                <TextInput
                    style={styles.noteInput}
                    placeholder="Note"
                    placeholderTextColor="#666"
                    multiline
                    autoFocus={type === 'Text' || !type}
                    value={note}
                    onChangeText={setNote}
                    textAlignVertical="top"
                />)}
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
            backgroundColor: '#111', 
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
        audioMainContainer: {
            marginTop: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        recordButtonBase: {
            width: 180,
            height: 180,
            borderRadius: 90,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 10,
        },
        recordingIdle: {
            backgroundColor: '#111', 
            borderColor: '#ffffff',
        },
        recordingActive: {
            backgroundColor: '#cb7d7d', 
            borderColor: '#ff4444',
        },
        recordIcon: {
            fontSize: 50,
            marginBottom: 10,
            color:'#fff'
        },
        recordStatusText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 14,
            textAlign: 'center',
            paddingHorizontal: 10,
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
            color: '#fff',
            marginLeft: 2, 
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
            backgroundColor: '#ffffff', // Your indigo brand color
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
        trashButton: {
            padding: 10,
            marginLeft: 10,
        },
        trashIcon: {
            fontSize: 22,
        },

    });