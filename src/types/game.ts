export interface GameState {
  coins: number;
  gems: number;
  shinyGems: number;
  zone: number;
  playerStats: PlayerStats;
  inventory: Inventory;
  currentEnemy: Enemy | null;
  inCombat: boolean;
  combatLog: string[];
  research: Research;
  isPremium: boolean;
  achievements: Achievement[];
  collectionBook: CollectionBook;
  knowledgeStreak: KnowledgeStreak;
  gameMode: GameMode;
  statistics: Statistics;
  cheats: CheatSettings;
  mining: Mining;
  yojefMarket: YojefMarket;
  playerTags: PlayerTag[];
  dailyRewards: DailyRewards;
  progression: ProgressionSystem;
  offlineProgress: OfflineProgress;
  gardenOfGrowth: GardenOfGrowth;
  settings: GameSettings;
  hasUsedRevival: boolean;
  skills: SkillsSystem;
  adventureSkills: AdventureSkillsState;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
}

export interface Research {
  level: number;
  totalSpent: number;
  availableUpgrades: ('atk' | 'def' | 'hp')[];
}

export interface Inventory {
  weapons: Weapon[];
  armor: Armor[];
  relics: RelicItem[];
  currentWeapon: Weapon | null;
  currentArmor: Armor | null;
  equippedRelics: RelicItem[];
}

export interface Weapon {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
  baseAtk: number;
  level: number;
  upgradeCost: number;
  sellPrice: number;
  isChroma?: boolean;
  durability: number;
  maxDurability: number;
  isEnchanted?: boolean;
  enchantmentMultiplier?: number;
}

export interface Armor {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
  baseDef: number;
  level: number;
  upgradeCost: number;
  sellPrice: number;
  isChroma?: boolean;
  durability: number;
  maxDurability: number;
  isEnchanted?: boolean;
  enchantmentMultiplier?: number;
}

export interface RelicItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  baseAtk?: number;
  baseDef?: number;
  level: number;
  upgradeCost: number;
  cost: number;
  description: string;
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  zone: number;
  isPoisoned?: boolean;
  poisonTurns?: number;
  canDropItems?: boolean;
  isBoss?: boolean;
  specialAbility?: string;
}

export interface ChestReward {
  type: 'weapon' | 'armor' | 'gems';
  items?: (Weapon | Armor)[];
  gems?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  reward?: {
    coins?: number;
    gems?: number;
    special?: string;
  };
}

export interface CollectionBook {
  weapons: { [key: string]: boolean };
  armor: { [key: string]: boolean };
  totalWeaponsFound: number;
  totalArmorFound: number;
  rarityStats: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythical: number;
  };
}

export interface KnowledgeStreak {
  current: number;
  best: number;
  multiplier: number;
  lastCorrectTime?: Date;
}

export interface GameMode {
  current: 'normal' | 'blitz' | 'bloodlust' | 'crazy' | 'survival' | 'timeAttack' | 'boss';
  speedModeActive: boolean;
  survivalLives: number;
  maxSurvivalLives: number;
  timeAttackScore: number;
  timeAttackTimeLeft: number;
  bossProgress: number;
}

export interface Statistics {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  totalPlayTime: number;
  zonesReached: number;
  itemsCollected: number;
  coinsEarned: number;
  gemsEarned: number;
  shinyGemsEarned: number;
  chestsOpened: number;
  accuracyByCategory: {
    [category: string]: {
      correct: number;
      total: number;
    };
  };
  sessionStartTime: Date;
  totalDeaths: number;
  totalVictories: number;
  longestStreak: number;
  fastestVictory: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  itemsUpgraded: number;
  itemsSold: number;
  totalResearchSpent: number;
  averageAccuracy: number;
  revivals: number;
}

export interface CheatSettings {
  infiniteCoins: boolean;
  infiniteGems: boolean;
  obtainAnyItem: boolean;
}

export interface Mining {
  totalGemsMined: number;
  totalShinyGemsMined: number;
}

export interface MiningTool {
  id: string;
  name: string;
  description: string;
  cost: number;
  efficiency: number;
  owned: boolean;
}

export interface YojefMarket {
  items: RelicItem[];
  lastRefresh: Date;
  nextRefresh: Date;
}

export interface PlayerTag {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  color: string;
}

export interface DailyRewards {
  lastClaimDate: Date | null;
  currentStreak: number;
  maxStreak: number;
  availableReward: DailyReward | null;
  rewardHistory: DailyReward[];
}

export interface DailyReward {
  day: number;
  coins: number;
  gems: number;
  items?: (Weapon | Armor)[];
  special?: string;
  claimed: boolean;
  claimDate?: Date;
}

export interface ProgressionSystem {
  level: number;
  experience: number;
  experienceToNext: number;
  skillPoints: number;
  unlockedSkills: string[];
  prestigeLevel: number;
  prestigePoints: number;
  masteryLevels: {
    [category: string]: number;
  };
}

export interface OfflineProgress {
  lastSaveTime: Date;
  offlineCoins: number;
  offlineGems: number;
  offlineExperience: number;
  offlineTime: number;
  maxOfflineHours: number;
}

export interface OfflineReward {
  coins: number;
  gems: number;
  experience: number;
  timeElapsed: number;
}

export interface GardenOfGrowth {
  isPlanted: boolean;
  plantedAt: Date | null;
  lastWatered: Date | null;
  waterHoursRemaining: number;
  growthCm: number;
  totalGrowthBonus: number;
  seedCost: number;
  waterCost: number;
  maxGrowthCm: number;
}

export interface GameSettings {
  colorblindMode: boolean;
  darkMode: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ru' | 'ja' | 'ko' | 'zh';
  notifications: boolean;
}

export interface SkillsSystem {
  activeMenuSkill: MenuSkill | null;
  lastRollTime: Date | null;
  playTimeThisSession: number;
  sessionStartTime: Date;
}

export interface MenuSkill {
  id: string;
  name: string;
  description: string;
  duration: number; // in hours
  activatedAt: Date;
  expiresAt: Date;
  type: 'coin_vacuum' | 'treasurer' | 'xp_surge' | 'luck_gem' | 'enchanter' | 'time_warp' | 'golden_touch' | 'knowledge_boost' | 'durability_master' | 'relic_finder';
  isExpired?: boolean;
}

export interface AdventureSkillsState {
  selectedSkill: AdventureSkill | null;
  availableSkills: AdventureSkill[];
  showSelectionModal: boolean;
  skillEffects: {
    skipCardUsed: boolean;
    metalShieldUsed: boolean;
    dodgeUsed: boolean;
    truthLiesActive: boolean;
    lightningChainActive: boolean;
    rampActive: boolean;
    berserkerActive: boolean;
    vampiricActive: boolean;
    phoenixUsed: boolean;
    timeSlowActive: boolean;
    criticalStrikeActive: boolean;
    shieldWallActive: boolean;
    poisonBladeActive: boolean;
    arcaneShieldActive: boolean;
    battleFrenzyActive: boolean;
  };
}

export interface AdventureSkill {
  id: string;
  name: string;
  description: string;
  type: 'risker' | 'lightning_chain' | 'skip_card' | 'metal_shield' | 'truth_lies' | 'ramp' | 'dodge' | 'berserker' | 'vampiric' | 'phoenix' | 'time_slow' | 'critical_strike' | 'shield_wall' | 'poison_blade' | 'arcane_shield' | 'battle_frenzy';
}

export interface TriviaQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'type-answer' | 'color-picker' | 'number-slider' | 'fill-blanks';
  options?: string[];
  correctAnswer: number | string | string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // New properties for enhanced question types
  colors?: string[];
  sliderMin?: number;
  sliderMax?: number;
  blanks?: string[];
  blankPositions?: number[];
}