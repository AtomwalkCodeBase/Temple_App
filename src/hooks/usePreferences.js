// src/hooks/usePreferences.js
import { useCallback, useEffect, useState } from 'react';
import { localStorage } from '../services/localStorage';

export function usePreferences() {
    const [preferences, setPreferences] = useState(null); // null = still loading
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const prefs = await localStorage.getPreferences();
        setPreferences(prefs);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const update = useCallback(async (patch) => {
        const next = await localStorage.updatePreferences(patch);
        setPreferences(next);
        return next;
    }, []);

    const setState = useCallback((stateKey) => update({ state: stateKey, panji: null }), [update]);
    const setPanji = useCallback((panjiKey) => update({ panji: panjiKey }), [update]);

    return { preferences, loading, update, setState, setPanji, refresh: load };
}

export default usePreferences;