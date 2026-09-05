// context/PlayerContext.js — single source of truth for what's playing,
// shared between SongsListScreen (tap to play) and MiniPlayer (controls).

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, } from 'react';

import { Audio, setAudioModeAsync } from "expo-audio";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
    const [current, setCurrent] = useState(null);   // the song object
    const [queue, setQueue] = useState([]);          // sibling songs, for next()
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);     // 0..1

    const playerRef = useRef(null);

    useEffect(() => {
        // Configure audio for background playback.
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
        }).catch((error) => {
            console.warn('Failed to configure audio mode:', error);
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.remove();
                playerRef.current = null;
            }
        };
    }, []);

    const onStatusUpdate = useCallback((status) => {
        setPlaying(status.playing);

        if (status.duration > 0) {
            setProgress(status.currentTime / status.duration);
        } else {
            setProgress(0);
        }

        if (status.didJustFinish) {
            next();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const play = useCallback(async (song, siblingSongs = []) => {
        if (siblingSongs.length) {
            setQueue(siblingSongs);
        }

        // Same song tapped again → just toggle.
        if (current?.id === song.id && playerRef.current) {
            if (playerRef.current.playing) {
                playerRef.current.pause();
            } else {
                playerRef.current.play();
            }

            return;
        }

        // Remove the previous player.
        if (playerRef.current) {
            playerRef.current.remove();
            playerRef.current = null;
        }

        setCurrent(song);
        setProgress(0);
        setPlaying(false);

        if (!song.url) {
            // Dummy data with no real audio file — reflect selection in UI only.
            console.warn(
                `No audio url for "${song.title}" — playback skipped.`
            );
            return;
        }

        try {
            const player = Audio.createAudioPlayer({ uri: song.url });
            playerRef.current = player;
            player.addListener('playbackStatusUpdate', onStatusUpdate);
            player.play();
        } catch (error) {
            console.error(`Failed to play "${song.title}":`, error);
            playerRef.current = null;
            setPlaying(false);
        }
    }, [current, onStatusUpdate]);

    const close = useCallback(async () => {
        if (playerRef.current) {
            playerRef.current.remove();
            playerRef.current = null;
        }

        setCurrent(null);
        setQueue([]);
        setPlaying(false);
        setProgress(0);
    }, []);

    const toggle = useCallback(async () => {
        if (!playerRef.current) return;

        if (playerRef.current.playing) {
            playerRef.current.pause();
        } else {
            playerRef.current.play();
        }
    }, []);

    const next = useCallback(() => {
        if (!current || queue.length === 0) return;

        const idx = queue.findIndex((s) => s.id === current.id);
        const nextSong = queue[(idx + 1) % queue.length];

        if (nextSong) {
            play(nextSong, queue);
        }
    }, [current, queue, play]);

    return (
        <PlayerContext.Provider value={{ current, playing, progress, play, toggle, next, close, }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const ctx = useContext(PlayerContext);

    if (!ctx) {
        throw new Error(
            'usePlayer must be used inside <PlayerProvider>'
        );
    }

    return ctx;
}