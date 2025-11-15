/**
 * IndexedDB utility for caching chat messages and room history
 */

const DB_NAME = 'WatchTogetherDB';
const DB_VERSION = 1;

interface ChatMessageCache {
  roomId: string;
  messages: Array<{
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    color?: string;
    message: string;
    timestamp: number;
  }>;
  lastUpdated: number;
}

interface RoomHistoryCache {
  username: string;
  history: Array<{
    roomId: string;
    roomName?: string;
    joinedAt: number;
    leftAt: number | null;
  }>;
  lastUpdated: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB açılamadı'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Chat messages store
      if (!database.objectStoreNames.contains('chatMessages')) {
        const chatStore = database.createObjectStore('chatMessages', { keyPath: 'roomId' });
        chatStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Room history store
      if (!database.objectStoreNames.contains('roomHistory')) {
        const historyStore = database.createObjectStore('roomHistory', { keyPath: 'username' });
        historyStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

/**
 * Save chat messages to cache
 */
export async function saveChatMessages(roomId: string, messages: ChatMessageCache['messages']): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['chatMessages'], 'readwrite');
    const store = transaction.objectStore('chatMessages');

    const cache: ChatMessageCache = {
      roomId,
      messages: messages.slice(-500), // Son 500 mesajı sakla
      lastUpdated: Date.now(),
    };

    await store.put(cache);
  } catch (error) {
    console.warn('Chat mesajları cache\'lenemedi:', error);
  }
}

/**
 * Get cached chat messages
 */
export async function getChatMessages(roomId: string): Promise<ChatMessageCache['messages'] | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['chatMessages'], 'readonly');
    const store = transaction.objectStore('chatMessages');

    return new Promise((resolve) => {
      const request = store.get(roomId);

      request.onsuccess = () => {
        const cache = request.result as ChatMessageCache | undefined;
        if (cache && Date.now() - cache.lastUpdated < 24 * 60 * 60 * 1000) {
          // 24 saat içindeki cache'i kullan
          resolve(cache.messages);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('Chat mesajları cache\'den alınamadı:', error);
    return null;
  }
}

/**
 * Save room history to cache
 */
export async function saveRoomHistory(username: string, history: RoomHistoryCache['history']): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['roomHistory'], 'readwrite');
    const store = transaction.objectStore('roomHistory');

    const cache: RoomHistoryCache = {
      username,
      history: history.slice(-100), // Son 100 odayı sakla
      lastUpdated: Date.now(),
    };

    await store.put(cache);
  } catch (error) {
    console.warn('Oda geçmişi cache\'lenemedi:', error);
  }
}

/**
 * Get cached room history
 */
export async function getRoomHistory(username: string): Promise<RoomHistoryCache['history'] | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['roomHistory'], 'readonly');
    const store = transaction.objectStore('roomHistory');

    return new Promise((resolve) => {
      const request = store.get(username);

      request.onsuccess = () => {
        const cache = request.result as RoomHistoryCache | undefined;
        if (cache && Date.now() - cache.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
          // 7 gün içindeki cache'i kullan
          resolve(cache.history);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('Oda geçmişi cache\'den alınamadı:', error);
    return null;
  }
}

/**
 * Clear old cache entries (older than 30 days)
 */
export async function clearOldCache(): Promise<void> {
  try {
    const database = await initDB();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Clear old chat messages
    const chatTransaction = database.transaction(['chatMessages'], 'readwrite');
    const chatStore = chatTransaction.objectStore('chatMessages');
    const chatIndex = chatStore.index('lastUpdated');
    const chatRange = IDBKeyRange.upperBound(thirtyDaysAgo);

    chatIndex.openCursor(chatRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        chatStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    // Clear old room history
    const historyTransaction = database.transaction(['roomHistory'], 'readwrite');
    const historyStore = historyTransaction.objectStore('roomHistory');
    const historyIndex = historyStore.index('lastUpdated');
    const historyRange = IDBKeyRange.upperBound(thirtyDaysAgo);

    historyIndex.openCursor(historyRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        historyStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('Eski cache temizlenemedi:', error);
  }
}

