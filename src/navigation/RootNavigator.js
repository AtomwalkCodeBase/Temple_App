// src/navigation/RootNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../screens/theme';
import AddEventScreen from '../screens/AddEventScreen';
import HomeScreen from '../screens/HomeScreen';
import MonthScreen from '../screens/MonthScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function MyEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyEventsScreen" component={MyEventsScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function MonthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MonthScreen" component={MonthScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack({ onSignOut }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="MonthScreen" component={MonthScreen} /> */}
      <Stack.Screen name="Settings" options={{ title: 'Settings' }}>
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const ICONS = {
  Today: 'moon', Month: 'calendar', Add: 'add-circle', 'My Events': 'person', 'Settings': 'settings'
};

function Tabs({ onSignOut }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Today"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Today', { screen: 'HomeScreen' });
          },
        })}
      />
      <Tab.Screen
        name="Month"
        component={MonthStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Month', { screen: 'MonthScreen' });
          },
        })}
      />
      <Tab.Screen
        name="Add"
        component={AddEventScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Add', { editUserEvent: null, trackCode: null, trackName: null, trackDate: null });
          },
        })}
      />
      <Tab.Screen
        name="My Events"
        component={MyEventsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('My Events', { screen: 'MyEventsScreen' });
          },
        })}
      />

      {/* <Tab.Screen
        name="Profile"
        component={ProfileStack}
        initialParams={{ onSignOut }}
      /> */}
      <Tab.Screen
        name="Settings"
        children={() => <ProfileStack onSignOut={onSignOut} />}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator({ onSignOut }) {
  return (
    <NavigationContainer>
      <Tabs onSignOut={onSignOut} />
    </NavigationContainer>
  );
}
