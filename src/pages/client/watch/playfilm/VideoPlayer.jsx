import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

function extractStreamUrl(embedUrl) {
    if (!embedUrl) return '';
    try {
        const urlObj = new URL(embedUrl);
        const streamUrl = urlObj.searchParams.get('url');
        if (streamUrl) return streamUrl;
    } catch { /* Direct stream URLs are also accepted. */ }
    if (embedUrl.includes('.m3u8') || embedUrl.includes('.mp4')) return embedUrl;
    return embedUrl;
}

const VideoPlayer = forwardRef(({
    src,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeek,
    onEnded,
    onBufferStart,
    onBufferEnd,
    onError,
    onSwitchServer,
    canSwitchServer = false,
    autoPlay = false,
    hideControls = false
}, ref) => {
    const artRef = useRef(null);
    const containerRef = useRef(null);
    const callbacks = useRef({});
    callbacks.current = { onTimeUpdate, onPlay, onPause, onSeek, onEnded, onBufferStart, onBufferEnd, onError, autoPlay };
    const [failure, setFailure] = useState(null);
    const [retry, setRetry] = useState(0);
    const retryPosition = useRef(0);
    const previousSource = useRef(src);

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
        getDuration() {
            return artRef.current ? (artRef.current.duration || 0) : 0;
        },
    }));

    useEffect(() => {
        if (!src || !containerRef.current) return;

        if (previousSource.current !== src) {
            retryPosition.current = 0;
            previousSource.current = src;
        }

        const streamUrl = extractStreamUrl(src);
        setFailure(null);
        const reportError = message => {
            setFailure(message);
            callbacks.current.onError?.(message);
        };

        const art = new Artplayer({
            container: containerRef.current,
            url: streamUrl,
            type: streamUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
            volume: 1,
            isLive: false,
            muted: false,
            autoplay: callbacks.current.autoPlay,
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
            fullscreenWeb: false,
            subtitleOffset: false,
            miniProgressBar: false,
            mutex: true,
            backdrop: true,
            playsInline: true,
            autoPlayback: false,
            airplay: true,
            fastForward: true,
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
                        let mediaRecoveries = 0;
                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (!data.fatal) return;
                            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries++ < 1) {
                                hls.recoverMediaError();
                                return;
                            }
                            reportError('Không tải được video. Kiểm tra kết nối hoặc thử server khác.');
                        });

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
                        reportError('Trình duyệt chưa hỗ trợ định dạng video này.');
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
        art.on('ready', () => {
            if (retryPosition.current > 0) {
                art.currentTime = retryPosition.current;
                retryPosition.current = 0;
            }
        });
        art.on('video:error', () => reportError('Không phát được video. Bạn có thể thử lại hoặc đổi server.'));

        let lastReported = 0;
        art.on('video:timeupdate', () => {
            if (callbacks.current.onTimeUpdate) {
                const now = Math.floor(art.currentTime);
                const dur = Math.floor(art.duration || 0);
                if (Math.abs(now - lastReported) >= 3) {
                    lastReported = now;
                    callbacks.current.onTimeUpdate(now, dur);
                }
            }
        });

        art.on('video:play', () => callbacks.current.onPlay?.(art.currentTime));
        art.on('video:pause', () => callbacks.current.onPause?.(art.currentTime));
        art.on('video:seeked', () => callbacks.current.onSeek?.(art.currentTime));
        art.on('video:ended', () => callbacks.current.onEnded?.());
        art.on('video:waiting', () => callbacks.current.onBufferStart?.(art.currentTime));
        art.on('video:playing', () => { setFailure(null); callbacks.current.onBufferEnd?.(art.currentTime); });


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
            artRef.current = null;
        };
    }, [src, retry]);

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
            {failure && !hideControls && <div role="alert" className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-4">
                <div className="max-w-sm w-full rounded-2xl bg-[#141a24] border border-yellow-400/40 p-5 text-center">
                    <p className="text-white font-bold">Video gặp sự cố</p>
                    <p className="mt-2 text-sm text-slate-300">{failure}</p>
                    <div className="mt-4 flex justify-center flex-wrap gap-3">
                        <button className="bg-yellow-400 rounded-lg px-4 py-2 text-black font-bold" onClick={() => {
                            retryPosition.current = artRef.current?.currentTime || 0;
                            setRetry(value => value + 1);
                        }}>Thử lại</button>
                        {canSwitchServer && <button onClick={onSwitchServer} className="border border-slate-600 rounded-lg px-4 py-2 text-white">Đổi server</button>}
                    </div>
                </div>
            </div>}
        </>
    );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
