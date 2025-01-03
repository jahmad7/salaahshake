import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { colors, spacing, fontSize } from '../config/theme';

interface PrayerCompletedModalProps {
  isVisible: boolean;
  onClose: () => void;
  prayerName: string;
  theme: typeof colors['dark'];
}

const COMPLETION_MESSAGES = [
  "Mashallah! Every salah is a step closer to Jannah 🌟",
  "You just leveled up your Iman! Keep that streak going 💫",
  "Amazing work! Your prayer is lighting up the heavens ✨",
  "SubhanAllah! You're building your bridge to Paradise 🌈",
  "Your prayer is better than anything this dunya can offer 🎁",
  "The angels are celebrating your dedication rn! 👏",
  "You're making the Prophet ﷺ proud with every salah 💝",
  "This prayer might be the one that changes everything 🤲",
  "Your Iman gains are showing! Keep crushing it 💪",
  "Allah sees your dedication - and that's what matters most ❤️"
];

export function PrayerCompletedModal({ isVisible, onClose, prayerName, theme }: PrayerCompletedModalProps) {
  const [currentMessage, setCurrentMessage] = useState(COMPLETION_MESSAGES[0]);

  // Only update the message when the modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setCurrentMessage(
        COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
      );
    }
  }, [isVisible]);

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
            <View style={[styles.emojiContainer, { backgroundColor: theme.primary + '20' }]}>
              <Text style={styles.emoji}>🕌</Text>
            </View>
            
            <View style={styles.headerContainer}>
              <Text style={[styles.completedText, { color: theme.success }]}>
                Prayer Completed!
              </Text>
              <Text style={[styles.prayerName, { color: theme.primary }]}>
                {prayerName}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.arabicPhrase, { color: theme.primary }]}>
              الحمد لله
            </Text>
            <Text style={[styles.transliteration, { color: theme.textSecondary }]}>
              Alhamdulillah
            </Text>

            <View style={[styles.messageContainer, { backgroundColor: theme.success + '15' }]}>
              <Text style={[styles.message, { color: theme.text }]}>
                {currentMessage}
              </Text>
            </View>

            <View style={[styles.timeContainer, { backgroundColor: theme.background + '80' }]}>
              <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                {format(new Date(), 'h:mm a')}
              </Text>
            </View>
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
      height: 4
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
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
    width: '100%',
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 48,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completedText: {
    fontSize: fontSize.large,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  prayerName: {
    fontSize: fontSize.xxlarge,
    fontWeight: 'bold',
  },
  divider: {
    width: '40%',
    height: 2,
    borderRadius: 1,
    marginVertical: spacing.lg,
  },
  arabicPhrase: {
    fontSize: 40,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  transliteration: {
    fontSize: fontSize.large,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  messageContainer: {
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.large,
    textAlign: 'center',
    lineHeight: 24,
  },
  timeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  timestamp: {
    fontSize: fontSize.regular,
  },
}); 