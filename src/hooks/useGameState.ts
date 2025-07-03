import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, ResearchUpgrade, ChestType, MythicalItem, CombatState, GameMode, CheatType, Gem, Item, Relic, DailyReward, Skill, PrestigeReward, OfflineReward, BulkAction, Seed, GameSettings, AdventureSkill, MenuSkill } from '../types/game';
import { saveGameState, loadGameState, clearGameState } from '../utils/storage';
import { generateWeapon, generateArmor, calculateDamage, generateGem, generateRelic, calculateOfflineRewards, getSkillDescription } from '../utils/gameUtils';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        const savedState = await loadGameState();
        if (savedState) {
          setGameState(savedState);
        } else {
          // Initialize new game state
          const initialState: GameState = {
            level: 1,
            experience: 0,
            experienceToNext: 100,
            coins: 100,
            gems: 0,
            shinyGems: 0,
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5,
            zone: 1,
            maxZone: 1,
            equippedWeapon: null,
            equippedArmor: null,
            equippedRelic: null,
            inventory: {
              weapons: [],
              armor: [],
              gems: [],
              relics: [],
            },
            research: {
              weaponDamage: 0,
              armorDefense: 0,
              healthBoost: 0,
              coinBonus: 0,
              experienceBoost: 0,
              criticalChance: 0,
              gemFinding: 0,
              relicPower: 0,
            },
            combat: null,
            gameMode: 'normal',
            cheats: {
              infiniteCoins: false,
              infiniteGems: false,
              infiniteHealth: false,
              oneHitKill: false,
              maxLevel: false,
              unlockAllZones: false,
              instantResearch: false,
              freeUpgrades: false,
            },
            achievements: [],
            dailyRewards: {
              lastClaimDate: null,
              streak: 0,
              availableReward: null,
            },
            skills: {
              combat: 1,
              mining: 1,
              research: 1,
              luck: 1,
              activeMenuSkill: null,
              lastRollTime: null,
            },
            prestige: {
              level: 0,
              points: 0,
              totalResets: 0,
              rewards: [],
            },
            statistics: {
              totalDamageDealt: 0,
              totalDamageTaken: 0,
              enemiesDefeated: 0,
              chestsOpened: 0,
              gemsFound: 0,
              coinsEarned: 0,
              itemsUpgraded: 0,
              relicsFound: 0,
              timePlayedMinutes: 0,
              prestigeCount: 0,
            },
            lastSaveTime: new Date(),
            garden: {
              plots: Array(9).fill(null),
              water: 0,
              seeds: [],
            },
            settings: {
              soundEnabled: true,
              musicEnabled: true,
              notificationsEnabled: true,
              autoSave: true,
              theme: 'light',
              language: 'en',
              colorblindMode: false,
            },
            adventureSkills: {
              available: [],
              selected: [],
              skipCards: 3,
            },
          };
          setGameState(initialState);
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, []);

  // Auto-save game state
  useEffect(() => {
    if (gameState && !isLoading) {
      const saveTimer = setTimeout(() => {
        saveGameState(gameState);
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [gameState, isLoading]);

  // Equipment functions
  const equipWeapon = useCallback((weapon: Weapon) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // If there's already an equipped weapon, move it back to inventory
      if (newState.equippedWeapon) {
        newState.inventory.weapons.push(newState.equippedWeapon);
      }
      
      // Remove weapon from inventory and equip it
      newState.inventory.weapons = newState.inventory.weapons.filter(w => w.id !== weapon.id);
      newState.equippedWeapon = weapon;
      
      // Recalculate stats
      newState.attack = 10 + (newState.equippedWeapon?.damage || 0) + newState.research.weaponDamage;
      
      return newState;
    });
  }, []);

  const equipArmor = useCallback((armor: Armor) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // If there's already equipped armor, move it back to inventory
      if (newState.equippedArmor) {
        newState.inventory.armor.push(newState.equippedArmor);
      }
      
      // Remove armor from inventory and equip it
      newState.inventory.armor = newState.inventory.armor.filter(a => a.id !== armor.id);
      newState.equippedArmor = armor;
      
      // Recalculate stats
      newState.defense = 5 + (newState.equippedArmor?.defense || 0) + newState.research.armorDefense;
      newState.maxHealth = 100 + (newState.equippedArmor?.health || 0) + newState.research.healthBoost;
      
      return newState;
    });
  }, []);

  // Upgrade functions
  const upgradeWeapon = useCallback((weaponId: string): boolean => {
    if (!gameState) return false;
    
    const weapon = gameState.equippedWeapon?.id === weaponId 
      ? gameState.equippedWeapon 
      : gameState.inventory.weapons.find(w => w.id === weaponId);
    
    if (!weapon) return false;
    
    const upgradeCost = weapon.level * 50;
    if (gameState.coins < upgradeCost && !gameState.cheats.freeUpgrades) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Find and upgrade the weapon
      if (newState.equippedWeapon?.id === weaponId) {
        newState.equippedWeapon.level += 1;
        newState.equippedWeapon.damage += Math.floor(newState.equippedWeapon.damage * 0.1);
      } else {
        const weaponIndex = newState.inventory.weapons.findIndex(w => w.id === weaponId);
        if (weaponIndex !== -1) {
          newState.inventory.weapons[weaponIndex].level += 1;
          newState.inventory.weapons[weaponIndex].damage += Math.floor(newState.inventory.weapons[weaponIndex].damage * 0.1);
        }
      }
      
      // Deduct coins
      if (!newState.cheats.freeUpgrades) {
        newState.coins -= upgradeCost;
      }
      
      // Update statistics
      newState.statistics.itemsUpgraded += 1;
      
      // Recalculate attack
      newState.attack = 10 + (newState.equippedWeapon?.damage || 0) + newState.research.weaponDamage;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const upgradeArmor = useCallback((armorId: string): boolean => {
    if (!gameState) return false;
    
    const armor = gameState.equippedArmor?.id === armorId 
      ? gameState.equippedArmor 
      : gameState.inventory.armor.find(a => a.id === armorId);
    
    if (!armor) return false;
    
    const upgradeCost = armor.level * 50;
    if (gameState.coins < upgradeCost && !gameState.cheats.freeUpgrades) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Find and upgrade the armor
      if (newState.equippedArmor?.id === armorId) {
        newState.equippedArmor.level += 1;
        newState.equippedArmor.defense += Math.floor(newState.equippedArmor.defense * 0.1);
        newState.equippedArmor.health += Math.floor(newState.equippedArmor.health * 0.1);
      } else {
        const armorIndex = newState.inventory.armor.findIndex(a => a.id === armorId);
        if (armorIndex !== -1) {
          newState.inventory.armor[armorIndex].level += 1;
          newState.inventory.armor[armorIndex].defense += Math.floor(newState.inventory.armor[armorIndex].defense * 0.1);
          newState.inventory.armor[armorIndex].health += Math.floor(newState.inventory.armor[armorIndex].health * 0.1);
        }
      }
      
      // Deduct coins
      if (!newState.cheats.freeUpgrades) {
        newState.coins -= upgradeCost;
      }
      
      // Update statistics
      newState.statistics.itemsUpgraded += 1;
      
      // Recalculate defense and health
      newState.defense = 5 + (newState.equippedArmor?.defense || 0) + newState.research.armorDefense;
      newState.maxHealth = 100 + (newState.equippedArmor?.health || 0) + newState.research.healthBoost;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Sell functions
  const sellWeapon = useCallback((weaponId: string): boolean => {
    if (!gameState) return false;
    
    const weapon = gameState.inventory.weapons.find(w => w.id === weaponId);
    if (!weapon) return false;
    
    const sellPrice = Math.floor(weapon.level * 25);
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Remove weapon from inventory
      newState.inventory.weapons = newState.inventory.weapons.filter(w => w.id !== weaponId);
      
      // Add coins
      newState.coins += sellPrice;
      newState.statistics.coinsEarned += sellPrice;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const sellArmor = useCallback((armorId: string): boolean => {
    if (!gameState) return false;
    
    const armor = gameState.inventory.armor.find(a => a.id === armorId);
    if (!armor) return false;
    
    const sellPrice = Math.floor(armor.level * 25);
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Remove armor from inventory
      newState.inventory.armor = newState.inventory.armor.filter(a => a.id !== armorId);
      
      // Add coins
      newState.coins += sellPrice;
      newState.statistics.coinsEarned += sellPrice;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Research function
  const upgradeResearch = useCallback((upgrade: keyof ResearchUpgrade): boolean => {
    if (!gameState) return false;
    
    const currentLevel = gameState.research[upgrade];
    const upgradeCost = (currentLevel + 1) * 100;
    
    if (gameState.coins < upgradeCost && !gameState.cheats.instantResearch) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Upgrade research
      newState.research[upgrade] += 1;
      
      // Deduct coins
      if (!newState.cheats.instantResearch) {
        newState.coins -= upgradeCost;
      }
      
      // Recalculate stats based on research
      newState.attack = 10 + (newState.equippedWeapon?.damage || 0) + newState.research.weaponDamage;
      newState.defense = 5 + (newState.equippedArmor?.defense || 0) + newState.research.armorDefense;
      newState.maxHealth = 100 + (newState.equippedArmor?.health || 0) + newState.research.healthBoost;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Chest opening function
  const openChest = useCallback((chestType: ChestType): Item[] | null => {
    if (!gameState) return null;
    
    const chestCosts = {
      wooden: 50,
      silver: 200,
      golden: 500,
      mythical: 1000,
    };
    
    const cost = chestCosts[chestType];
    if (gameState.coins < cost && !gameState.cheats.infiniteCoins) return null;
    
    const items: Item[] = [];
    const itemCount = chestType === 'mythical' ? 3 : chestType === 'golden' ? 2 : 1;
    
    for (let i = 0; i < itemCount; i++) {
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      
      if (itemType === 'weapon') {
        const weapon = generateWeapon(gameState.zone, chestType);
        items.push({ type: 'weapon', item: weapon });
      } else {
        const armor = generateArmor(gameState.zone, chestType);
        items.push({ type: 'armor', item: armor });
      }
    }
    
    // Chance for gems
    if (Math.random() < 0.3) {
      const gem = generateGem();
      items.push({ type: 'gem', item: gem });
    }
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Deduct coins
      if (!newState.cheats.infiniteCoins) {
        newState.coins -= cost;
      }
      
      // Add items to inventory
      items.forEach(({ type, item }) => {
        if (type === 'weapon') {
          newState.inventory.weapons.push(item as Weapon);
        } else if (type === 'armor') {
          newState.inventory.armor.push(item as Armor);
        } else if (type === 'gem') {
          newState.inventory.gems.push(item as Gem);
        }
      });
      
      // Update statistics
      newState.statistics.chestsOpened += 1;
      
      return newState;
    });
    
    return items;
  }, [gameState]);

  // Mythical item purchase
  const purchaseMythical = useCallback((item: MythicalItem): boolean => {
    if (!gameState || gameState.gems < item.cost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Deduct gems
      newState.gems -= item.cost;
      
      // Add item to inventory based on type
      if (item.type === 'weapon') {
        newState.inventory.weapons.push(item.item as Weapon);
      } else if (item.type === 'armor') {
        newState.inventory.armor.push(item.item as Armor);
      }
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Combat functions
  const startCombat = useCallback(() => {
    if (!gameState) return;
    
    const enemyHealth = gameState.zone * 50;
    const enemyAttack = gameState.zone * 10;
    
    const combat: CombatState = {
      isActive: true,
      enemyHealth,
      enemyMaxHealth: enemyHealth,
      enemyAttack,
      playerHealth: gameState.health,
      turn: 'player',
      zone: gameState.zone,
    };
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      return { ...prevState, combat };
    });
  }, [gameState]);

  const attack = useCallback(() => {
    if (!gameState?.combat) return;
    
    setGameState(prevState => {
      if (!prevState?.combat) return prevState;
      
      const newState = { ...prevState };
      const combat = { ...newState.combat };
      
      if (combat.turn === 'player') {
        // Player attacks
        const damage = calculateDamage(newState.attack, newState.research.criticalChance);
        combat.enemyHealth = Math.max(0, combat.enemyHealth - damage);
        
        newState.statistics.totalDamageDealt += damage;
        
        if (combat.enemyHealth <= 0) {
          // Enemy defeated
          const expGain = newState.zone * 10;
          const coinGain = newState.zone * 20;
          
          newState.experience += expGain;
          newState.coins += coinGain;
          newState.statistics.coinsEarned += coinGain;
          newState.statistics.enemiesDefeated += 1;
          
          // Level up check
          while (newState.experience >= newState.experienceToNext) {
            newState.experience -= newState.experienceToNext;
            newState.level += 1;
            newState.experienceToNext = newState.level * 100;
            newState.maxHealth += 10;
            newState.health = newState.maxHealth;
          }
          
          // End combat
          combat.isActive = false;
          newState.combat = null;
        } else {
          combat.turn = 'enemy';
        }
      } else {
        // Enemy attacks
        const damage = Math.max(1, combat.enemyAttack - newState.defense);
        combat.playerHealth = Math.max(0, combat.playerHealth - damage);
        newState.health = combat.playerHealth;
        
        newState.statistics.totalDamageTaken += damage;
        
        if (combat.playerHealth <= 0) {
          // Player defeated
          combat.isActive = false;
          newState.combat = null;
          newState.health = newState.maxHealth;
        } else {
          combat.turn = 'player';
        }
      }
      
      newState.combat = combat;
      return newState;
    });
  }, [gameState]);

  // Game management functions
  const resetGame = useCallback(() => {
    clearGameState();
    setGameState(null);
    setIsLoading(true);
    
    // Reinitialize game state
    setTimeout(() => {
      const initialState: GameState = {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        coins: 100,
        gems: 0,
        shinyGems: 0,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        zone: 1,
        maxZone: 1,
        equippedWeapon: null,
        equippedArmor: null,
        equippedRelic: null,
        inventory: {
          weapons: [],
          armor: [],
          gems: [],
          relics: [],
        },
        research: {
          weaponDamage: 0,
          armorDefense: 0,
          healthBoost: 0,
          coinBonus: 0,
          experienceBoost: 0,
          criticalChance: 0,
          gemFinding: 0,
          relicPower: 0,
        },
        combat: null,
        gameMode: 'normal',
        cheats: {
          infiniteCoins: false,
          infiniteGems: false,
          infiniteHealth: false,
          oneHitKill: false,
          maxLevel: false,
          unlockAllZones: false,
          instantResearch: false,
          freeUpgrades: false,
        },
        achievements: [],
        dailyRewards: {
          lastClaimDate: null,
          streak: 0,
          availableReward: null,
        },
        skills: {
          combat: 1,
          mining: 1,
          research: 1,
          luck: 1,
          activeMenuSkill: null,
          lastRollTime: null,
        },
        prestige: {
          level: 0,
          points: 0,
          totalResets: 0,
          rewards: [],
        },
        statistics: {
          totalDamageDealt: 0,
          totalDamageTaken: 0,
          enemiesDefeated: 0,
          chestsOpened: 0,
          gemsFound: 0,
          coinsEarned: 0,
          itemsUpgraded: 0,
          relicsFound: 0,
          timePlayedMinutes: 0,
          prestigeCount: 0,
        },
        lastSaveTime: new Date(),
        garden: {
          plots: Array(9).fill(null),
          water: 0,
          seeds: [],
        },
        settings: {
          soundEnabled: true,
          musicEnabled: true,
          notificationsEnabled: true,
          autoSave: true,
          theme: 'light',
          language: 'en',
          colorblindMode: false,
        },
        adventureSkills: {
          available: [],
          selected: [],
          skipCards: 3,
        },
      };
      setGameState(initialState);
      setIsLoading(false);
    }, 100);
  }, []);

  const setGameMode = useCallback((mode: GameMode) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      return { ...prevState, gameMode: mode };
    });
  }, []);

  // Cheat functions
  const toggleCheat = useCallback((cheat: CheatType) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.cheats[cheat] = !newState.cheats[cheat];
      
      // Apply cheat effects
      if (cheat === 'infiniteHealth' && newState.cheats[cheat]) {
        newState.health = newState.maxHealth;
      }
      
      if (cheat === 'maxLevel' && newState.cheats[cheat]) {
        newState.level = 999;
        newState.experience = 0;
        newState.experienceToNext = 999 * 100;
      }
      
      if (cheat === 'unlockAllZones' && newState.cheats[cheat]) {
        newState.maxZone = 100;
      }
      
      return newState;
    });
  }, []);

  const generateCheatItem = useCallback((type: 'weapon' | 'armor') => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      if (type === 'weapon') {
        const cheatWeapon = generateWeapon(99, 'mythical');
        cheatWeapon.damage *= 10;
        cheatWeapon.name = `Cheat ${cheatWeapon.name}`;
        newState.inventory.weapons.push(cheatWeapon);
      } else {
        const cheatArmor = generateArmor(99, 'mythical');
        cheatArmor.defense *= 10;
        cheatArmor.health *= 10;
        cheatArmor.name = `Cheat ${cheatArmor.name}`;
        newState.inventory.armor.push(cheatArmor);
      }
      
      return newState;
    });
  }, [gameState]);

  // Mining function
  const mineGem = useCallback((): Gem | null => {
    if (!gameState) return null;
    
    const gem = generateGem();
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.inventory.gems.push(gem);
      newState.statistics.gemsFound += 1;
      
      return newState;
    });
    
    return gem;
  }, [gameState]);

  // Gem exchange function
  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.gems < amount * 10) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.gems -= amount * 10;
      newState.shinyGems += amount;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Discard item function
  const discardItem = useCallback((type: 'weapon' | 'armor' | 'gem' | 'relic', itemId: string) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      switch (type) {
        case 'weapon':
          newState.inventory.weapons = newState.inventory.weapons.filter(w => w.id !== itemId);
          break;
        case 'armor':
          newState.inventory.armor = newState.inventory.armor.filter(a => a.id !== itemId);
          break;
        case 'gem':
          newState.inventory.gems = newState.inventory.gems.filter(g => g.id !== itemId);
          break;
        case 'relic':
          newState.inventory.relics = newState.inventory.relics.filter(r => r.id !== itemId);
          break;
      }
      
      return newState;
    });
  }, []);

  // Relic functions
  const purchaseRelic = useCallback((cost: number): Relic | null => {
    if (!gameState || gameState.shinyGems < cost) return null;
    
    const relic = generateRelic();
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.shinyGems -= cost;
      newState.inventory.relics.push(relic);
      newState.statistics.relicsFound += 1;
      
      return newState;
    });
    
    return relic;
  }, [gameState]);

  const upgradeRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;
    
    const relic = gameState.equippedRelic?.id === relicId 
      ? gameState.equippedRelic 
      : gameState.inventory.relics.find(r => r.id === relicId);
    
    if (!relic) return false;
    
    const upgradeCost = relic.level * 10;
    if (gameState.shinyGems < upgradeCost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Find and upgrade the relic
      if (newState.equippedRelic?.id === relicId) {
        newState.equippedRelic.level += 1;
        newState.equippedRelic.power += Math.floor(newState.equippedRelic.power * 0.2);
      } else {
        const relicIndex = newState.inventory.relics.findIndex(r => r.id === relicId);
        if (relicIndex !== -1) {
          newState.inventory.relics[relicIndex].level += 1;
          newState.inventory.relics[relicIndex].power += Math.floor(newState.inventory.relics[relicIndex].power * 0.2);
        }
      }
      
      // Deduct shiny gems
      newState.shinyGems -= upgradeCost;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const equipRelic = useCallback((relic: Relic) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // If there's already an equipped relic, move it back to inventory
      if (newState.equippedRelic) {
        newState.inventory.relics.push(newState.equippedRelic);
      }
      
      // Remove relic from inventory and equip it
      newState.inventory.relics = newState.inventory.relics.filter(r => r.id !== relic.id);
      newState.equippedRelic = relic;
      
      return newState;
    });
  }, []);

  const unequipRelic = useCallback(() => {
    setGameState(prevState => {
      if (!prevState?.equippedRelic) return prevState;
      
      const newState = { ...prevState };
      
      // Move equipped relic back to inventory
      newState.inventory.relics.push(newState.equippedRelic);
      newState.equippedRelic = null;
      
      return newState;
    });
  }, []);

  const sellRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;
    
    const relic = gameState.inventory.relics.find(r => r.id === relicId);
    if (!relic) return false;
    
    const sellPrice = Math.floor(relic.level * 5);
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Remove relic from inventory
      newState.inventory.relics = newState.inventory.relics.filter(r => r.id !== relicId);
      
      // Add shiny gems
      newState.shinyGems += sellPrice;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Daily rewards function
  const claimDailyReward = useCallback((): boolean => {
    if (!gameState || !gameState.dailyRewards.availableReward) return false;
    
    const reward = gameState.dailyRewards.availableReward;
    
    setGameState(prevState => {
      if (!prevState || !prevState.dailyRewards.availableReward) return prevState;
      
      const newState = { ...prevState };
      
      // Apply reward
      switch (reward.type) {
        case 'coins':
          newState.coins += reward.amount;
          newState.statistics.coinsEarned += reward.amount;
          break;
        case 'gems':
          newState.gems += reward.amount;
          break;
        case 'shinyGems':
          newState.shinyGems += reward.amount;
          break;
        case 'experience':
          newState.experience += reward.amount;
          // Level up check
          while (newState.experience >= newState.experienceToNext) {
            newState.experience -= newState.experienceToNext;
            newState.level += 1;
            newState.experienceToNext = newState.level * 100;
            newState.maxHealth += 10;
            newState.health = newState.maxHealth;
          }
          break;
      }
      
      // Update daily rewards
      newState.dailyRewards.lastClaimDate = new Date();
      newState.dailyRewards.streak += 1;
      newState.dailyRewards.availableReward = null;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Skill upgrade function
  const upgradeSkill = useCallback((skill: keyof Skill, cost: number): boolean => {
    if (!gameState || gameState.coins < cost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Upgrade skill
      if (typeof newState.skills[skill] === 'number') {
        (newState.skills[skill] as number) += 1;
      }
      
      // Deduct coins
      newState.coins -= cost;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Prestige function
  const prestige = useCallback((): boolean => {
    if (!gameState || gameState.level < 100) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.level < 100) return prevState;
      
      const prestigePoints = Math.floor(prevState.level / 10);
      
      const newState: GameState = {
        ...prevState,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        coins: 100,
        gems: 0,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        zone: 1,
        equippedWeapon: null,
        equippedArmor: null,
        inventory: {
          weapons: [],
          armor: [],
          gems: [],
          relics: prevState.inventory.relics, // Keep relics
        },
        research: {
          weaponDamage: 0,
          armorDefense: 0,
          healthBoost: 0,
          coinBonus: 0,
          experienceBoost: 0,
          criticalChance: 0,
          gemFinding: 0,
          relicPower: 0,
        },
        combat: null,
        prestige: {
          level: prevState.prestige.level + 1,
          points: prevState.prestige.points + prestigePoints,
          totalResets: prevState.prestige.totalResets + 1,
          rewards: prevState.prestige.rewards,
        },
        statistics: {
          ...prevState.statistics,
          prestigeCount: prevState.statistics.prestigeCount + 1,
        },
      };
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Offline rewards function
  const claimOfflineRewards = useCallback((): OfflineReward | null => {
    if (!gameState) return null;
    
    const now = new Date();
    const lastSave = new Date(gameState.lastSaveTime);
    const offlineMinutes = Math.floor((now.getTime() - lastSave.getTime()) / (1000 * 60));
    
    if (offlineMinutes < 5) return null; // Minimum 5 minutes offline
    
    const rewards = calculateOfflineRewards(offlineMinutes, gameState);
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Apply rewards
      newState.coins += rewards.coins;
      newState.experience += rewards.experience;
      newState.statistics.coinsEarned += rewards.coins;
      
      // Level up check
      while (newState.experience >= newState.experienceToNext) {
        newState.experience -= newState.experienceToNext;
        newState.level += 1;
        newState.experienceToNext = newState.level * 100;
        newState.maxHealth += 10;
        newState.health = newState.maxHealth;
      }
      
      newState.lastSaveTime = now;
      
      return newState;
    });
    
    return rewards;
  }, [gameState]);

  // Bulk actions
  const bulkSell = useCallback((action: BulkAction): number => {
    if (!gameState) return 0;
    
    let totalValue = 0;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      if (action.type === 'weapon') {
        const weaponsToSell = newState.inventory.weapons.filter(w => 
          action.rarity ? w.rarity === action.rarity : true
        );
        
        weaponsToSell.forEach(weapon => {
          totalValue += Math.floor(weapon.level * 25);
        });
        
        newState.inventory.weapons = newState.inventory.weapons.filter(w => 
          action.rarity ? w.rarity !== action.rarity : false
        );
      } else if (action.type === 'armor') {
        const armorToSell = newState.inventory.armor.filter(a => 
          action.rarity ? a.rarity === action.rarity : true
        );
        
        armorToSell.forEach(armor => {
          totalValue += Math.floor(armor.level * 25);
        });
        
        newState.inventory.armor = newState.inventory.armor.filter(a => 
          action.rarity ? a.rarity !== action.rarity : false
        );
      }
      
      newState.coins += totalValue;
      newState.statistics.coinsEarned += totalValue;
      
      return newState;
    });
    
    return totalValue;
  }, [gameState]);

  const bulkUpgrade = useCallback((action: BulkAction): number => {
    if (!gameState) return 0;
    
    let totalCost = 0;
    let upgradeCount = 0;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      if (action.type === 'weapon') {
        const weaponsToUpgrade = newState.inventory.weapons.filter(w => 
          action.rarity ? w.rarity === action.rarity : true
        );
        
        weaponsToUpgrade.forEach(weapon => {
          const cost = weapon.level * 50;
          if (newState.coins >= cost || newState.cheats.freeUpgrades) {
            if (!newState.cheats.freeUpgrades) {
              totalCost += cost;
              newState.coins -= cost;
            }
            weapon.level += 1;
            weapon.damage += Math.floor(weapon.damage * 0.1);
            upgradeCount += 1;
          }
        });
      } else if (action.type === 'armor') {
        const armorToUpgrade = newState.inventory.armor.filter(a => 
          action.rarity ? a.rarity === action.rarity : true
        );
        
        armorToUpgrade.forEach(armor => {
          const cost = armor.level * 50;
          if (newState.coins >= cost || newState.cheats.freeUpgrades) {
            if (!newState.cheats.freeUpgrades) {
              totalCost += cost;
              newState.coins -= cost;
            }
            armor.level += 1;
            armor.defense += Math.floor(armor.defense * 0.1);
            armor.health += Math.floor(armor.health * 0.1);
            upgradeCount += 1;
          }
        });
      }
      
      newState.statistics.itemsUpgraded += upgradeCount;
      
      return newState;
    });
    
    return upgradeCount;
  }, [gameState]);

  // Garden functions
  const plantSeed = useCallback((plotIndex: number, seed: Seed): boolean => {
    if (!gameState || plotIndex < 0 || plotIndex >= 9) return false;
    if (gameState.garden.plots[plotIndex] !== null) return false;
    
    const seedIndex = gameState.garden.seeds.findIndex(s => s.id === seed.id);
    if (seedIndex === -1) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Plant seed
      newState.garden.plots[plotIndex] = {
        seed,
        plantedAt: new Date(),
        wateredAt: null,
        isReady: false,
      };
      
      // Remove seed from inventory
      newState.garden.seeds.splice(seedIndex, 1);
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const buyWater = useCallback((amount: number): boolean => {
    if (!gameState) return false;
    
    const cost = amount * 10;
    if (gameState.coins < cost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.coins -= cost;
      newState.garden.water += amount;
      newState.statistics.coinsEarned -= cost;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Settings function
  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      return {
        ...prevState,
        settings: {
          ...prevState.settings,
          ...settings,
        },
      };
    });
  }, []);

  // Debug functions
  const addCoins = useCallback((amount: number) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      return {
        ...prevState,
        coins: prevState.coins + amount,
      };
    });
  }, []);

  const addGems = useCallback((amount: number) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      return {
        ...prevState,
        gems: prevState.gems + amount,
      };
    });
  }, []);

  const teleportToZone = useCallback((zone: number) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      return {
        ...prevState,
        zone: Math.max(1, Math.min(zone, prevState.maxZone)),
      };
    });
  }, []);

  const setExperience = useCallback((exp: number) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.experience = exp;
      
      // Level up check
      while (newState.experience >= newState.experienceToNext) {
        newState.experience -= newState.experienceToNext;
        newState.level += 1;
        newState.experienceToNext = newState.level * 100;
        newState.maxHealth += 10;
        newState.health = newState.maxHealth;
      }
      
      return newState;
    });
  }, []);

  // Adventure skills functions
  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Add to selected skills
      newState.adventureSkills.selected.push(skill);
      
      // Remove from available skills
      newState.adventureSkills.available = newState.adventureSkills.available.filter(s => s.id !== skill.id);
      
      return newState;
    });
  }, []);

  const skipAdventureSkills = useCallback(() => {
    setGameState(prevState => {
      if (!prevState || prevState.adventureSkills.skipCards <= 0) return prevState;
      
      const newState = { ...prevState };
      
      // Clear available skills
      newState.adventureSkills.available = [];
      
      // Use skip card
      newState.adventureSkills.skipCards -= 1;
      
      return newState;
    });
  }, []);

  const useSkipCard = useCallback((): boolean => {
    if (!gameState || gameState.adventureSkills.skipCards <= 0) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.adventureSkills.skipCards <= 0) return prevState;
      
      const newState = { ...prevState };
      newState.adventureSkills.skipCards -= 1;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Skills function
  const rollSkill = useCallback((): boolean => {
    if (!gameState || gameState.coins < 100) return false;
    
    const skillTypes = [
      'coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter',
      'time_warp', 'golden_touch', 'knowledge_boost', 'durability_master', 'relic_finder'
    ];
    
    const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)];
    const durations = {
      coin_vacuum: 60, // 1 hour
      treasurer: 1, // Instant effect
      xp_surge: 24, // 24 hours
      luck_gem: 1, // 1 hour
      enchanter: 12, // 12 hours
      time_warp: 12, // 12 hours
      golden_touch: 8, // 8 hours
      knowledge_boost: 24, // 24 hours
      durability_master: 6, // 6 hours
      relic_finder: 1, // Instant effect for next 3 refreshes
    };
    
    const duration = durations[randomType as keyof typeof durations];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
    
    const skill: MenuSkill = {
      id: Math.random().toString(36).substr(2, 9),
      name: randomType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: getSkillDescription(randomType),
      duration,
      activatedAt: now,
      expiresAt,
      type: randomType as any,
    };
    
    setGameState(prevState => {
      if (!prevState || prevState.coins < 100) return prevState;
      
      return {
        ...prevState,
        coins: prevState.cheats.infiniteCoins ? prevState.coins : prevState.coins - 100,
        skills: {
          ...prevState.skills,
          activeMenuSkill: skill,
          lastRollTime: now,
        },
      };
    });
    
    return true;
  }, [gameState]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    upgradeResearch,
    openChest,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    discardItem,
    purchaseRelic,
    upgradeRelic,
    equipRelic,
    unequipRelic,
    sellRelic,
    claimDailyReward,
    upgradeSkill,
    prestige,
    claimOfflineRewards,
    bulkSell,
    bulkUpgrade,
    plantSeed,
    buyWater,
    updateSettings,
    addCoins,
    addGems,
    teleportToZone,
    setExperience,
    rollSkill,
    selectAdventureSkill,
    skipAdventureSkills,
    useSkipCard,
  };
};