import dayjs from 'dayjs';

export const EVENT_TYPES = [
    { key: 'PUJA', label: 'Puja' },
    { key: 'BRATA', label: 'Brata' },
    { key: 'FAMILY', label: 'Family' },
    { key: 'TEMPLE_VISIT', label: 'Temple visit' },
    { key: 'OTHER', label: 'Other' },
];

export const REMINDER_OPTIONS = [
    { minutes: 0, label: 'On the day (morning)' },
    { minutes: 1440, label: '1 day before' },
    { minutes: 4320, label: '3 days before' },
    { minutes: 21600, label: '15 days before' }
];

export const SHARE_TEMPLATES = [
    {
        id: 'classic',
        name: 'Theme 1',
        image: require('../assets/share/invitation_1.png'),
    },
    {
        id: 'festive',
        name: 'Theme 2',
        image: require('../assets/share/invitation_2.png'),
    },
    {
        id: 'traditional',
        name: 'Theme 3',
        image: require('../assets/share/invitation_3.png'),
    },
    {
        id: 'invitation_4',
        name: 'Theme 4',
        image: require('../assets/share/invitation_4.png'),
    },
    {
        id: 'invitation_5',
        name: 'Theme 5',
        image: require('../assets/share/invitation_5.png'),
    },
    {
        id: 'invitation_6',
        name: 'Theme 6',
        image: require('../assets/share/invitation_6.png'),
    },
    {
        id: 'invitation_7',
        name: 'Theme 7',
        image: require('../assets/share/invitation_7.png'),
    },
    {
        id: 'invitation_8',
        name: 'Theme 8',
        image: require('../assets/share/invitation_8.png'),
    },
    {
        id: 'invitation_9',
        name: 'Theme 9',
        image: require('../assets/share/invitation_9.png'),
    },
    {
        id: 'invitation_10',
        name: 'Theme 10',
        image: require('../assets/share/invitation_10.png'),
    },
];

export const MESSAGE_STYLES = [
    {
        id: 'traditional',
        label: '🙏 Traditional',
        text: (event) =>
            `🙏 You are warmly invited to join us for ${event.title}.\n\n` +
            `${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
            (event.start_time
                ? ` at ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}`
                : '') +
            `\n\nYour presence and blessings would make this occasion special.\n\n` +
            `With warm regards` +
            `\n\nShared from Agam Mandira`,
    },

    {
        id: 'warm',
        label: '❤️ Warm',
        text: (event) =>
            `❤️ We would love to have you with us for ${event.title}!\n\n` +
            `Date: ${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
            (event.start_time
                ? `\nTime: ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}`
                : '') +
            `\n\nLooking forward to celebrating this special occasion together!` +
            `\n\nShared from Agam Mandira`
    },

    {
        id: 'festive',
        label: '🎉 Festive',
        text: (event) =>
            `🎉 It's time to celebrate!\n\n` +
            `Join us for ${event.title} 🎊\n\n` +
            `${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
            (event.start_time
                ? ` · ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}`
                : '') +
            `\n\nWe'd be delighted to celebrate together! 🙏` +
            `\n\nShared from Agam Mandira`
    },

    {
        id: 'simple',
        label: 'Simple',
        text: (event) =>
            `You're invited to ${event.title}.\n\n` +
            `${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
            (event.start_time
                ? ` at ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}`
                : '') +
            `\n\nHope to see you there!` +
            `\n\nShared from Agam Mandira`
    },
];