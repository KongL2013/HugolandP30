import { Weapon, Armor, Enemy, RelicItem, GameState, OfflineReward } from '../types/game';
import { getColorblindRarityClass, getRaritySymbol } from './colorblindUtils';

const weaponNames = {
  common: ['Rusty Sword', 'Wooden Club', 'Stone Axe', 'Iron Dagger'],
  rare: ['Steel Blade', 'Silver Mace', 'Enchanted Bow', 'Crystal Staff'],
  epic: ['Flamebrand', 'Frostbite', 'Thunder Strike', 'Shadow Cleaver'],
  legendary: ['Excalibur', 'Mjolnir', 'Gungnir', 'Durandal'],
  mythical: ['Void Reaper', 'Cosmic Blade', 'Reality Slicer', 'Dimension Cutter', 'Soul Harvester', 'Infinity Edge', 'Chaos Bringer', 'Eternal Destroyer'],
};

const armorNames = {
  common: ['Leather Vest', 'Cloth Robe', 'Wooden Shield', 'Iron Helm'],
  rare: ['Chainmail', 'Steel Plate', 'Mystic Cloak', 'Silver Guard'],
  epic: ['Dragon Scale', 'Phoenix Mail', 'Void Armor', 'Crystal Guard'],
  legendary: ['Divine Aegis', 'Eternal Plate', 'Shadowweave', 'Celestial Ward'],
  mythical: ['Abyssal Aegis', 'Stellar Fortress', 'Quantum Shield', 'Infinity Guard', 'Void Mantle', 'Cosmic Barrier', 'Reality Armor', 'Dimensional Cloak'],
};

const relicNames = {
  weapons: [
    'Ancient Blade of Yojef',
    'Primordial Sword',
    'Relic of the First War',
    'Eternal Flame Sword',
    'Void Touched Blade',
    'Starfall Weapon',
    'Temporal Slicer',
    'Reality Breaker'
  ],
  armor: [
    'Guardian\'s Ancient Shield',
    'Primordial Armor',
    'Relic of Protection',
    'Eternal Barrier',
    'Void Touched Guard',
    'Starfall Aegis',
    'Temporal Ward',
    'Reality Defender'
  ]
};

const enemyNames = [
  'Goblin Warrior', 'Shadow Wolf', 'Stone Golem', 'Fire Imp',
  'Ice Troll', 'Dark Mage', 'Lightning Drake', 'Void Wraith',
  'Crystal Beast', 'Ancient Dragon', 'Chaos Lord', 'Nightmare King',
  'Abyssal Terror', 'Cosmic Horror', 'Reality Bender', 'Dimension Lord',
  'Eternal Guardian', 'Void Emperor', 'Chaos Incarnate', 'Reality Destroyer'
];

const getDurabilityByRarity = (rarity: string): number => {
  const durabilityMap = {
    common: 50,
    rare: 75,
    epic: 100,
    legendary: 150,
    mythical: 200
  };
  return durabilityMap[rarity as keyof typeof durabilityMap] || 50;
};

export const generateWeapon = (forceChroma = false, forceRarity?: string, forceEnchanted = false): Weapon => {
  let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
  
  if (forceRarity) {
    rarity = forceRarity as any;
  } else {
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythical'] as const;
    const weights = [40, 30, 20, 8, 2];
    const random = Math.random() * 100;
    
    rarity = 'common';
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = rarities[i];
        break;
      }
    }
  }

  const names = weaponNames[rarity];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const baseAtkMap = { common: 15, rare: 25, epic: 40, legendary: 60, mythical: 100 };
  const upgradeCostMap = { common: 5, rare: 10, epic: 20, legendary: 40, mythical: 50 };
  let baseAtk = baseAtkMap[rarity] + Math.floor(Math.random() * 10);
  
  const isEnchanted = forceEnchanted || Math.random() < 0.05;
  let enchantmentMultiplier = 1;
  
  if (isEnchanted) {
    enchantmentMultiplier = 2;
    baseAtk *= 2;
  }
  
  const sellPrice = Math.floor(baseAtk * 0.5);
  const maxDurability = getDurabilityByRarity(rarity);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: isEnchanted ? `Enchanted ${name}` : name,
    rarity,
    baseAtk,
    level: 1,
    upgradeCost: upgradeCostMap[rarity],
    sellPrice,
    isChroma: false,
    durability: maxDurability,
    maxDurability,
    isEnchanted,
    enchantmentMultiplier,
  };
};

export const generateArmor = (forceChroma = false, forceRarity?: string, forceEnchanted = false): Armor => {
  let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
  
  if (forceRarity) {
    rarity = forceRarity as any;
  } else {
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythical'] as const;
    const weights = [40, 30, 20, 8, 2];
    const random = Math.random() * 100;
    
    rarity = 'common';
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = rarities[i];
        break;
      }
    }
  }

  const names = armorNames[rarity];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const baseDefMap = { common: 8, rare: 15, epic: 25, legendary: 40, mythical: 70 };
  const upgradeCostMap = { common: 5, rare: 10, epic: 20, legendary: 40, mythical: 50 };
  let baseDef = baseDefMap[rarity] + Math.floor(Math.random() * 5);
  
  const isEnchanted = forceEnchanted || Math.random() < 0.05;
  let enchantmentMultiplier = 1;
  
  if (isEnchanted) {
    enchantmentMultiplier = 2;
    baseDef *= 2;
  }
  
  const sellPrice = Math.floor(baseDef * 0.75);
  const maxDurability = getDurabilityByRarity(rarity);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: isEnchanted ? `Enchanted ${name}` : name,
    rarity,
    baseDef,
    level: 1,
    upgradeCost: upgradeCostMap[rarity],
    sellPrice,
    isChroma: false,
    durability: maxDurability,
    maxDurability,
    isEnchanted,
    enchantmentMultiplier,
  };
};

export const generateRelicItem = (): RelicItem => {
  const isWeapon = Math.random() < 0.5;
  const names = isWeapon ? relicNames.weapons : relicNames.armor;
  const name = names[Math.floor(Math.random() * names.length)];
  
  if (isWeapon) {
    const baseAtk = 120 + Math.floor(Math.random() * 60);
    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'weapon',
      baseAtk,
      level: 1,
      upgradeCost: 25,
      cost: baseAtk * 5,
      description: 'A powerful relic weapon from ancient times'
    };
  } else {
    const baseDef = 90 + Math.floor(Math.random() * 45);
    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'armor',
      baseDef,
      level: 1,
      upgradeCost: 25,
      cost: baseDef * 5,
      description: 'A powerful relic armor from ancient times'
    };
  }
};

export const generateMythicalWeapon = (): Weapon => {
  return generateWeapon(false, 'mythical');
};

export const generateMythicalArmor = (): Armor => {
  return generateArmor(false, 'mythical');
};

export const generateEnemy = (zone: number): Enemy => {
  const nameIndex = Math.min(Math.floor((zone - 1) / 5), enemyNames.length - 1);
  const name = enemyNames[nameIndex];
  
  let hp = 200 + (zone * 15);
  let atk = 20 + (zone * 8);
  let def = Math.floor(zone * 2);
  
  if (zone >= 10) {
    hp = Math.floor(hp * Math.pow(1.1, zone - 10));
    atk = Math.floor(atk * Math.pow(1.08, zone - 10));
    def = Math.floor(def * Math.pow(1.05, zone - 10));
  }
  
  return {
    name,
    hp,
    maxHp: hp,
    atk,
    def,
    zone,
    isPoisoned: false,
    poisonTurns: 0,
    canDropItems: zone >= 10,
  };
};

export const getChestRarityWeights = (chestCost: number): number[] => {
  if (chestCost >= 1000) {
    return [0, 0, 0, 70, 30];
  } else if (chestCost >= 400) {
    return [0, 0, 60, 30, 10];
  } else if (chestCost >= 200) {
    return [0, 50, 35, 13, 2];
  } else {
    return [60, 30, 8, 2, 0];
  }
};

// Updated functions to support colorblind mode
export const getRarityColor = (rarity: string, isColorblindMode = false): string => {
  return getColorblindRarityClass(rarity, 'text', isColorblindMode);
};

export const getRarityBorder = (rarity: string, isColorblindMode = false): string => {
  return getColorblindRarityClass(rarity, 'border', isColorblindMode);
};

export const getRarityGlow = (rarity: string, isColorblindMode = false): string => {
  if (isColorblindMode) {
    // No glow effects in colorblind mode for better clarity
    return '';
  }
  
  switch (rarity) {
    case 'common': return 'shadow-gray-500/20';
    case 'rare': return 'shadow-blue-500/30';
    case 'epic': return 'shadow-purple-500/40';
    case 'legendary': return 'shadow-yellow-500/50';
    case 'mythical': return 'shadow-red-600/60';
    default: return 'shadow-gray-500/20';
  }
};

export const getRarityDisplayName = (rarity: string, isColorblindMode = false): string => {
  const symbol = getRaritySymbol(rarity, isColorblindMode);
  return symbol ? `${symbol} ${rarity.toUpperCase()}` : rarity.toUpperCase();
};

export const calculateResearchBonus = (level: number): number => {
  return level * 10;
};

export const calculateResearchCost = (level: number): number => {
  return 100 + (level * 50);
};

export const getRepairCost = (item: Weapon | Armor): number => {
  const durabilityPercent = item.durability / item.maxDurability;
  const baseCost = Math.floor((1 - durabilityPercent) * 20);
  
  const rarityMultiplier = {
    common: 1,
    rare: 1.5,
    epic: 2,
    legendary: 3,
    mythical: 5
  };
  
  return Math.ceil(baseCost * rarityMultiplier[item.rarity]);
};

// Calculate total stat bonuses from research
export const calculateTotalResearchBonuses = (research: { level: number }): { atk: number; def: number; hp: number } => {
  const bonus = calculateResearchBonus(research.level);
  return {
    atk: bonus,
    def: bonus,
    hp: bonus
  };
};

// Calculate damage based on attack value and critical chance
export const calculateDamage = (attack: number, criticalChance: number): number => {
  const isCritical = Math.random() < (criticalChance / 100);
  return isCritical ? Math.floor(attack * 1.5) : attack;
};

// Calculate offline rewards based on time elapsed and game state
export const calculateOfflineRewards = (offlineMinutes: number, gameState: GameState): OfflineReward => {
  // Cap offline time to maximum allowed hours
  const maxOfflineMinutes = gameState.offlineProgress.maxOfflineHours * 60;
  const actualOfflineMinutes = Math.min(offlineMinutes, maxOfflineMinutes);
  
  // Base rates per minute
  const baseCoinsPerMinute = 5;
  const baseGemsPerMinute = 0.1;
  const baseExperiencePerMinute = 2;
  
  // Apply research bonuses
  const researchBonus = gameState.research.level * 0.1; // 10% bonus per research level
  const coinMultiplier = 1 + researchBonus;
  const experienceMultiplier = 1 + researchBonus;
  
  // Calculate rewards
  const coins = Math.floor(baseCoinsPerMinute * actualOfflineMinutes * coinMultiplier);
  const gems = Math.floor(baseGemsPerMinute * actualOfflineMinutes);
  const experience = Math.floor(baseExperiencePerMinute * actualOfflineMinutes * experienceMultiplier);
  
  return {
    coins,
    gems,
    experience,
    timeElapsed: actualOfflineMinutes,
  };
};

// Get skill description for menu skills
export const getSkillDescription = (skillType: string): string => {
  const descriptions = {
    coin_vacuum: 'Automatically collect coins from defeated enemies',
    treasurer: 'Instantly gain 500 bonus coins',
    xp_surge: 'Double experience gain for 24 hours',
    luck_gem: 'Increased chance to find rare gems',
    enchanter: 'Higher chance for enchanted items',
    time_warp: 'Reduce all cooldowns by 50%',
    golden_touch: 'All items sell for double price',
    knowledge_boost: 'Gain bonus research points',
    durability_master: 'Items lose durability 50% slower',
    relic_finder: 'Increased chance to find relics'
  };
  
  return descriptions[skillType as keyof typeof descriptions] || 'Unknown skill effect';
};

// Generate a random gem
export const generateGem = (): any => {
  const gemTypes = ['Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Topaz'];
  const gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: gemType,
    value: Math.floor(Math.random() * 50) + 10,
    rarity: 'common'
  };
};

// Generate a random relic
export const generateRelic = (): any => {
  const isWeapon = Math.random() < 0.5;
  const names = isWeapon ? relicNames.weapons : relicNames.armor;
  const name = names[Math.floor(Math.random() * names.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type: isWeapon ? 'weapon' : 'armor',
    power: Math.floor(Math.random() * 100) + 50,
    level: 1,
    description: 'A mysterious relic with ancient power'
  };
};