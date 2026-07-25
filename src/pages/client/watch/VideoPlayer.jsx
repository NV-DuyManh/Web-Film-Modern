import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

function extractStreamUrl(embedUrl) {
    if (!embedUrl) return '';
    try {
        const urlObj = new URL(embedUrl);
        const streamUrl = urlObj.searchParams.get('url');
        if (streamUrl) return streamUrl;
    } catch { /* ignore */ }
    if (embedUrl.includes('.m3u8') || embedUrl.includes('.mp4')) return embedUrl;
    return embedUrl;
}

const VideoPlayer = forwardRef(({ src, onTimeUpdate, autoPlay = false, hideControls = false }, ref) => {
    const artRef = useRef(null);
    const containerRef = useRef(null);

    useImperativeHandle(ref, () => ({
        seek(seconds) {
            if (artRef.current) artRef.current.currentTime = seconds;
        },
        play() {
            if (artRef.current) artRef.current.play();
        },
        getTime() {
            return artRef.current ? artRef.current.currentTime : 0;
        },
    }));

    useEffect(() => {
        if (!src || !containerRef.current) return;

        const streamUrl = extractStreamUrl(src);

        const art = new Artplayer({
            container: containerRef.current,
            url: streamUrl,
            type: streamUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
            volume: 1,
            isLive: false,
            muted: false,
            autoplay: autoPlay,
            pip: true,
            autoSize: false,
            autoMini: false,
            screenshot: false,
            setting: true,
            loop: false,
            flip: false,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: false, // Tắt bớt 1 nút phóng to (chỉ giữ native fullscreen)
            subtitleOffset: false,
            miniProgressBar: false,
            mutex: true,
            backdrop: true,
            playsInline: true,
            autoPlayback: false, // Tắt thông báo "Last Seen"
            airplay: true,
            fastForward: true, // Bật tua nhanh mặc định của Artplayer cho đẹp
            theme: '#ff0000',
            lock: false,
            hotkey: true,
            customType: {
                m3u8: function (video, url, art) {
                    if (Hls.isSupported()) {
                        if (art.hls) art.hls.destroy();
                        const hls = new Hls({
                            maxBufferLength: 30,
                            maxMaxBufferLength: 60,
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.hls = hls;

                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            const levels = hls.levels;
                            if (levels && levels.length > 0) {
                                const qualitySettings = levels.map((level, index) => ({
                                    default: index === levels.length - 1,
                                    html: level.height + 'p',
                                    url: level.url,
                                }));

                                art.setting.update({
                                    width: 200,
                                    html: 'Chất lượng',
                                    tooltip: levels[levels.length - 1].height + 'p',
                                    selector: qualitySettings.map((item, index) => ({
                                        html: item.html,
                                        default: item.default,
                                        onSelect: function (qItem) {
                                            hls.currentLevel = index;
                                            return qItem.html;
                                        }
                                    })),
                                });
                            }
                        });

                        art.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        art.notice.show = 'Unsupported playback format: m3u8';
                    }
                }
            },
            controls: [
                {
                    position: 'right',
                    html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 12l9-7v14l-9-7zM2 12l9-7v14l-9-7z"/></svg>',
                    tooltip: 'Lùi 10s',
                    style: { marginRight: '10px', display: 'flex', alignItems: 'center' },
                    click: function () {
                        if (artRef.current) artRef.current.currentTime = Math.max(0, artRef.current.currentTime - 10);
                    },
                },
                {
                    position: 'right',
                    html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 12l-9-7v14l9-7zM22 12l-9-7v14l9-7z"/></svg>',
                    tooltip: 'Tua 10s',
                    style: { marginRight: '10px', display: 'flex', alignItems: 'center' },
                    click: function () {
                        if (artRef.current) artRef.current.currentTime += 10;
                    },
                }
            ]
        });

        artRef.current = art;

        let lastReported = 0;
        art.on('video:timeupdate', () => {
            if (onTimeUpdate) {
                const now = Math.floor(art.currentTime);
                if (now - lastReported >= 3) {
                    lastReported = now;
                    onTimeUpdate(now);
                }
            }
        });

        const handleKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                art.fullscreen = !art.fullscreen;
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (art && art.destroy) {
                art.destroy(false);
            }
        };
    }, [src]);

    return (
        <>
            <style>{`
                .art-hide-controls .art-video-player > *:not(video):not(.art-video) {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
                .art-hide-controls .art-bottom,
                .art-hide-controls .art-mask,
                .art-hide-controls .art-state,
                .art-hide-controls .art-layer,
                .art-hide-controls .art-layer-play,
                .art-hide-controls .art-loading,
                .art-hide-controls .art-info,
                .art-hide-controls .art-notice,
                .art-hide-controls .art-contextmenus,
                .art-hide-controls [class*="art-control"],
                .art-hide-controls [class*="art-icon"] {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }
                .art-notice-inner,
                .art-notice,
                .art-notice-inner * {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `}</style>
            <div
                ref={containerRef}
                className={`w-full h-[60vh] sm:h-[75vh] md:h-[80vh] bg-black ${hideControls ? 'art-hide-controls' : ''}`}
            />
        </>
    );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
