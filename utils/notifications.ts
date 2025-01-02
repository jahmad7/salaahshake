import * as Notifications from 'expo-notifications';
import { PrayerTimes } from 'adhan';
import { format, addMinutes } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function schedulePrayerNotifications(prayerTimes: PrayerTimes) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  const messages = {
    Fajr: {
      title: "Fajr check ✨",
      body: "sleep is temporary, jannah is forever"
    },
    Dhuhr: {
      title: "Dhuhr time bestie 🤲",
      body: "lunch break = prayer break"
    },
    Asr: {
      title: "Asr loading... ⌛",
      body: "3pm slump? prayer pump"
    },
    Maghrib: {
      title: "Maghrib just dropped 🌙",
      body: "dinner can wait"
    },
    Isha: {
      title: "it's Isha o'clock 💫",
      body: "TikTok << prayer tok"
    }
  } as const;

  const currentStreak = await AsyncStorage.getItem('prayer_streak');
  const streak = currentStreak ? parseInt(currentStreak) : 0;

  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i];
    const trigger = new Date(prayer.time);
    const now = new Date();
    
    if (trigger > now) {
      // Schedule regular prayer notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: messages[prayer.name as keyof typeof messages].title,
          body: messages[prayer.name as keyof typeof messages].body,
        },
        trigger,
      });

      // Schedule streak reminder 30 minutes before next prayer
      const nextPrayer = prayers[(i + 1) % prayers.length];
      const reminderTime = addMinutes(trigger, nextPrayer ? 
        Math.floor((nextPrayer.time.getTime() - trigger.getTime()) * 0.8 / (1000 * 60)) : 90);

      if (reminderTime > now && streak > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🌙 Don't break your streak!",
            body: `${streak} streak - Pray ${prayer.name} soon!`,
          },
          trigger: reminderTime,
        });
      }
    }
  }
} 