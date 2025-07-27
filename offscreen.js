// This script runs in the offscreen document to control the YouTube iframe.

let iframe = null;

// Listen for commands from the background script.
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'play') {
        playAudio(message.videoId);
    } else if (message.action === 'pause') {
        pauseAudio();
    }
});

// Creates or updates the iframe to play audio.
function playAudio(videoId) {
    if (!videoId) return;

    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none'; // The iframe remains invisible.
        document.body.appendChild(iframe);
    }

    // FINAL FIX: This is the correct YouTube embed URL.
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0`;
}

// Stops the audio by clearing the iframe's source.
function pauseAudio() {
    if (iframe) {
        iframe.src = '';
    }
}
