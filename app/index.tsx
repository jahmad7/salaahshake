import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, useColorScheme, Dimensions, ViewStyle, TextStyle } from 'react-native';
import { PrayerTimes, Coordinates, CalculationMethod } from 'adhan';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { schedulePrayerNotifications } from '../utils/notifications';
import { colors, spacing, fontSize } from '../config/theme';
import { Accelerometer } from 'expo-sensors';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const SHAKE_THRESHOLD = 1.5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 32;
const DIAL_SIZE = SCREEN_WIDTH - (PADDING * 2);
const DIAL_RADIUS = (DIAL_SIZE / 2) * 0.85;
const CENTER_X = DIAL_SIZE / 2;
const CENTER_Y = DIAL_SIZE / 2;
const TEXT_OFFSET = 35;

type TextAnchorType = 'start' | 'middle' | 'end';

function calculateProgress(currentTime: Date, startTime: Date, endTime: Date): number {
  const total = endTime.getTime() - startTime.getTime();
  const current = currentTime.getTime() - startTime.getTime();
  return Math.max(0, Math.min(1, current / total));
}

function calculateArcPosition(progress: number) {
  // Convert progress (0-1) to angle (-180 to 0 degrees for day arc)
  const angle = -Math.PI + (progress * Math.PI);
  const x = CENTER_X + DIAL_RADIUS * Math.cos(angle);
  const y = CENTER_Y + DIAL_RADIUS * Math.sin(angle);
  return { x, y };
}

interface Styles {
  container: ViewStyle;
  dialContainer: ViewStyle;
  currentPrayer: TextStyle;
  timeRemaining: TextStyle;
  instruction: TextStyle;
  prayerList: ViewStyle;
  prayerItem: ViewStyle;
  prayerNameContainer: ViewStyle;
  prayerName: TextStyle;
  prayerTime: TextStyle;
  checkmark: TextStyle;
  instructionContainer: ViewStyle;
  missedContainer: ViewStyle;
  missedText: TextStyle;
  statusEmoji: TextStyle;
  statusIcon: TextStyle;
  header: ViewStyle;
  streakContainer: ViewStyle;
  streakEmoji: TextStyle;
  streakText: TextStyle;
  locationContainer: ViewStyle;
  locationText: TextStyle;
}

interface PrayerStatus {
  isCompleted: boolean;
  isCurrent: boolean;
  isMissed: boolean;
}

export default function Index() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    let subscription: any;

    const startAccelerometer = async () => {
      await Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(setData);
    };

    startAccelerometer();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    if (magnitude > SHAKE_THRESHOLD && currentPrayer && !completedPrayers.includes(currentPrayer)) {
      const newCompletedPrayers = [...completedPrayers, currentPrayer];
      setCompletedPrayers(newCompletedPrayers);
      const today = format(new Date(), 'yyyy-MM-dd');
      AsyncStorage.setItem(`prayers_${today}`, JSON.stringify(newCompletedPrayers));
      updateStreak(newCompletedPrayers);
    }
  }, [x, y, z, currentPrayer, completedPrayers]);

  useEffect(() => {
    (async () => {
      try {
        // Check if location permission is already granted
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        
        // Only request permission if not already granted
        if (existingStatus !== 'granted') {
          const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
          if (locationStatus !== 'granted') {
            // Handle permission denied case gracefully
            console.log('Location permission denied');
            // Use a default location or show an error state
            return;
          }
        }

        // Handle notifications permission similarly
        const { status: existingNotifStatus } = await Notifications.getPermissionsAsync();
        if (existingNotifStatus !== 'granted') {
          const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
          if (notificationStatus !== 'granted') {
            console.log('Notification permission denied');
            // Continue without notifications
          }
        }

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coordinates = new Coordinates(
            location.coords.latitude,
            location.coords.longitude
          );
          setLocation(coordinates);

          // Get location name using reverse geocoding
          const [geocodeResult] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (geocodeResult) {
            const locationString = geocodeResult.city || geocodeResult.region || geocodeResult.country;
            setLocationName(locationString || '');
          }
        } catch (locationError) {
          console.log('Error getting location:', locationError);
          // Use a default location as fallback
          const defaultCoordinates = new Coordinates(51.5074, -0.1278); // London as default
          setLocation(defaultCoordinates);
          setLocationName('London');
        }
      } catch (error) {
        console.log('Error in permission handling:', error);
        // Use default coordinates as fallback
        const defaultCoordinates = new Coordinates(51.5074, -0.1278);
        setLocation(defaultCoordinates);
        setLocationName('London');
      }
    })();
  }, []);

  useEffect(() => {
    if (location) {
      const date = new Date();
      const prayerTimes = new PrayerTimes(
        location,
        date,
        CalculationMethod.MuslimWorldLeague()
      );
      setPrayerTimes(prayerTimes);
      schedulePrayerNotifications(prayerTimes);
    }
  }, [location]);

  useEffect(() => {
    const updateCurrentPrayer = () => {
      if (!prayerTimes) return;

      const now = new Date();
      const prayers = PRAYER_NAMES.map(name => ({
        name,
        time: prayerTimes[name.toLowerCase() as keyof PrayerTimes],
      }));

      const currentPrayerInfo = prayers.find((prayer, index) => {
        const nextPrayer = prayers[index + 1];
        return (
          now >= prayer.time &&
          (!nextPrayer || now < nextPrayer.time)
        );
      });

      if (currentPrayerInfo) {
        setCurrentPrayer(currentPrayerInfo.name);
        const nextPrayerTime = prayers[(prayers.indexOf(currentPrayerInfo) + 1) % prayers.length].time;
        const timeLeft = (nextPrayerTime as Date).getTime() - now.getTime();
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    const interval = setInterval(updateCurrentPrayer, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  useEffect(() => {
    const loadCompletedPrayers = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const stored = await AsyncStorage.getItem(`prayers_${today}`);
      if (stored) {
        setCompletedPrayers(JSON.parse(stored));
      }
    };
    loadCompletedPrayers();
  }, []);

  const updateStreak = async (newCompletedPrayers: string[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    // Get yesterday's prayers
    const yesterdayPrayers = await AsyncStorage.getItem(`prayers_${yesterday}`);
    const yesterdayCompleted = yesterdayPrayers ? JSON.parse(yesterdayPrayers) : [];
    
    // Get current streak
    const currentStreak = await AsyncStorage.getItem('prayer_streak');
    let streakCount = currentStreak ? parseInt(currentStreak) : 0;
    
    // Add today's completed prayers to streak
    streakCount += newCompletedPrayers.length - completedPrayers.length;
    
    await AsyncStorage.setItem('prayer_streak', streakCount.toString());
    setStreak(streakCount);
  };

  useEffect(() => {
    const loadStreak = async () => {
      const currentStreak = await AsyncStorage.getItem('prayer_streak');
      if (currentStreak) {
        setStreak(parseInt(currentStreak));
      }
    };
    loadStreak();
  }, []);

  const getPrayerStatus = (prayer: string): PrayerStatus => {
    if (!prayerTimes) return { isCompleted: false, isCurrent: false, isMissed: false };
    
    const now = new Date();
    const prayerTime = prayerTimes[prayer.toLowerCase() as keyof PrayerTimes] as Date;
    const nextPrayerIndex = (PRAYER_NAMES.indexOf(prayer) + 1) % PRAYER_NAMES.length;
    const nextPrayerName = PRAYER_NAMES[nextPrayerIndex].toLowerCase() as keyof PrayerTimes;
    
    const nextPrayerTime = nextPrayerIndex === 0 
      ? new Date((prayerTimes.fajr as Date).getTime() + 24 * 60 * 60 * 1000)
      : prayerTimes[nextPrayerName] as Date;

    const isCompleted = completedPrayers.includes(prayer);
    const isCurrent = currentPrayer === prayer;
    const isMissed = !isCompleted && !isCurrent && now > nextPrayerTime;

    return { isCompleted, isCurrent, isMissed };
  };

  const renderSunDial = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const sunrise = prayerTimes.sunrise;
    const sunset = prayerTimes.maghrib;
    
    const arcPath = `M ${CENTER_X - DIAL_RADIUS} ${CENTER_Y} A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 1 1 ${CENTER_X + DIAL_RADIUS} ${CENTER_Y}`;

    // Calculate prayer positions
    const getPrayerPosition = (prayer: string) => {
      const prayerTime = prayerTimes[prayer.toLowerCase() as keyof PrayerTimes] as Date;
      let progress: number;

      // Get all prayer times for the day
      const fajr = prayerTimes.fajr;
      const sunrise = prayerTimes.sunrise;
      const dhuhr = prayerTimes.dhuhr;
      const asr = prayerTimes.asr;
      const maghrib = prayerTimes.maghrib;
      const isha = prayerTimes.isha;

      // Calculate total day duration (from Fajr to Isha)
      const totalDuration = isha.getTime() - fajr.getTime();

      // Calculate progress based on time difference from Fajr
      const timeFromFajr = prayerTime.getTime() - fajr.getTime();
      progress = timeFromFajr / totalDuration;

      // Ensure progress stays within 0-1 range
      progress = Math.max(0, Math.min(1, progress));

      let textAnchor: TextAnchorType = "middle";
      let dx = 0;
      let dy = TEXT_OFFSET;

      // Adjust text positioning based on calculated progress
      if (progress <= 0.1) { // Fajr
        textAnchor = "start";
        dx = -10;
        dy = TEXT_OFFSET + 5;
      } else if (progress >= 0.9) { // Isha
        textAnchor = "start";
        dx = -10;
        dy = TEXT_OFFSET + 5; // Match Fajr's vertical position
      } else if (progress >= 0.45 && progress <= 0.55) { // Dhuhr
        dy = TEXT_OFFSET - 10;
      }

      const position = calculateArcPosition(progress);
      return { position, textAnchor, dx, dy };
    };

    // Calculate sun position based on time between sunrise and sunset
    const calculateSunProgress = () => {
      const dhuhr = prayerTimes.dhuhr;
      const asr = prayerTimes.asr;

      // If before sunrise or after sunset, don't show sun
      if (now < sunrise || now > sunset) {
        return -1;
      }

      // Calculate progress within the current segment
      if (now < dhuhr) {
        // Sunrise to Dhuhr: 0 to 0.5
        return calculateProgress(now, sunrise, dhuhr) * 0.5;
      } else if (now < asr) {
        // Dhuhr to Asr: 0.5 to 0.75
        return 0.5 + (calculateProgress(now, dhuhr, asr) * 0.25);
      } else {
        // Asr to Maghrib: 0.75 to 0.95
        return 0.75 + (calculateProgress(now, asr, sunset) * 0.2);
      }
    };

    const sunProgress = calculateSunProgress();
    const sunPos = sunProgress >= 0 ? calculateArcPosition(sunProgress) : null;

    return (
      <View style={styles.dialContainer}>
        <Svg width={DIAL_SIZE} height={DIAL_SIZE / 2 + 60}>
          {/* Background arc */}
          <Path
            d={arcPath}
            stroke={theme.dialTrack}
            strokeWidth="4"
            fill="none"
          />
          {/* Progress arc */}
          <Path
            d={arcPath}
            stroke={theme.dialProgress}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${DIAL_RADIUS * Math.PI * (sunProgress >= 0 ? sunProgress : 0)}, ${DIAL_RADIUS * Math.PI}`}
          />
          {/* Prayer time markers */}
          {PRAYER_NAMES.map((prayer) => {
            const { position, textAnchor, dx, dy } = getPrayerPosition(prayer);
            const { isCompleted, isCurrent, isMissed } = getPrayerStatus(prayer);
            
            return (
              <G key={prayer}>
                <Circle
                  cx={position.x}
                  cy={position.y}
                  r={isCurrent ? 10 : 8}
                  fill={isCompleted ? theme.success : (isCurrent ? theme.primary : theme.textSecondary)}
                  opacity={isCurrent ? 1 : 0.8}
                />
                {isCompleted && (
                  <Circle
                    cx={position.x}
                    cy={position.y}
                    r="4"
                    fill={theme.background}
                  />
                )}
              </G>
            );
          })}
          {/* Sun indicator */}
          {sunPos && (
            <Circle
              cx={sunPos.x}
              cy={sunPos.y}
              r="16"
              fill={theme.sunFill}
            />
          )}
        </Svg>
      </View>
    );
  };

  if (!location || !prayerTimes) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.currentPrayer, { color: theme.text }]}>
            {currentPrayer}
          </Text>
          <Text style={[styles.timeRemaining, { color: theme.textSecondary }]}>
            {timeRemaining} remaining
          </Text>
          <View style={styles.locationContainer}>
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              📍 {locationName}
            </Text>
          </View>
        </View>
        <View style={[styles.streakContainer, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.streakEmoji]}>🌙</Text>
          <Text style={[styles.streakText, { color: theme.text }]}>
            {streak} {streak === 1 ? 'prayer' : 'prayers'}
          </Text>
        </View>
      </View>
      
      {renderSunDial()}
      
      <View style={[styles.instructionContainer, { backgroundColor: theme.primary + '15' }]}>
        {completedPrayers.includes(currentPrayer) ? (
          <Text style={[styles.instruction, { color: theme.success, fontWeight: 'bold' }]}>
            Prayer logged ✓
          </Text>
        ) : (
          <Text style={[styles.instruction, { color: theme.text, fontWeight: 'bold' }]}>
            Finished {currentPrayer}? Shake to track!  ✨
          </Text>
        )}
      </View>
      
      <View style={styles.prayerList}>
        {PRAYER_NAMES.map((prayer) => {
          const { isCompleted, isCurrent, isMissed } = getPrayerStatus(prayer);
          
          return (
            <View 
              key={prayer} 
              style={[
                styles.prayerItem, 
                { 
                  backgroundColor: isCurrent ? theme.primary + '15' : 'transparent',
                  borderRadius: 12,
                  marginBottom: spacing.sm,
                  borderWidth: isCompleted ? 2 : 0,
                  borderColor: isCompleted ? theme.success : 'transparent',
                }
              ]}
            >
              <View style={styles.prayerNameContainer}>
                <Text style={styles.statusIcon}>
                  {isCompleted ? '🕌' : (isMissed ? '😔' : '  ')}
                </Text>
                <Text style={[styles.prayerName, { 
                  color: theme.text,
                  fontWeight: isCurrent ? 'bold' : 'normal',
                }]}>
                  {prayer}
                </Text>
              </View>
              <Text style={[
                styles.prayerTime, 
                { 
                  color: isCurrent ? theme.primary : theme.textSecondary,
                  fontWeight: isCurrent ? 'bold' : 'normal',
                }
              ]}>
                {prayerTimes[prayer.toLowerCase() as keyof PrayerTimes]
                  ? format(prayerTimes[prayer.toLowerCase() as keyof PrayerTimes] as Date, 'h:mm a')
                  : '--:--'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: spacing.lg,
    paddingTop: 60,
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE / 2 + 60,
    marginVertical: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: PADDING / 2,
  },
  currentPrayer: {
    fontSize: fontSize.xxlarge,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  timeRemaining: {
    fontSize: fontSize.xlarge,
    marginBottom: spacing.xl,
  },
  instruction: {
    fontSize: fontSize.regular,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  prayerList: {
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  prayerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerName: {
    fontSize: fontSize.large,
    marginRight: spacing.sm,
  },
  prayerTime: {
    fontSize: fontSize.large,
  },
  checkmark: {
    fontSize: fontSize.large,
    marginLeft: spacing.sm,
  },
  instructionContainer: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  missedContainer: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  missedText: {
    fontSize: fontSize.small,
    fontStyle: 'italic',
  },
  statusEmoji: {
    fontSize: fontSize.large,
    marginLeft: spacing.sm,
  },
  statusIcon: {
    fontSize: fontSize.large,
    marginRight: spacing.sm,
    width: 30,
    textAlign: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
  },
  streakEmoji: {
    fontSize: fontSize.large,
    marginRight: spacing.xs,
  },
  streakText: {
    fontSize: fontSize.regular,
    fontWeight: 'bold',
  },
  locationContainer: {
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: fontSize.regular,
    opacity: 0.8,
  },
}); 