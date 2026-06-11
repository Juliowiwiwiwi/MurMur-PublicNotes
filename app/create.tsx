import { decode } from 'base64-arraybuffer';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from '../supabase';





import { AudioPlayerCard } from './components/AudioPlayerCard';

export default function Create() {


    const router = useRouter();

    const { type, user } = useLocalSearchParams();

    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);



    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    useEffect(() => {
        if (type === 'Image') {
            pickImage()
        }
    }, [type]);


    const handleRecordToggle = async () => {
        if (recorderState.isRecording) {
            await audioRecorder.stop();
            setAudioUri(audioRecorder.uri);
        } else {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (permission.granted) {
                await setAudioModeAsync({
                    allowsRecording: true,
                    playsInSilentMode: true
                });
                await audioRecorder.prepareToRecordAsync();
                audioRecorder.record();
            } else {
                console.log("Microphone no perms");
            }
        }
    };




    const uploadMedia = async (uri: string, mediaType: 'Image' | 'Audio') => {
        const ext = mediaType === 'Image' ? 'jpg' : 'm4a';
        const filename = `${mediaType.toLowerCase()}_${Date.now()}.${ext}`;

        try {
            console.log(`Starting Supabase upload for ${filename}...`);
            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

            const anonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
            const localFile = new File(uri);
            const base64String = await localFile.base64();
            const arrayBuffer = decode(base64String);

            const { error } = await supabase.storage
                .from('media')
                .upload(filename, arrayBuffer, {
                    contentType: mediaType === 'Image' ? 'image/jpeg' : 'audio/m4a',
                });



            if (error) throw error;

            //ask Suparbase for the url strin
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filename);

            return publicUrl;

        } catch (err) {
            console.log("=== Supabase UPLOAD ERROR ===");
            console.log(err);
            throw err;
        }
    };

    const handlePost = async () => {
        if (isUploading) return;
        setIsUploading(true);

        try {
            let mediaUrl = null;
            if (selectedImage) {
                mediaUrl = await uploadMedia(selectedImage, 'Image');
            } else if (audioUri) {
                mediaUrl = await uploadMedia(audioUri, 'Audio');
            }
            const { error } = await supabase
                .from('whispers')
                .insert([
                    {
                        title: title.trim(),
                        content: note.trim(),
                        type: type,
                        media_url: mediaUrl,
                        author: user as string
                    }
                ]);

            if (error) throw error;
            console.log("Upload Successful");
            setIsUploading(false);
            router.back();

        } catch (error) {
            console.error("Upload failed: ", error);
            Alert.alert("Error", "Failed to upload whisper. Try again. :(");
            console.log(JSON.stringify(error, null, 2));
            setIsUploading(false);
        }
    };
    const isPostDisabled = (title.trim().length === 0 && note.trim().length === 0 && !selectedImage && !audioUri) || isUploading;




    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >

            <Stack.Screen
                options={{
                    headerTitle: `Add ${type} Whisper`,
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: 'white',
                    headerRight: () => (
                        <TouchableOpacity onPress={handlePost} disabled={isPostDisabled}>
                            {isUploading ? (
                                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                            ) : (
                                <Text style={[styles.postButton, isPostDisabled && styles.postButtonDisabled]}>Post</Text>
                            )
                            }
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
                        <Image source={{ uri: selectedImage }}
                            style={styles.imagePreview} />
                        <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
                            <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {(!selectedImage && type === 'Image') && (
                    <TouchableOpacity style={styles.dashedPlaceholder} onPress={pickImage}>
                        <Text style={styles.placeholderIcon}>🖼️</Text>
                        <Text style={styles.placeholderText}>Tap to add image</Text>
                    </TouchableOpacity>
                )}



                {type === "Audio" ? (
                    <View style={styles.audioMainContainer}>
                        {audioUri ? (
                            <AudioPlayerCard
                                uri={audioUri}
                                onDelete={() => setAudioUri(null)}
                            />
                        ) : (
                            <TouchableOpacity onPress={handleRecordToggle}
                                style={[styles.recordButtonBase, recorderState.isRecording ? styles.recordingActive : styles.recordingIdle]}
                            >
                                <Text style={styles.recordIcon}>
                                    {recorderState.isRecording ? "⏹" : "🅡"}
                                </Text>
                                <Text style={styles.recordStatusText}>
                                    {recorderState.isRecording ? "Recording..Tap to stop" : "Tap to record"}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    noteInput: {
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
        color: '#fff'
    },
    recordStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
});
