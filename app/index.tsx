import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, useColorScheme, Dimensions, ViewStyle, TextStyle } from 'react-native';
import { PrayerTimes, Coordinates, CalculationMethod } from 'adhan';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { schedulePrayerNotifications } from '../utils/notifications';
import { colors, spacing, fontSize } from '../config/theme';
import { Accelerometer } from 'expo-sensors';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const SHAKE_THRESHOLD = 1.5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 32;
const DIAL_SIZE = SCREEN_WIDTH - (PADDING * 2); // More padding for sides
const DIAL_RADIUS = (DIAL_SIZE / 2) * 0.85; // Slightly smaller radius to prevent cropping
const CENTER_X = DIAL_SIZE / 2;
const CENTER_Y = DIAL_SIZE / 2;
const TEXT_OFFSET = 35; // Increased text offset for better spacing

type TextAnchorType = 'start' | 'middle' | 'end';

function calculateProgress(currentTime: Date, startTime: Date, endTime: Date): number {
  const total = endTime.getTime() - startTime.getTime();
  const current = currentTime.getTime() - startTime.getTime();
  return Math.max(0, Math.min(1, current / total));
}

function calculateSunPosition(progress: number) {
  // Convert progress (0-1) to angle (-180 to 0 degrees for day arc)
  const angle = -Math.PI + (progress * Math.PI);
  const x = CENTER_X + DIAL_RADIUS * Math.cos(angle);
  const y = CENTER_Y + DIAL_RADIUS * Math.sin(angle);
  return { x, y };
}

interface StyleProps {
  container: any;
  dialContainer: any;
  currentPrayer: any;
  timeRemaining: any;
  instruction: any;
  prayerList: any;
  prayerItem: any;
  prayerNameContainer: any;
  prayerName: any;
  prayerTime: any;
  checkmark: any;
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
}

export default function Index() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });

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
    }
  }, [x, y, z, currentPrayer, completedPrayers]);

  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        return;
      }

      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coordinates = new Coordinates(
        location.coords.latitude,
        location.coords.longitude
      );
      setLocation(coordinates);
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

  const renderSunDial = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const sunrise = prayerTimes.sunrise;
    const sunset = prayerTimes.maghrib;
    const dayProgress = calculateProgress(now, sunrise, sunset);
    const sunPosition = calculateSunPosition(dayProgress);
    
    const arcPath = `M ${CENTER_X - DIAL_RADIUS} ${CENTER_Y} A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 1 1 ${CENTER_X + DIAL_RADIUS} ${CENTER_Y}`;

    // Calculate text angles for better positioning
    const getTextPosition = (progress: number, prayer: string) => {
      const position = calculateSunPosition(progress);
      let textAnchor: TextAnchorType = "middle";
      let dx = 0;
      let dy = TEXT_OFFSET;

      // Adjust text position based on prayer time
      if (prayer === 'Fajr' || prayer === 'Isha') {
        textAnchor = prayer === 'Fajr' ? "start" : "end";
        dx = prayer === 'Fajr' ? -20 : 20;
      } else if (prayer === 'Maghrib') {
        textAnchor = "end";
        dx = 15;
        dy = TEXT_OFFSET - 10;
      }

      return { position, textAnchor, dx, dy };
    };

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
            strokeDasharray={`${DIAL_RADIUS * Math.PI * dayProgress}, ${DIAL_RADIUS * Math.PI}`}
          />
          {/* Prayer time markers */}
          {PRAYER_NAMES.map((prayer) => {
            const prayerTime = prayerTimes[prayer.toLowerCase() as keyof PrayerTimes] as Date;
            const progress = calculateProgress(prayerTime, sunrise, sunset);
            const { position, textAnchor, dx, dy } = getTextPosition(progress, prayer);
            const isCompleted = completedPrayers.includes(prayer);
            const isCurrent = currentPrayer === prayer;
            
            return (
              <G key={prayer}>
                <Circle
                  cx={position.x}
                  cy={position.y}
                  r={isCurrent ? 10 : 8}
                  fill={isCompleted ? theme.success : (isCurrent ? theme.primary : theme.textSecondary)}
                  opacity={isCurrent ? 1 : 0.8}
                />
                <SvgText
                  x={position.x}
                  y={position.y + dy}
                  dx={dx}
                  fill={theme.text}
                  fontSize={14}
                  textAnchor={textAnchor}
                  fontWeight={isCurrent ? "bold" : "normal"}
                >
                  {prayer}
                </SvgText>
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
          <Circle
            cx={sunPosition.x}
            cy={sunPosition.y}
            r="16"
            fill={theme.sunFill}
          />
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
      <Text style={[styles.currentPrayer, { color: theme.text }]}>
        {currentPrayer}
      </Text>
      <Text style={[styles.timeRemaining, { color: theme.textSecondary }]}>
        {timeRemaining} remaining
      </Text>
      
      {renderSunDial()}
      
      <Text style={[styles.instruction, { color: theme.textSecondary }]}>
        {completedPrayers.includes(currentPrayer)
          ? '✓ Prayer completed'
          : '🤲 Shake when prayer is complete'}
      </Text>
      
      <View style={styles.prayerList}>
        {PRAYER_NAMES.map((prayer) => {
          const isCompleted = completedPrayers.includes(prayer);
          const isCurrent = currentPrayer === prayer;
          return (
            <View 
              key={prayer} 
              style={[
                styles.prayerItem, 
                { 
                  borderBottomColor: theme.border,
                  backgroundColor: isCurrent ? theme.primary + '15' : 'transparent',
                  borderRadius: 12,
                  marginBottom: spacing.sm,
                }
              ]}
            >
              <View style={styles.prayerNameContainer}>
                <Text style={[styles.prayerName, { 
                  color: theme.text,
                  fontWeight: isCurrent ? 'bold' : 'normal'
                }]}>
                  {prayer}
                </Text>
                {isCompleted && (
                  <Text style={[styles.checkmark, { color: theme.success }]}>✓</Text>
                )}
              </View>
              <Text style={[
                styles.prayerTime, 
                { 
                  color: isCurrent ? theme.primary : theme.textSecondary,
                  fontWeight: isCurrent ? 'bold' : 'normal'
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
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    overflow: 'hidden',
    textAlign: 'center',
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
    borderBottomWidth: 1,
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
}); 