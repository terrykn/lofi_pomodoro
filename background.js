// This script ensures the offscreen document for audio playback exists.

// A global promise to avoid race conditions when creating the document.
let creating; 

// Function to set up the offscreen document.
async function setupOffscreenDocument(path) {
  // Check if we already have an offscreen document.
  if (await chrome.offscreen.hasDocument()) return;

  // If we're already creating the document, wait for it to finish.
  if (creating) await creating;

  // Create the offscreen document.
  creating = chrome.offscreen.createDocument({
    url: path,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'To play lofi music in the background.',
  });
  
  await creating;
  creating = null;
}

// Listen for messages from the popup script.
chrome.runtime.onMessage.addListener(async (message) => {
  // Ensure the offscreen document is ready.
  await setupOffscreenDocument('offscreen.html');

  // Forward the message to the offscreen document to control the audio.
  await chrome.runtime.sendMessage(message);
});

// This function creates the offscreen document.
async function createOffscreenDocument(path) {
  if (await chrome.offscreen.hasDocument?.()) return;
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'To play YouTube audio in the background',
  });
}

// Listen for the 'play' message to ensure the offscreen document is created.
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'play') {
    await createOffscreenDocument('offscreen.html');
    chrome.runtime.sendMessage(message);
  }
});

// Listener to forward the video title from offscreen.js to popup.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'videoTitle') {
        chrome.runtime.sendMessage({ action: 'videoTitle', title: message.title });
    }
});