// src/constants/eventTypes.js
// Central place defining all event categories the data model supports.
// Only 'festival' and 'personal' are wired to creation UI in v1; the rest
// exist so future features (puja booking, seva, community) slot in without
// touching the calendar/day/event-card components.
import { colors } from './colors';

export const EVENT_TYPES = {
  FESTIVAL: 'festival',
  TEMPLE_EVENT: 'temple_event',
  PUJA: 'puja',
  SEVA: 'seva',
  PERSONAL: 'personal',
  REMINDER: 'reminder',
  COMMUNITY: 'community',
  BOOKING: 'booking',
};

export const EVENT_TYPE_LABEL = {
  [EVENT_TYPES.FESTIVAL]: 'Festival',
  [EVENT_TYPES.TEMPLE_EVENT]: 'Temple Event',
  [EVENT_TYPES.PUJA]: 'Puja',
  [EVENT_TYPES.SEVA]: 'Seva',
  [EVENT_TYPES.PERSONAL]: 'Personal',
  [EVENT_TYPES.REMINDER]: 'Reminder',
  [EVENT_TYPES.COMMUNITY]: 'Community',
  [EVENT_TYPES.BOOKING]: 'Booking',
};

// Color-independent accessibility: dots are paired with icon + text label
// wherever an event is shown in detail (see EventCard). Dots on the grid
// are a secondary/glanceable signal only.
export const EVENT_TYPE_COLOR = {
  [EVENT_TYPES.FESTIVAL]: colors.accentGold,
  [EVENT_TYPES.TEMPLE_EVENT]: colors.secondary,
  [EVENT_TYPES.PUJA]: colors.primary,
  [EVENT_TYPES.SEVA]: colors.sage,
  [EVENT_TYPES.PERSONAL]: colors.primary,
  [EVENT_TYPES.REMINDER]: colors.textSecondary,
  [EVENT_TYPES.COMMUNITY]: colors.secondary,
  [EVENT_TYPES.BOOKING]: colors.sage,
};

// lucide-react-native icon names (see components/EventCard.js)
export const EVENT_TYPE_ICON = {
  [EVENT_TYPES.FESTIVAL]: 'Sparkles',
  [EVENT_TYPES.TEMPLE_EVENT]: 'Landmark',
  [EVENT_TYPES.PUJA]: 'Flame',
  [EVENT_TYPES.SEVA]: 'HandHeart',
  [EVENT_TYPES.PERSONAL]: 'Cake',
  [EVENT_TYPES.REMINDER]: 'Bell',
  [EVENT_TYPES.COMMUNITY]: 'Users',
  [EVENT_TYPES.BOOKING]: 'CalendarCheck',
};
