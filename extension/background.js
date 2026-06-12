// Polyfill minimal browser environment for Socket.io in Service Worker
self.window = self;
self.document = {
  createElement: () => ({
    style: {},
    setAttribute: () => {},
    appendChild: () => {}
  }),
  getElementsByTagName: () => [],
  head: {
    appendChild: () => {}
  },
  body: {
    appendChild: () => {}
  },
  cookie: "",
  addEventListener: () => {},
  removeEventListener: () => {}
};
// navigator, location, addEventListener, and removeEventListener are natively defined on self in Service Worker and cannot be overridden.

importScripts('socket.io.min.js');

const SERVER_URL = 'https://bibiswim-webmess.hf.space';

let socket = null;
let aesKey = null;
let currentActiveUrl = '';
let currentNickname = '';
let isPopupOpen = false;
let currentUnreadCount = 0;

// Helper function to check URL safety
function isUrlSafe(urlString) {
  try {
    const url = new URL(urlString);
    const blockedProtocols = ['chrome:', 'edge:', 'about:', 'file:'];
    if (blockedProtocols.includes(url.protocol)) return false;

    const blockedHosts = ['localhost', '127.0.0.1'];
    if (blockedHosts.includes(url.hostname)) return false;

    const blockedKeywords = ['bank', 'paypal', 'stripe', 'crypto', 'wallet', 'gov'];
    if (blockedKeywords.some(keyword => url.hostname.includes(keyword))) return false;

    return true;
  } catch (e) {
    return false;
  }
}

// Helpers for buffer conversion
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Helpers for encryption/decryption
async function encryptText(text, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );
  return {
    iv: bufToHex(iv.buffer),
    ciphertext: bufToHex(encryptedBuf)
  };
}

async function decryptText(payload, key) {
  const { iv, ciphertext } = payload;
  const ivBuf = hexToBuf(iv);
  const ciphertextBuf = hexToBuf(ciphertext);
  
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf },
    key,
    ciphertextBuf
  );
  return new TextDecoder().decode(decryptedBuf);
}

// Disconnect from current socket
function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch (e) {}
    socket = null;
  }
  aesKey = null;
}

// Reconnect socket for target URL
function reconnectSocket(url) {
  disconnectSocket();
  
  chrome.storage.local.get([
    'nickname', 'isPremium', 'premiumBadge', 'premiumColor', 'isInvisible', 'avatar', 'telegram', 'discord',
    'activeAvatarFrame', 'activeColor', 'activeBadge', 'clickerCoins'
  ], (storageData) => {
    const nickname = storageData.nickname || '';
    if (!nickname) return;
    
    currentNickname = nickname;
    
    const isPremium = storageData.isPremium || false;
    const badge = (isPremium && storageData.premiumBadge) ? storageData.premiumBadge : (storageData.activeBadge || '');
    const color = (isPremium && storageData.premiumColor) ? storageData.premiumColor : (storageData.activeColor || '');
    const avatarFrame = storageData.activeAvatarFrame || '';
    const isInvisible = isPremium ? (storageData.isInvisible || false) : false;
    const avatar = storageData.avatar || '';
    const telegram = storageData.telegram || '';
    const discord = storageData.discord || '';
    const savedCoins = storageData.clickerCoins || 0;

    socket = io(SERVER_URL, { transports: ['websocket'] });

    socket.on('connect', async () => {
      aesKey = null;
      try {
        const keyPair = await crypto.subtle.generateKey(
          { name: "ECDH", namedCurve: "P-256" },
          true,
          ["deriveKey", "deriveBits"]
        );

        const rawPubBuf = await crypto.subtle.exportKey("raw", keyPair.publicKey);
        const clientPublicKeyHex = bufToHex(rawPubBuf);

        socket.emit('dh_handshake_start', { clientPublicKeyHex });

        socket.once('dh_handshake_response', async ({ serverPublicKeyHex }) => {
          try {
            const serverPubKeyBuf = hexToBuf(serverPublicKeyHex);
            const serverPublicKey = await crypto.subtle.importKey(
              "raw",
              serverPubKeyBuf,
              { name: "ECDH", namedCurve: "P-256" },
              true,
              []
            );

            const sharedSecretBits = await crypto.subtle.deriveBits(
              { name: "ECDH", public: serverPublicKey },
              keyPair.privateKey,
              256
            );

            const aesKeyBuffer = await crypto.subtle.digest("SHA-256", sharedSecretBits);
            aesKey = await crypto.subtle.importKey(
              "raw",
              aesKeyBuffer,
              { name: "AES-GCM", length: 256 },
              false,
              ["encrypt", "decrypt"]
            );

            const joinPayload = await encryptText(JSON.stringify({ 
              url, 
              nickname, 
              isPremium, 
              badge, 
              color, 
              isInvisible,
              avatar,
              telegram,
              discord,
              coins: savedCoins,
              avatarFrame
            }), aesKey);
            socket.emit('join_room', joinPayload);

          } catch (err) {
            console.error('[BG] Key exchange error:', err);
          }
        });
      } catch (err) {
        console.error('[BG] ECDH init error:', err);
      }
    });

    socket.on('receive_message', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const messageData = JSON.parse(decryptedStr);

        // If the message is not by us and the popup is closed
        if (messageData.author !== currentNickname && !isPopupOpen) {
          currentUnreadCount++;
          chrome.action.setBadgeText({ text: currentUnreadCount.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#ff3333' });
        }
      } catch (err) {
        console.warn('[BG] Decryption error:', err);
      }
    });

    socket.on('disconnect', () => {
      aesKey = null;
    });
  });
}

function handleUrlChange(url) {
  if (isUrlSafe(url)) {
    if (currentActiveUrl !== url) {
      currentActiveUrl = url;
      currentUnreadCount = 0;
      chrome.action.setBadgeText({ text: "" });
      reconnectSocket(url);
    }
  } else {
    currentActiveUrl = '';
    currentUnreadCount = 0;
    chrome.action.setBadgeText({ text: "" });
    disconnectSocket();
  }
}

// Listen for tab activation and updates
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      handleUrlChange(tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id === tabId) {
        handleUrlChange(changeInfo.url);
      }
    });
  }
});

// Check active tab on startup
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  if (activeTab && activeTab.url) {
    handleUrlChange(activeTab.url);
  }
});

// Listen to storage changes to reconnect if nickname/settings change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes.nickname || changes.isPremium || changes.premiumBadge || changes.premiumColor || changes.activeBadge || changes.activeColor || changes.activeAvatarFrame)) {
    if (currentActiveUrl) {
      reconnectSocket(currentActiveUrl);
    }
  }
});

// Port connection to detect popup open/close
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    isPopupOpen = true;
    currentUnreadCount = 0;
    chrome.action.setBadgeText({ text: "" });
    
    port.onDisconnect.addListener(() => {
      isPopupOpen = false;
    });
  }
});
