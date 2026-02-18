import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels"; 

export const VideoPlayer = ({ src, thumbnail }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const fixedSrc = src.replace("127.0.0.1", "localhost");

    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        poster: thumbnail,
        sources: [{
            src: fixedSrc,
            type: "application/x-mpegURL"
        }],
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        html5: {
          vhs: { overrideNative: true }
        }
      }));

      // --- CUSTOM QUALITY SELECTOR LOGIC ---
      player.ready(() => {
        const qualityLevels = player.qualityLevels();
        
        // 1. Create a simplified MenuButton class
        const MenuButton = videojs.getComponent('MenuButton');
        const MenuItem = videojs.getComponent('MenuItem');

        class QualityMenuItem extends MenuItem {
          constructor(player, options) {
            super(player, {
              ...options,
              selectable: true,
              label: options.label,
              selected: options.selected || false,
            });
            this.level = options.level;
          }
          handleClick() {
            // Reset other items
            this.player().qualityLevels().selectedIndex_ = this.level;
            // Deselect all
            this.parentComponent_.children().forEach(child => child.selected(false));
            // Select this one
            this.selected(true);
            console.log("Switched to quality level:", this.level);
          }
        }

        class QualityMenuButton extends MenuButton {
          constructor(player, options) {
            super(player, options);
            this.addClass('vjs-quality-selector');
            this.controlText('Quality');
          }

          createItems() {
            const levels = this.player().qualityLevels();
            const items = [];

            // Add "Auto" option
            items.push(new MenuItem(this.player(), {
              label: 'Auto',
              selectable: true,
              selected: true, // Default to Auto
            }));
            
            items[0].handleClick = function() {
                levels.selectedIndex_ = -1; // -1 enables Auto mode
                this.parentComponent_.children().forEach(c => c.selected(false));
                this.selected(true);
                console.log("Switched to Auto");
            };

            // Add detected levels (360p, 720p, etc.)
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                if (!level.height) continue; 

                const item = new QualityMenuItem(this.player(), {
                    label: `${level.height}p`,
                    level: i,
                    selected: false
                });
                items.push(item);
            }
            return items;
          }
          
          buildCSSClass() {
             return `vjs-icon-cog ${super.buildCSSClass()}`;
          }
        }

        // 2. Register and Add the button to the control bar
        // FIX: Only register if it hasn't been registered yet to prevent warnings
        if (!videojs.getComponent('QualityMenuButton')) {
            videojs.registerComponent('QualityMenuButton', QualityMenuButton);
        }
        
        // Only add it if it doesn't exist yet
        if (!player.controlBar.getChild('QualityMenuButton')) {
            // FIX: Removed 'const btn =' here because it was unused
            player.controlBar.addChild('QualityMenuButton', {}, 
                player.controlBar.children_.length - 2 
            );
        }

        // Re-render items when new qualities are found
        qualityLevels.on('addqualitylevel', () => {
            const btn = player.controlBar.getChild('QualityMenuButton');
            if(btn) btn.update();
        });
      });

    } else {
      const player = playerRef.current;
      player.src({ src: fixedSrc, type: "application/x-mpegURL" });
      player.poster(thumbnail);
    }
  }, [src, thumbnail]);

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player style={{ width: "100%" }}>
      <video ref={videoRef} className="video-js vjs-big-play-centered vjs-16-9" />
      <style>{`
        .vjs-menu-button-popup .vjs-menu {
            left: -3em;
            width: 10em;
            bottom: 3em; 
        }
        .vjs-menu-content {
            background-color: rgba(43, 51, 63, 0.9) !important;
        }
        .vjs-icon-cog:before {
            font-size: 1.8em;
        }
      `}</style>
    </div>
  );
};