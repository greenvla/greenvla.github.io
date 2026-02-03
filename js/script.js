function initInteractiveDemo() {
    const slider = document.getElementById('renderSteps');
    const stepValue = document.getElementById('stepValue');
    const displaySteps = document.getElementById('displaySteps');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        stepValue.textContent = value;
        displaySteps.textContent = value;
    });
}

function initCopyBibtex() {
    const copyButton = document.getElementById('copyButton');
    const bibtexCode = document.getElementById('bibtexCode');

    if (!copyButton || !bibtexCode) return;

    copyButton.addEventListener('click', async () => {
        const text = bibtexCode.textContent;

        try {
            await navigator.clipboard.writeText(text);
            showCopySuccess();
        } catch (err) {
            fallbackCopyToClipboard(text);
        }
    });

    function showCopySuccess() {
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');

        setTimeout(() => {
            copyButton.textContent = 'Copy';
            copyButton.classList.remove('copied');
        }, 2000);
    }

    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text:', err);
            copyButton.textContent = 'Failed';
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 2000);
        }

        document.body.removeChild(textArea);
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const nav = document.querySelector('nav');
                const navHeight = nav ? nav.offsetHeight : 0;
                const targetPosition = target.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initCameraViewer() {
    // Camera mapping to video files
    const cameraMapping = {
        'left_eye': {
            video: 'assets/videos/all_cameras/left_head.webm',
            label: 'Left Eye Camera',
            videoId: 'leftEyeVideo'
        },
        'right_eye': {
            video: 'assets/videos/all_cameras/right_head.webm',
            label: 'Right Eye Camera',
            videoId: 'rightEyeVideo'
        },
        'left_arm': {
            video: 'assets/videos/all_cameras/left_arms.webm',
            label: 'Left Arm Camera',
            videoId: 'leftArmVideo'
        },
        'right_arm': {
            video: 'assets/videos/all_cameras/right_arms.webm',
            label: 'Right Arm Camera',
            videoId: 'rightArmVideo'
        }
    };

    const mainVideo = document.getElementById('mainVideo');
    const mainVideoLabel = document.getElementById('mainVideoLabel');
    const leftEyeVideo = document.getElementById('leftEyeVideo');
    const rightEyeVideo = document.getElementById('rightEyeVideo');
    const leftArmVideo = document.getElementById('leftArmVideo');
    const rightArmVideo = document.getElementById('rightArmVideo');

    if (!mainVideo) {
        console.log('Camera viewer not found on this page');
        return;
    }

    console.log('Camera viewer initialized');

    const allVideos = [leftEyeVideo, rightEyeVideo, leftArmVideo, rightArmVideo];
    const hotspots = document.querySelectorAll('.camera-hotspot');

    allVideos.forEach(video => {
        if (video) {
            video.load();
        }
    });

    function syncAllVideos(targetTime) {
        allVideos.forEach(video => {
            if (video) {
                video.currentTime = targetTime;
            }
        });
        if (mainVideo.src) {
            mainVideo.currentTime = targetTime;
        }
    }

    function playAllVideos() {
        const mainTime = mainVideo.src ? mainVideo.currentTime : 0;
        syncAllVideos(mainTime);

        allVideos.forEach(video => {
            if (video) {
                video.play().catch(e => console.log('Video play prevented:', e));
            }
        });
        if (mainVideo.src) {
            mainVideo.play().catch(e => console.log('Main video play prevented:', e));
        }
    }

    function pauseAllVideos() {
        allVideos.forEach(video => {
            if (video) video.pause();
        });
        if (mainVideo.src) {
            mainVideo.pause();
        }
    }

    function switchMainVideo(cameraName) {
        const camera = cameraMapping[cameraName];
        if (!camera) {
            console.error('Camera not found:', cameraName);
            return;
        }

        console.log('Switching to camera:', cameraName, camera);

        const wasPlaying = mainVideo.src && !mainVideo.paused;
        const currentTime = mainVideo.src ? mainVideo.currentTime : 0;

        const mainVideoSource = mainVideo.querySelector('source');
        mainVideoSource.src = camera.video;
        mainVideo.load();

        mainVideoLabel.textContent = camera.label;

        mainVideo.addEventListener('loadedmetadata', function onLoaded() {
            mainVideo.currentTime = currentTime;
            if (wasPlaying) {
                mainVideo.play().catch(e => console.log('Main video play prevented:', e));
            }
            mainVideo.removeEventListener('loadedmetadata', onLoaded);
        });

        hotspots.forEach(h => h.classList.remove('active'));
        document.querySelector(`[data-camera="${cameraName}"]`)?.classList.add('active');

        allVideos.forEach(v => v.classList.remove('active'));
        const activeSecondaryVideo = document.getElementById(camera.videoId);
        if (activeSecondaryVideo) {
            activeSecondaryVideo.classList.add('active');
        }
    }

    console.log('Found', hotspots.length, 'hotspots');
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            const cameraName = hotspot.dataset.camera;
            console.log('Hotspot clicked:', cameraName);
            switchMainVideo(cameraName);
        });
    });

    allVideos.forEach(video => {
        video.addEventListener('click', () => {
            for (const [cameraName, camera] of Object.entries(cameraMapping)) {
                if (camera.videoId === video.id) {
                    switchMainVideo(cameraName);
                    break;
                }
            }
        });
    });

    let syncInterval;

    function startSync() {
        syncInterval = setInterval(() => {
            if (mainVideo.src && !mainVideo.paused) {
                const mainTime = mainVideo.currentTime;
                allVideos.forEach(video => {
                    if (video && Math.abs(video.currentTime - mainTime) > 0.3) {
                        video.currentTime = mainTime;
                    }
                });
            }
        }, 500);
    }

    mainVideo.addEventListener('play', () => {
        allVideos.forEach(v => {
            if (v && v.paused) {
                v.currentTime = mainVideo.currentTime;
                v.play().catch(e => console.log('Video play prevented:', e));
            }
        });
        startSync();
    });

    mainVideo.addEventListener('pause', () => {
        allVideos.forEach(v => v.pause());
        if (syncInterval) {
            clearInterval(syncInterval);
        }
    });

    mainVideo.addEventListener('seeked', () => {
        syncAllVideos(mainVideo.currentTime);
    });

    allVideos.forEach(video => {
        video.addEventListener('play', () => {
            if (mainVideo.src) {
                const timeDiff = Math.abs(video.currentTime - mainVideo.currentTime);
                if (timeDiff > 0.5) {
                    video.currentTime = mainVideo.currentTime;
                }
            }
        });
    });

    switchMainVideo('left_eye');
}

document.addEventListener('DOMContentLoaded', () => {
    initInteractiveDemo();
    initCopyBibtex();
    initSmoothScroll();
    initCameraViewer();
});
