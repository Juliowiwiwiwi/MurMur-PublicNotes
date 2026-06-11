import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const AudioPlayerCard = ({ uri, title, author, avatarUrl, onDelete }: { uri: string, title?: string, author?: string, avatarUrl?: string | null, onDelete?: () => void }) => {
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
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarPlaceholder} />
      ) : (
        <View style={[styles.avatarPlaceholder, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
            {author ? author.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}

      <View style={styles.playerContent}>
        {(title || author) && (
          <View style={styles.headerInfo}>
            {title ? <Text style={styles.titleText}>{title}</Text> : null}
            {author ? <Text style={styles.authorText}>@{author}</Text> : null}
          </View>
        )}

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            <Ionicons name={status.playing ? "pause" : "play"} size={18} color="#000" />
          </TouchableOpacity>

          <Text style={styles.timeText}>
            {formatTime(status.currentTime)} / {status.duration > 0 ? formatTime(status.duration) : "--:--"}
          </Text>

          {onDelete && (
            <TouchableOpacity style={styles.trashButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    marginRight: 15,
  },
  playerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerInfo: {
    marginBottom: 12,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  authorText: {
    color: '#a1a1a1',
    fontSize: 13,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    color: '#a1a1a1',
    fontSize: 12,
    flex: 1,
  },
  trashButton: {
    padding: 5,
    marginLeft: 10,
  },
});
