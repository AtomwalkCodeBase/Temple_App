// context/PlayerContext.js — single source of truth for what's playing,
// shared between SongsListScreen (tap to play) and MiniPlayer (controls).
import React, {
    createContext, useContext, useState, useRef, useCallback, useEffect,
} from 'react';
import { Audio } from 'expo-av';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
    const [current, setCurrent] = useState(null);   // the song object
    const [queue, setQueue] = useState([]);          // sibling songs, for next()
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);     // 0..1
    const soundRef = useRef(null);

    useEffect(() => {
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
        });
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    const onStatusUpdate = useCallback((status) => {
        if (!status.isLoaded) return;
        setPlaying(status.isPlaying);
        if (status.durationMillis) {
            setProgress(status.positionMillis / status.durationMillis);
        }
        if (status.didJustFinish) {
            next();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const play = useCallback(async (song, siblingSongs = []) => {
        if (siblingSongs.length) setQueue(siblingSongs);

        // Same song tapped again → just toggle
        if (current?.id === song.id && soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status.isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
            return;
        }

        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }

        setCurrent(song);
        setProgress(0);

        if (!song.url) {
            // Dummy data with no real audio file — reflect selection in UI only.
            console.warn(`No audio url for "${song.title}" — playback skipped.`);
            setPlaying(false);
            return;
        }

        const { sound } = await Audio.Sound.createAsync(
            { uri: song.url },
            { shouldPlay: true },
            onStatusUpdate
        );
        soundRef.current = sound;
    }, [current, onStatusUpdate]);

    const close = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setCurrent(null);
        setQueue([]);
        setPlaying(false);
        setProgress(0);
    }, []);

    const toggle = useCallback(async () => {
        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();
        if (status.isPlaying) {
            await soundRef.current.pauseAsync();
        } else {
            await soundRef.current.playAsync();
        }
    }, []);

    const next = useCallback(() => {
        if (!current || queue.length === 0) return;
        const idx = queue.findIndex((s) => s.id === current.id);
        const nextSong = queue[(idx + 1) % queue.length];
        if (nextSong) play(nextSong, queue);
    }, [current, queue, play]);

    return (
        <PlayerContext.Provider value={{ current, playing, progress, play, toggle, next, close }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
    return ctx;
}