export const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

const UNITS = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const timeAgo = (date) => {
    if (!date) return '';
    const diff = (new Date(date) - Date.now()) / 1000;
    for (const [unit, sec] of UNITS) {
        if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
    }
    return 'just now';
};

const compactFmt = new Intl.NumberFormat('en', { notation: 'compact' });
export const compact = (n = 0) => compactFmt.format(n);