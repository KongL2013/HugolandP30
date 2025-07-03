import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, ChestReward, AdventureSkill, MenuSkill, GameSettings } from '../types/game';
import { saveGameState, loadGameState, clearGameState } from '../utils/storage';
import { generateWeapon, generateArmor, calculateDamage, generateGem, generateRelicItem, calculateOfflineRewards, getSkillDescription } from '../utils/gameUtils';
import { initializeAchievements, checkAchievements } from '../utils/achievements';
import { initializePlayerTags, checkPlayerTags } from '../utils/playerTags';

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
            coins: 100,
            gems: 0,
            shinyGems: 0,
            zone: 1,
            playerStats: {
              hp: 100,
              maxHp: 100,
              atk: 10,
              def: 5,
              baseAtk: 10,
              baseDef: 5,
              baseHp: 100,
            },
            inventory: {
              weapons: [],
              armor: [],
              relics: [],
              currentWeapon: null,
              currentArmor: null,
              equippedRelics: [],
            },
            currentEnemy: null,
            inCombat: false,
            combatLog: [],
            research: {
              level: 0,
              totalSpent: 0,
              availableUpgrades: ['atk', 'def', 'hp'],
            },
            isPremium: false,
            achievements: initializeAchievements(),
            collectionBook: {
              weapons: {},
              armor: {},
              totalWeaponsFound: 0,
              totalArmorFound: 0,
              rarityStats: {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0,
                mythical: 0,
              },
            },
            knowledgeStreak: {
              current: 0,
              best: 0,
              multiplier: 1,
            },
            gameMode: {
              current: 'normal',
              speedModeActive: false,
              survivalLives: 3,
              maxSurvivalLives: 3,
              timeAttackScore: 0,
              timeAttackTimeLeft: 60,
              bossProgress: 0,
            },
            statistics: {
              totalQuestionsAnswered: 0,
              correctAnswers: 0,
              totalPlayTime: 0,
              zonesReached: 1,
              itemsCollected: 0,
              coinsEarned: 0,
              gemsEarned: 0,
              shinyGemsEarned: 0,
              chestsOpened: 0,
              accuracyByCategory: {},
              sessionStartTime: new Date(),
              totalDeaths: 0,
              totalVictories: 0,
              longestStreak: 0,
              fastestVictory: 0,
              totalDamageDealt: 0,
              totalDamageTaken: 0,
              itemsUpgraded: 0,
              itemsSold: 0,
              totalResearchSpent: 0,
              averageAccuracy: 0,
              revivals: 0,
            },
            cheats: {
              infiniteCoins: false,
              infiniteGems: false,
              obtainAnyItem: false,
            },
            mining: {
              totalGemsMined: 0,
              totalShinyGemsMined: 0,
            },
            yojefMarket: {
              items: [],
              lastRefresh: new Date(),
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            },
            playerTags: initializePlayerTags(),
            dailyRewards: {
              lastClaimDate: null,
              currentStreak: 0,
              maxStreak: 0,
              availableReward: null,
              rewardHistory: [],
            },
            progression: {
              level: 1,
              experience: 0,
              experienceToNext: 100,
              skillPoints: 0,
              unlockedSkills: [],
              prestigeLevel: 0,
              prestigePoints: 0,
              masteryLevels: {},
            },
            offlineProgress: {
              lastSaveTime: new Date(),
              offlineCoins: 0,
              offlineGems: 0,
              offlineExperience: 0,
              offlineTime: 0,
              maxOfflineHours: 24,
            },
            gardenOfGrowth: {
              isPlanted: false,
              plantedAt: null,
              lastWatered: null,
              waterHoursRemaining: 0,
              growthCm: 0,
              totalGrowthBonus: 0,
              seedCost: 1000,
              waterCost: 100,
              maxGrowthCm: 100,
            },
            settings: {
              colorblindMode: false,
              darkMode: true,
              language: 'en',
              notifications: true,
            },
            hasUsedRevival: false,
            skills: {
              activeMenuSkill: null,
              lastRollTime: null,
              playTimeThisSession: 0,
              sessionStartTime: new Date(),
            },
            adventureSkills: {
              selectedSkill: null,
              availableSkills: [],
              showSelectionModal: false,
              skillEffects: {
                skipCardUsed: false,
                metalShieldUsed: false,
                dodgeUsed: false,
                truthLiesActive: false,
                lightningChainActive: false,
                rampActive: false,
                berserkerActive: false,
                vampiricActive: false,
                phoenixUsed: false,
                timeSlowActive: false,
                criticalStrikeActive: false,
                shieldWallActive: false,
                poisonBladeActive: false,
                arcaneShieldActive: false,
                battleFrenzyActive: false,
              },
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
      if (newState.inventory.currentWeapon) {
        newState.inventory.weapons.push(newState.inventory.currentWeapon);
      }
      
      // Remove weapon from inventory and equip it
      newState.inventory.weapons = newState.inventory.weapons.filter(w => w.id !== weapon.id);
      newState.inventory.currentWeapon = weapon;
      
      // Recalculate stats
      newState.playerStats.atk = newState.playerStats.baseAtk + (weapon.baseAtk || 0);
      
      return newState;
    });
  }, []);

  const equipArmor = useCallback((armor: Armor) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // If there's already equipped armor, move it back to inventory
      if (newState.inventory.currentArmor) {
        newState.inventory.armor.push(newState.inventory.currentArmor);
      }
      
      // Remove armor from inventory and equip it
      newState.inventory.armor = newState.inventory.armor.filter(a => a.id !== armor.id);
      newState.inventory.currentArmor = armor;
      
      // Recalculate stats
      newState.playerStats.def = newState.playerStats.baseDef + (armor.baseDef || 0);
      
      return newState;
    });
  }, []);

  // Upgrade functions
  const upgradeWeapon = useCallback((weaponId: string): boolean => {
    if (!gameState) return false;
    
    const weapon = gameState.inventory.currentWeapon?.id === weaponId 
      ? gameState.inventory.currentWeapon 
      : gameState.inventory.weapons.find(w => w.id === weaponId);
    
    if (!weapon) return false;
    
    const upgradeCost = weapon.upgradeCost;
    if (gameState.gems < upgradeCost && !gameState.cheats.infiniteGems) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Find and upgrade the weapon
      if (newState.inventory.currentWeapon?.id === weaponId) {
        newState.inventory.currentWeapon.level += 1;
        newState.inventory.currentWeapon.baseAtk += Math.floor(newState.inventory.currentWeapon.baseAtk * 0.1);
      } else {
        const weaponIndex = newState.inventory.weapons.findIndex(w => w.id === weaponId);
        if (weaponIndex !== -1) {
          newState.inventory.weapons[weaponIndex].level += 1;
          newState.inventory.weapons[weaponIndex].baseAtk += Math.floor(newState.inventory.weapons[weaponIndex].baseAtk * 0.1);
        }
      }
      
      // Deduct gems
      if (!newState.cheats.infiniteGems) {
        newState.gems -= upgradeCost;
      }
      
      // Update statistics
      newState.statistics.itemsUpgraded += 1;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const upgradeArmor = useCallback((armorId: string): boolean => {
    if (!gameState) return false;
    
    const armor = gameState.inventory.currentArmor?.id === armorId 
      ? gameState.inventory.currentArmor 
      : gameState.inventory.armor.find(a => a.id === armorId);
    
    if (!armor) return false;
    
    const upgradeCost = armor.upgradeCost;
    if (gameState.gems < upgradeCost && !gameState.cheats.infiniteGems) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Find and upgrade the armor
      if (newState.inventory.currentArmor?.id === armorId) {
        newState.inventory.currentArmor.level += 1;
        newState.inventory.currentArmor.baseDef += Math.floor(newState.inventory.currentArmor.baseDef * 0.1);
      } else {
        const armorIndex = newState.inventory.armor.findIndex(a => a.id === armorId);
        if (armorIndex !== -1) {
          newState.inventory.armor[armorIndex].level += 1;
          newState.inventory.armor[armorIndex].baseDef += Math.floor(newState.inventory.armor[armorIndex].baseDef * 0.1);
        }
      }
      
      // Deduct gems
      if (!newState.cheats.infiniteGems) {
        newState.gems -= upgradeCost;
      }
      
      // Update statistics
      newState.statistics.itemsUpgraded += 1;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Sell functions
  const sellWeapon = useCallback((weaponId: string): boolean => {
    if (!gameState) return false;
    
    const weapon = gameState.inventory.weapons.find(w => w.id === weaponId);
    if (!weapon) return false;
    
    const sellPrice = weapon.sellPrice;
    
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
    
    const sellPrice = armor.sellPrice;
    
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
  const upgradeResearch = useCallback((upgrade: 'atk' | 'def' | 'hp'): void => {
    if (!gameState) return;
    
    const upgradeCost = (gameState.research.level + 1) * 100;
    
    if (gameState.coins < upgradeCost && !gameState.cheats.infiniteCoins) return;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Upgrade research
      newState.research.level += 1;
      newState.research.totalSpent += upgradeCost;
      
      // Deduct coins
      if (!newState.cheats.infiniteCoins) {
        newState.coins -= upgradeCost;
      }
      
      return newState;
    });
  }, [gameState]);

  // Chest opening function
  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState) return null;
    
    if (gameState.coins < cost && !gameState.cheats.infiniteCoins) return null;
    
    const items: (Weapon | Armor)[] = [];
    const itemCount = cost >= 1000 ? 3 : cost >= 400 ? 2 : 1;
    
    for (let i = 0; i < itemCount; i++) {
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      
      if (itemType === 'weapon') {
        const weapon = generateWeapon();
        items.push(weapon);
      } else {
        const armor = generateArmor();
        items.push(armor);
      }
    }
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Deduct coins
      if (!newState.cheats.infiniteCoins) {
        newState.coins -= cost;
      }
      
      // Add items to inventory
      items.forEach(item => {
        if ('baseAtk' in item) {
          newState.inventory.weapons.push(item as Weapon);
        } else {
          newState.inventory.armor.push(item as Armor);
        }
      });
      
      // Update statistics
      newState.statistics.chestsOpened += 1;
      
      return newState;
    });
    
    return { type: 'weapon', items };
  }, [gameState]);

  // Combat functions
  const startCombat = useCallback(() => {
    if (!gameState) return;
    
    const enemyHealth = gameState.zone * 50;
    const enemyAttack = gameState.zone * 10;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      return { 
        ...prevState, 
        inCombat: true,
        currentEnemy: {
          name: `Zone ${prevState.zone} Enemy`,
          hp: enemyHealth,
          maxHp: enemyHealth,
          atk: enemyAttack,
          def: Math.floor(prevState.zone * 2),
          zone: prevState.zone,
        }
      };
    });
  }, [gameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    if (!gameState?.currentEnemy) return;
    
    setGameState(prevState => {
      if (!prevState?.currentEnemy) return prevState;
      
      const newState = { ...prevState };
      
      if (hit) {
        // Player hits
        const damage = calculateDamage(newState.playerStats.atk, 0);
        newState.currentEnemy!.hp = Math.max(0, newState.currentEnemy!.hp - damage);
        newState.combatLog.push(`You deal ${damage} damage!`);
        
        if (newState.currentEnemy!.hp <= 0) {
          // Enemy defeated
          const coinGain = newState.zone * 20;
          const expGain = newState.zone * 10;
          
          newState.coins += coinGain;
          newState.progression.experience += expGain;
          newState.statistics.coinsEarned += coinGain;
          newState.statistics.totalVictories += 1;
          
          // Level up check
          while (newState.progression.experience >= newState.progression.experienceToNext) {
            newState.progression.experience -= newState.progression.experienceToNext;
            newState.progression.level += 1;
            newState.progression.experienceToNext = newState.progression.level * 100;
            newState.progression.skillPoints += 1;
          }
          
          // End combat
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.zone += 1;
          newState.combatLog.push(`Victory! Moving to zone ${newState.zone}`);
        }
      } else {
        // Player misses, enemy attacks
        const damage = Math.max(1, newState.currentEnemy!.atk - newState.playerStats.def);
        newState.playerStats.hp = Math.max(0, newState.playerStats.hp - damage);
        newState.combatLog.push(`Enemy deals ${damage} damage to you!`);
        
        if (newState.playerStats.hp <= 0) {
          // Player defeated
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.playerStats.hp = newState.playerStats.maxHp;
          newState.statistics.totalDeaths += 1;
          newState.combatLog.push('You were defeated! Respawning...');
        }
      }
      
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
        coins: 100,
        gems: 0,
        shinyGems: 0,
        zone: 1,
        playerStats: {
          hp: 100,
          maxHp: 100,
          atk: 10,
          def: 5,
          baseAtk: 10,
          baseDef: 5,
          baseHp: 100,
        },
        inventory: {
          weapons: [],
          armor: [],
          relics: [],
          currentWeapon: null,
          currentArmor: null,
          equippedRelics: [],
        },
        currentEnemy: null,
        inCombat: false,
        combatLog: [],
        research: {
          level: 0,
          totalSpent: 0,
          availableUpgrades: ['atk', 'def', 'hp'],
        },
        isPremium: false,
        achievements: initializeAchievements(),
        collectionBook: {
          weapons: {},
          armor: {},
          totalWeaponsFound: 0,
          totalArmorFound: 0,
          rarityStats: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythical: 0,
          },
        },
        knowledgeStreak: {
          current: 0,
          best: 0,
          multiplier: 1,
        },
        gameMode: {
          current: 'normal',
          speedModeActive: false,
          survivalLives: 3,
          maxSurvivalLives: 3,
          timeAttackScore: 0,
          timeAttackTimeLeft: 60,
          bossProgress: 0,
        },
        statistics: {
          totalQuestionsAnswered: 0,
          correctAnswers: 0,
          totalPlayTime: 0,
          zonesReached: 1,
          itemsCollected: 0,
          coinsEarned: 0,
          gemsEarned: 0,
          shinyGemsEarned: 0,
          chestsOpened: 0,
          accuracyByCategory: {},
          sessionStartTime: new Date(),
          totalDeaths: 0,
          totalVictories: 0,
          longestStreak: 0,
          fastestVictory: 0,
          totalDamageDealt: 0,
          totalDamageTaken: 0,
          itemsUpgraded: 0,
          itemsSold: 0,
          totalResearchSpent: 0,
          averageAccuracy: 0,
          revivals: 0,
        },
        cheats: {
          infiniteCoins: false,
          infiniteGems: false,
          obtainAnyItem: false,
        },
        mining: {
          totalGemsMined: 0,
          totalShinyGemsMined: 0,
        },
        yojefMarket: {
          items: [],
          lastRefresh: new Date(),
          nextRefresh: new Date(Date.now() + 5 * 60 * 1000),
        },
        playerTags: initializePlayerTags(),
        dailyRewards: {
          lastClaimDate: null,
          currentStreak: 0,
          maxStreak: 0,
          availableReward: null,
          rewardHistory: [],
        },
        progression: {
          level: 1,
          experience: 0,
          experienceToNext: 100,
          skillPoints: 0,
          unlockedSkills: [],
          prestigeLevel: 0,
          prestigePoints: 0,
          masteryLevels: {},
        },
        offlineProgress: {
          lastSaveTime: new Date(),
          offlineCoins: 0,
          offlineGems: 0,
          offlineExperience: 0,
          offlineTime: 0,
          maxOfflineHours: 24,
        },
        gardenOfGrowth: {
          isPlanted: false,
          plantedAt: null,
          lastWatered: null,
          waterHoursRemaining: 0,
          growthCm: 0,
          totalGrowthBonus: 0,
          seedCost: 1000,
          waterCost: 100,
          maxGrowthCm: 100,
        },
        settings: {
          colorblindMode: false,
          darkMode: true,
          language: 'en',
          notifications: true,
        },
        hasUsedRevival: false,
        skills: {
          activeMenuSkill: null,
          lastRollTime: null,
          playTimeThisSession: 0,
          sessionStartTime: new Date(),
        },
        adventureSkills: {
          selectedSkill: null,
          availableSkills: [],
          showSelectionModal: false,
          skillEffects: {
            skipCardUsed: false,
            metalShieldUsed: false,
            dodgeUsed: false,
            truthLiesActive: false,
            lightningChainActive: false,
            rampActive: false,
            berserkerActive: false,
            vampiricActive: false,
            phoenixUsed: false,
            timeSlowActive: false,
            criticalStrikeActive: false,
            shieldWallActive: false,
            poisonBladeActive: false,
            arcaneShieldActive: false,
            battleFrenzyActive: false,
          },
        },
      };
      setGameState(initialState);
      setIsLoading(false);
    }, 100);
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'crazy' | 'survival' | 'timeAttack' | 'boss') => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      return { 
        ...prevState, 
        gameMode: { 
          ...prevState.gameMode, 
          current: mode 
        } 
      };
    });
  }, []);

  // Cheat functions
  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.cheats[cheat] = !newState.cheats[cheat];
      
      return newState;
    });
  }, []);

  const generateCheatItem = useCallback((type: 'weapon' | 'armor') => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      if (type === 'weapon') {
        const cheatWeapon = generateWeapon(false, 'mythical');
        cheatWeapon.baseAtk *= 10;
        cheatWeapon.name = `Cheat ${cheatWeapon.name}`;
        newState.inventory.weapons.push(cheatWeapon);
      } else {
        const cheatArmor = generateArmor(false, 'mythical');
        cheatArmor.baseDef *= 10;
        cheatArmor.name = `Cheat ${cheatArmor.name}`;
        newState.inventory.armor.push(cheatArmor);
      }
      
      return newState;
    });
  }, [gameState]);

  // Mining function
  const mineGem = useCallback((x: number, y: number): { gems: number; shinyGems: number } | null => {
    if (!gameState) return null;
    
    const isShiny = Math.random() < 0.05; // 5% chance for shiny
    const gems = isShiny ? 0 : 1;
    const shinyGems = isShiny ? 1 : 0;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.gems += gems;
      newState.shinyGems += shinyGems;
      newState.mining.totalGemsMined += gems;
      newState.mining.totalShinyGemsMined += shinyGems;
      
      return newState;
    });
    
    return { gems, shinyGems };
  }, [gameState]);

  // Gem exchange function
  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.shinyGems -= amount;
      newState.gems += amount * 10; // 1 shiny = 10 regular gems
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Discard item function
  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      if (type === 'weapon') {
        newState.inventory.weapons = newState.inventory.weapons.filter(w => w.id !== itemId);
      } else {
        newState.inventory.armor = newState.inventory.armor.filter(a => a.id !== itemId);
      }
      
      return newState;
    });
  }, []);

  // Relic functions
  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;
    
    const relic = gameState.yojefMarket.items.find(r => r.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.gems -= relic.cost;
      newState.inventory.relics.push(relic);
      newState.yojefMarket.items = newState.yojefMarket.items.filter(r => r.id !== relicId);
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const upgradeRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;
    
    const relic = gameState.inventory.relics.find(r => r.id === relicId) ||
                  gameState.inventory.equippedRelics.find(r => r.id === relicId);
    
    if (!relic || gameState.gems < relic.upgradeCost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.gems -= relic.upgradeCost;
      
      // Find and upgrade the relic
      const relicIndex = newState.inventory.relics.findIndex(r => r.id === relicId);
      if (relicIndex !== -1) {
        newState.inventory.relics[relicIndex].level += 1;
        if (newState.inventory.relics[relicIndex].baseAtk) {
          newState.inventory.relics[relicIndex].baseAtk! += 10;
        }
        if (newState.inventory.relics[relicIndex].baseDef) {
          newState.inventory.relics[relicIndex].baseDef! += 5;
        }
      }
      
      const equippedIndex = newState.inventory.equippedRelics.findIndex(r => r.id === relicId);
      if (equippedIndex !== -1) {
        newState.inventory.equippedRelics[equippedIndex].level += 1;
        if (newState.inventory.equippedRelics[equippedIndex].baseAtk) {
          newState.inventory.equippedRelics[equippedIndex].baseAtk! += 10;
        }
        if (newState.inventory.equippedRelics[equippedIndex].baseDef) {
          newState.inventory.equippedRelics[equippedIndex].baseDef! += 5;
        }
      }
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const equipRelic = useCallback((relicId: string): void => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      const relicIndex = newState.inventory.relics.findIndex(r => r.id === relicId);
      
      if (relicIndex !== -1 && newState.inventory.equippedRelics.length < 5) {
        const relic = newState.inventory.relics[relicIndex];
        newState.inventory.relics.splice(relicIndex, 1);
        newState.inventory.equippedRelics.push(relic);
      }
      
      return newState;
    });
  }, []);

  const unequipRelic = useCallback((relicId: string): void => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      const relicIndex = newState.inventory.equippedRelics.findIndex(r => r.id === relicId);
      
      if (relicIndex !== -1) {
        const relic = newState.inventory.equippedRelics[relicIndex];
        newState.inventory.equippedRelics.splice(relicIndex, 1);
        newState.inventory.relics.push(relic);
      }
      
      return newState;
    });
  }, []);

  const sellRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.inventory.relics = newState.inventory.relics.filter(r => r.id !== relicId);
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Daily rewards function
  const claimDailyReward = useCallback((): boolean => {
    if (!gameState?.dailyRewards.availableReward) return false;
    
    setGameState(prevState => {
      if (!prevState?.dailyRewards.availableReward) return prevState;
      
      const newState = { ...prevState };
      const reward = newState.dailyRewards.availableReward;
      
      // Apply reward
      newState.coins += reward.coins;
      newState.gems += reward.gems;
      
      // Update daily rewards
      newState.dailyRewards.lastClaimDate = new Date();
      newState.dailyRewards.currentStreak += 1;
      newState.dailyRewards.availableReward = null;
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Skill upgrade function
  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState || gameState.progression.skillPoints <= 0) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.progression.skillPoints <= 0) return prevState;
      
      const newState = { ...prevState };
      newState.progression.skillPoints -= 1;
      newState.progression.unlockedSkills.push(skillId);
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Prestige function
  const prestige = useCallback((): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.progression.level < 50) return prevState;
      
      const prestigePoints = Math.floor(prevState.progression.level / 10);
      
      const newState: GameState = {
        ...prevState,
        progression: {
          level: 1,
          experience: 0,
          experienceToNext: 100,
          skillPoints: 0,
          unlockedSkills: [],
          prestigeLevel: prevState.progression.prestigeLevel + 1,
          prestigePoints: prevState.progression.prestigePoints + prestigePoints,
          masteryLevels: prevState.progression.masteryLevels,
        },
        coins: 100,
        gems: 0,
        zone: 1,
        playerStats: {
          hp: 100,
          maxHp: 100,
          atk: 10,
          def: 5,
          baseAtk: 10,
          baseDef: 5,
          baseHp: 100,
        },
        inventory: {
          weapons: [],
          armor: [],
          relics: prevState.inventory.relics, // Keep relics
          currentWeapon: null,
          currentArmor: null,
          equippedRelics: prevState.inventory.equippedRelics,
        },
        research: {
          level: 0,
          totalSpent: 0,
          availableUpgrades: ['atk', 'def', 'hp'],
        },
      };
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  // Offline rewards function
  const claimOfflineRewards = useCallback((): void => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      
      // Apply rewards
      newState.coins += newState.offlineProgress.offlineCoins;
      newState.gems += newState.offlineProgress.offlineGems;
      newState.progression.experience += newState.offlineProgress.offlineExperience;
      
      // Clear offline progress
      newState.offlineProgress.offlineCoins = 0;
      newState.offlineProgress.offlineGems = 0;
      newState.offlineProgress.offlineExperience = 0;
      newState.offlineProgress.offlineTime = 0;
      
      return newState;
    });
  }, [gameState]);

  // Bulk actions
  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor'): void => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      let totalValue = 0;
      
      if (type === 'weapon') {
        const weaponsToSell = newState.inventory.weapons.filter(w => itemIds.includes(w.id));
        weaponsToSell.forEach(weapon => {
          totalValue += weapon.sellPrice;
        });
        newState.inventory.weapons = newState.inventory.weapons.filter(w => !itemIds.includes(w.id));
      } else {
        const armorToSell = newState.inventory.armor.filter(a => itemIds.includes(a.id));
        armorToSell.forEach(armor => {
          totalValue += armor.sellPrice;
        });
        newState.inventory.armor = newState.inventory.armor.filter(a => !itemIds.includes(a.id));
      }
      
      newState.coins += totalValue;
      newState.statistics.coinsEarned += totalValue;
      
      return newState;
    });
  }, []);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor'): void => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      let totalCost = 0;
      
      if (type === 'weapon') {
        itemIds.forEach(id => {
          const weapon = newState.inventory.weapons.find(w => w.id === id);
          if (weapon && newState.gems >= weapon.upgradeCost) {
            totalCost += weapon.upgradeCost;
            weapon.level += 1;
            weapon.baseAtk += Math.floor(weapon.baseAtk * 0.1);
          }
        });
      } else {
        itemIds.forEach(id => {
          const armor = newState.inventory.armor.find(a => a.id === id);
          if (armor && newState.gems >= armor.upgradeCost) {
            totalCost += armor.upgradeCost;
            armor.level += 1;
            armor.baseDef += Math.floor(armor.baseDef * 0.1);
          }
        });
      }
      
      newState.gems -= totalCost;
      
      return newState;
    });
  }, []);

  // Garden functions
  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.coins < prevState.gardenOfGrowth.seedCost) return prevState;
      
      const newState = { ...prevState };
      newState.coins -= newState.gardenOfGrowth.seedCost;
      newState.gardenOfGrowth.isPlanted = true;
      newState.gardenOfGrowth.plantedAt = new Date();
      
      return newState;
    });
    
    return true;
  }, [gameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState) return false;
    
    const cost = Math.floor(gameState.gardenOfGrowth.waterCost * hours / 24);
    if (gameState.coins < cost) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.coins -= cost;
      newState.gardenOfGrowth.waterHoursRemaining += hours;
      
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
        zone: Math.max(1, zone),
      };
    });
  }, []);

  const setExperience = useCallback((exp: number) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.progression.experience = exp;
      
      // Level up check
      while (newState.progression.experience >= newState.progression.experienceToNext) {
        newState.progression.experience -= newState.progression.experienceToNext;
        newState.progression.level += 1;
        newState.progression.experienceToNext = newState.progression.level * 100;
        newState.progression.skillPoints += 1;
      }
      
      return newState;
    });
  }, []);

  // Adventure skills functions
  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.adventureSkills.selectedSkill = skill;
      newState.adventureSkills.showSelectionModal = false;
      
      return newState;
    });
  }, []);

  const skipAdventureSkills = useCallback(() => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.adventureSkills.showSelectionModal = false;
      
      return newState;
    });
  }, []);

  const useSkipCard = useCallback((): boolean => {
    if (!gameState) return false;
    
    setGameState(prevState => {
      if (!prevState) return prevState;
      
      const newState = { ...prevState };
      newState.adventureSkills.skillEffects.skipCardUsed = true;
      
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const skill: MenuSkill = {
      id: Math.random().toString(36).substr(2, 9),
      name: randomType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: getSkillDescription(randomType),
      duration: 24,
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

  // Mythical purchase function
  const purchaseMythical = useCallback((cost: number): boolean => {
    if (!gameState || gameState.gems < cost) return false;
    
    setGameState(prevState => {
      if (!prevState || prevState.gems < cost) return prevState;
      
      const newState = { ...prevState };
      newState.gems -= cost;
      
      // Generate a mythical item
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      if (itemType === 'weapon') {
        const weapon = generateWeapon(false, 'mythical');
        newState.inventory.weapons.push(weapon);
      } else {
        const armor = generateArmor(false, 'mythical');
        newState.inventory.armor.push(armor);
      }
      
      return newState;
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