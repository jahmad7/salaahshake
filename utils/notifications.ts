import * as Notifications from 'expo-notifications';
import { PrayerTimes } from 'adhan';

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

  for (const prayer of prayers) {
    const trigger = new Date(prayer.time);
    
    // Only schedule if the prayer time hasn't passed today
    if (trigger > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${prayer.name} Prayer`,
          body: 'Shake your phone after completing the prayer to log it.',
        },
        trigger,
      });
    }
  }
} 