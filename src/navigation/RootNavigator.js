// src/navigation/RootNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { theme } from '../screens/theme';
import AddEventScreen from '../screens/AddEventScreen';
import HomeScreen from '../screens/HomeScreen';
import MonthScreen from '../screens/MonthScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GodsScreen from '../screens/GodsScreen';
import SongsListScreen from '../screens/SongsListScreen';
import MiniPlayer from '../screens/MiniPlayer';

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
      <Stack.Screen name="ProfileScreen">
        {() => <ProfileScreen onSignOut={onSignOut} />}
      </Stack.Screen>
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GodsScreen" component={GodsScreen} />
      <Stack.Screen name="SongsList" component={SongsListScreen} />
      <Stack.Screen name="CommunityDetail" component={ExploreScreen} />
      <Stack.Screen name="GroupDetail" component={ExploreScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

{/* function SettingsStack({ onSignOut }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" options={{ title: 'Settings' }}>
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
} */}

const ICONS = {
  Today: 'moon', Month: 'calendar', Add: 'add-circle', 'My Events': 'list-circle', 'Settings': 'settings', "Profile": 'person-circle-outline'
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

      <Tab.Screen
        name="Profile"
        children={() => <ProfileStack onSignOut={onSignOut} />}
      />

    </Tab.Navigator>
  );
}

export default function RootNavigator({ onSignOut }) {
  return (
    <NavigationContainer>
      <>
        <Tabs onSignOut={onSignOut} />
        <MiniPlayer />
      </>
    </NavigationContainer>
  );
}
