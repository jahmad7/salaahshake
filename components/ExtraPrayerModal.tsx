import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize } from '../config/theme';

const EXTRA_PRAYER_MESSAGES = [
  {
    title: "Bonus Round! 🎯",
    message: "Already logged, but who's counting?",
    quote: "The Prophet ﷺ said: 'The best prayer after the obligatory prayers is the night prayer.'",
    encouragement: "Extra prayers hit different fr fr 💫"
  },
  {
    title: "Mashallah x2! ✨",
    message: "Going above and beyond like a true champion",
    quote: "The Prophet ﷺ said: 'Prayer is the key to Paradise.'",
    encouragement: "Stack those blessings bestie 🌟"
  },
  {
    title: "Level Up! 🚀",
    message: "Already prayed but you're not done yet?",
    quote: "The Prophet ﷺ said: 'Whoever draws near to Allah by the length of a hand, Allah draws near to them by the length of an arm.'",
    encouragement: "Your dedication is unmatched 💪"
  }
];

interface ExtraPrayerModalProps {
  isVisible: boolean;
  onClose: () => void;
  theme: typeof colors['dark'];
}

export function ExtraPrayerModal({ isVisible, onClose, theme }: ExtraPrayerModalProps) {
  const [currentMessage, setCurrentMessage] = useState(EXTRA_PRAYER_MESSAGES[0]);

  // Only update the message when the modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setCurrentMessage(
        EXTRA_PRAYER_MESSAGES[Math.floor(Math.random() * EXTRA_PRAYER_MESSAGES.length)]
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
              <Text style={styles.emoji}>✨</Text>
            </View>
            
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: theme.primary }]}>
                {currentMessage.title}
              </Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {currentMessage.message}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.quoteContainer, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.quote, { color: theme.text }]}>
                {currentMessage.quote}
              </Text>
            </View>

            <View style={[styles.encouragementContainer, { backgroundColor: theme.success + '15' }]}>
              <Text style={[styles.encouragement, { color: theme.success }]}>
                {currentMessage.encouragement}
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
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.regular,
    textAlign: 'center',
  },
  divider: {
    width: '40%',
    height: 2,
    borderRadius: 1,
    marginVertical: spacing.lg,
  },
  quoteContainer: {
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
    marginBottom: spacing.lg,
  },
  quote: {
    fontSize: fontSize.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  encouragementContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    width: '100%',
  },
  encouragement: {
    fontSize: fontSize.large,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 