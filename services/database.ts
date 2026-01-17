
const DB_NAME = 'nodue_db';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile');
        if (!db.objectStoreNames.contains('timetable')) db.createObjectStore('timetable', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('attendance')) db.createObjectStore('attendance', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('day_attendance')) db.createObjectStore('day_attendance', { keyPath: 'date' });
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async set(storeName: string, key: string | null, value: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = key ? store.put(value, key) : store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, key?: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = key ? store.get(key) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    const stores = ['profile', 'timetable', 'attendance', 'day_attendance'];
    const transaction = this.db!.transaction(stores, 'readwrite');
    stores.forEach(s => transaction.objectStore(s).clear());
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  }
}

export const db = new DatabaseService();
