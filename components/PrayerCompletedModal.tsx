import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { colors, spacing, fontSize } from '../config/theme';

interface PrayerCompletedModalProps {
  isVisible: boolean;
  onClose: () => void;
  prayerName: string;
  theme: typeof colors['dark'];
}

export function PrayerCompletedModal({ isVisible, onClose, prayerName, theme }: PrayerCompletedModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={styles.blurContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.background + 'F2' }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={[styles.emoji]}>🕌</Text>
            <Text style={[styles.prayerName, { color: theme.text }]}>
              {prayerName}
            </Text>
            <Text style={[styles.arabicPhrase, { color: theme.primary }]}>
              الحمد لله
            </Text>
            <Text style={[styles.transliteration, { color: theme.textSecondary }]}>
              Alhamdulillah
            </Text>
            <Text style={[styles.message, { color: theme.text }]}>
              May Allah accept your prayer
            </Text>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {format(new Date(), 'h:mm a')}
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.85,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  content: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  prayerName: {
    fontSize: fontSize.xxlarge,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  arabicPhrase: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  transliteration: {
    fontSize: fontSize.large,
    marginBottom: spacing.xl,
  },
  message: {
    fontSize: fontSize.large,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: fontSize.regular,
  },
}); 