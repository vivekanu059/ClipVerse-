import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';

export const VideoPlayer = ({ src, thumbnail }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [playingHeight, setPlayingHeight] = useState(0);

    useEffect(() => {
        if (!src) return;
        const fixedSrc = src.replace('127.0.0.1', 'localhost');

        if (!playerRef.current) {
            const videoElement = videoRef.current;
            if (!videoElement) return;

            const player = (playerRef.current = videojs(videoElement, {
                autoplay: false,
                controls: true,
                fill: true,
                poster: thumbnail,
                sources: [{ src: fixedSrc, type: 'application/x-mpegURL' }],
                playbackRates: [0.5, 1, 1.25, 1.5, 2],
                html5: { vhs: { overrideNative: true } },
            }));

            // Show the resolution that is really being decoded, so quality changes are visible
            player.on(['loadedmetadata', 'resize'], () => setPlayingHeight(player.videoHeight()));

            player.ready(() => {
                const qualityLevels = player.qualityLevels();
                const MenuButton = videojs.getComponent('MenuButton');
                const MenuItem = videojs.getComponent('MenuItem');

                class QualityMenuItem extends MenuItem {
                    constructor(p, options) {
                        super(p, { ...options, selectable: true, label: options.label, selected: options.selected || false });
                        this.level = options.level;
                    }
                    handleClick() {
                        // Enable only the chosen level
                        for (let i = 0; i < qualityLevels.length; i++) qualityLevels[i].enabled = i === this.level;
                        this.parentComponent_.children().forEach((c) => c.selected(false));
                        this.selected(true);
                    }
                }

                class QualityMenuButton extends MenuButton {
                    constructor(p, options) {
                        super(p, options);
                        this.addClass('vjs-quality-selector');
                        this.controlText('Quality');
                    }
                    createItems() {
                        const levels = this.player().qualityLevels();
                        const auto = new MenuItem(this.player(), { label: 'Auto', selectable: true, selected: true });
                        auto.handleClick = function () {
                            // Auto = re-enable every level so the player adapts again
                            for (let i = 0; i < levels.length; i++) levels[i].enabled = true;
                            this.parentComponent_.children().forEach((c) => c.selected(false));
                            this.selected(true);
                        };
                        const items = [auto];
                        for (let i = 0; i < levels.length; i++) {
                            if (!levels[i].height) continue;
                            items.push(new QualityMenuItem(this.player(), { label: `${levels[i].height}p`, level: i, selected: false }));
                        }
                        return items;
                    }
                    buildCSSClass() {
                        return `vjs-icon-cog ${super.buildCSSClass()}`;
                    }
                }

                if (!videojs.getComponent('QualityMenuButton')) videojs.registerComponent('QualityMenuButton', QualityMenuButton);
                if (!player.controlBar.getChild('QualityMenuButton')) {
                    player.controlBar.addChild('QualityMenuButton', {}, player.controlBar.children_.length - 2);
                }
                qualityLevels.on('addqualitylevel', () => {
                    const btn = player.controlBar.getChild('QualityMenuButton');
                    if (btn) btn.update();
                });
            });
        } else {
            const player = playerRef.current;
            player.src({ src: fixedSrc, type: 'application/x-mpegURL' });
            player.poster(thumbnail);
        }
    }, [src, thumbnail]);

    useEffect(() => () => {
        if (playerRef.current && !playerRef.current.isDisposed()) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
    }, []);

    return (
        // The outer box owns the size (16:9) and contains the player, so it can never spill over the page
        <div className="clipverse-player group relative isolate aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            <div data-vjs-player className="h-full w-full">
                <video ref={videoRef} className="video-js vjs-big-play-centered" />
            </div>
            {playingHeight > 0 && (
                <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums text-amber-400 opacity-0 backdrop-blur transition group-hover:opacity-100">
                    Playing {playingHeight}p
                </span>
            )}
            <style>{`
                .clipverse-player .video-js { width: 100%; height: 100%; font-family: 'DM Sans', sans-serif; background: #000; }
                .clipverse-player .vjs-control-bar { background: linear-gradient(to top, rgba(0,0,0,.85), transparent); height: 4em; padding-top: .6em; }
                .clipverse-player .vjs-big-play-button { width: 2.6em; height: 2.6em; line-height: 2.6em; margin: -1.3em 0 0 -1.3em; border: 0; border-radius: 50%; background: #fbbf24; color: #000; box-shadow: 0 10px 30px rgba(0,0,0,.5); transition: transform .2s; }
                .clipverse-player .vjs-big-play-button:hover, .clipverse-player .video-js:hover .vjs-big-play-button { background: #fcd34d; transform: scale(1.08); }
                .clipverse-player .vjs-play-progress, .clipverse-player .vjs-volume-level { background: #fbbf24; }
                .clipverse-player .vjs-play-progress:before { color: #fbbf24; }
                .clipverse-player .vjs-load-progress div { background: rgba(255,255,255,.25); }
                .clipverse-player .vjs-progress-holder { height: .35em; border-radius: 99px; transition: height .15s; }
                .clipverse-player .vjs-progress-control:hover .vjs-progress-holder { height: .55em; }
                .clipverse-player .vjs-slider { background: rgba(255,255,255,.18); }
                .clipverse-player .vjs-menu-button-popup .vjs-menu { left: -3em; width: 10em; bottom: 3em; }
                .clipverse-player .vjs-menu-content { background: rgba(18,18,22,.95) !important; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); padding: .3em 0; }
                .clipverse-player .vjs-menu li { border-radius: 8px; margin: 0 .3em; }
                .clipverse-player .vjs-menu li.vjs-selected { background: #fbbf24; color: #000; }
                .clipverse-player .vjs-menu li:hover:not(.vjs-selected) { background: rgba(255,255,255,.1); }
                .clipverse-player .vjs-icon-cog:before { font-size: 1.8em; }
                .clipverse-player .vjs-control:focus-visible { outline: 2px solid #fbbf24; outline-offset: -2px; }
            `}</style>
        </div>
    );
};

export default VideoPlayer;