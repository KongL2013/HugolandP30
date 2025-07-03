import { GameState } from '../types/game';

// Browser-based AsyncStorage implementation
class AsyncStorage {
  static async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

const GAME_STATE_KEY = 'gameState';

export const saveGameState = async (gameState: GameState): Promise<void> => {
  try {
    const serializedState = JSON.stringify(gameState, (key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    await AsyncStorage.setItem(GAME_STATE_KEY, serializedState);
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

export const loadGameState = async (): Promise<GameState | null> => {
  try {
    const serializedState = await AsyncStorage.getItem(GAME_STATE_KEY);
    if (!serializedState) {
      return null;
    }

    const gameState = JSON.parse(serializedState, (key, value) => {
      // Convert ISO strings back to Date objects for known date fields
      const dateFields = [
        'lastSaveTime',
        'lastClaimDate',
        'sessionStartTime',
        'lastRefresh',
        'nextRefresh',
        'plantedAt',
        'lastWatered',
        'activatedAt',
        'expiresAt',
        'lastRollTime',
        'unlockedAt',
        'claimDate'
      ];
      
      if (dateFields.includes(key) && typeof value === 'string') {
        return new Date(value);
      }
      return value;
    });

    return gameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};

export const clearGameState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
};

export default AsyncStorage;