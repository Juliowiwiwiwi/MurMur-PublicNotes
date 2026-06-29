import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';

interface LikeButtonProps {
    whisperId: string;
    initialLikeCount: number;
    initialIsLiked: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ whisperId, initialLikeCount, initialIsLiked }) => {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setIsLiked(initialIsLiked);
        setLikeCount(initialLikeCount);
    }, [initialIsLiked, initialLikeCount]);

    const handleToggleLike = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setIsProcessing(false);
            return; 
        }

        const currentUserId = session.user.id;

        // Animation
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 50, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
        ]).start();

        // Optimistic update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            if (!isLiked) {
                const { error } = await supabase.from('likes').insert({
                    user_id: currentUserId,
                    whisper_id: whisperId
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.from('likes').delete().match({
                    user_id: currentUserId,
                    whisper_id: whisperId
                });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            setIsLiked(isLiked);
            setLikeCount(isLiked ? likeCount : likeCount); 
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handleToggleLike} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isLiked ? "#ffffff" : "#a1a1a1"} 
                />
            </Animated.View>
            {likeCount > 0 && (
                <Text style={[styles.countText, isLiked && styles.textLiked]}>
                    {likeCount}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    countText: {
        fontSize: 15,
        color: '#a1a1a1',
        fontWeight: '600',
        marginLeft: 6,
    },
    textLiked: {
        color: '#ffffff',
    }
});
