import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize } from '../config/theme';

interface ExtraPrayerModalProps {
  isVisible: boolean;
  onClose: () => void;
  theme: typeof colors['dark'];
}

export function ExtraPrayerModal({ isVisible, onClose, theme }: ExtraPrayerModalProps) {
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
            <Text style={[styles.emoji]}>✨</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Already Logged!
            </Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              But remember what the Prophet ﷺ said:
            </Text>
            <Text style={[styles.quote, { color: theme.primary }]}>
              "The best prayer after the prescribed ones is the night prayer."
            </Text>
            <Text style={[styles.encouragement, { color: theme.text }]}>
              Extra prayers = extra blessings 🌟
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
  title: {
    fontSize: fontSize.xxlarge,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.regular,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  quote: {
    fontSize: fontSize.large,
    fontWeight: '600',
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.xl,
  },
  encouragement: {
    fontSize: fontSize.large,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 