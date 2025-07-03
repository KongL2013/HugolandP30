import React, { useState, useEffect, useRef } from 'react';
import { Enemy } from '../types/game';
import { Sword, Shield, Heart, Brain, Clock, Zap, Skull, Flame, RotateCcw, SkipForward, Palette, Sliders } from 'lucide-react';
import { TriviaQuestion, getQuestionByZone, checkAnswer } from '../utils/triviaQuestions';

interface CombatProps {
  enemy: Enemy;
  playerStats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
  };
  onAttack: (hit: boolean, category?: string) => void;
  combatLog: string[];
  gameMode: {
    current: 'normal' | 'blitz' | 'bloodlust' | 'crazy';
    speedModeActive: boolean;
    survivalLives: number;
    maxSurvivalLives: number;
  };
  knowledgeStreak: {
    current: number;
    best: number;
    multiplier: number;
  };
  hasUsedRevival?: boolean;
  adventureSkills?: {
    selectedSkill: any;
    skillEffects: {
      skipCardUsed: boolean;
      metalShieldUsed: boolean;
      dodgeUsed: boolean;
      truthLiesActive: boolean;
      lightningChainActive: boolean;
      rampActive: boolean;
    };
  };
  onUseSkipCard?: () => void;
}

export const Combat: React.FC<CombatProps> = ({ 
  enemy, 
  playerStats, 
  onAttack, 
  combatLog, 
  gameMode,
  knowledgeStreak,
  hasUsedRevival = false,
  adventureSkills,
  onUseSkipCard
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const typeInputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  // Increased time limits to make the game easier
  const getQuestionTime = (type: string) => {
    const baseTime = (gameMode.current === 'blitz' || gameMode.current === 'bloodlust') ? 5 : 8;
    if (type === 'fill-blanks') {
      return Math.floor(baseTime * 2.5); // 2.5x time for fill-in-the-blanks
    }
    return baseTime;
  };

  useEffect(() => {
    let question = getQuestionByZone(enemy.zone);
    
    // Apply truth and lies skill effect
    if (adventureSkills?.skillEffects.truthLiesActive && question.type === 'multiple-choice' && question.options) {
      const correctIndex = question.correctAnswer as number;
      const wrongIndices = question.options.map((_, index) => index).filter(i => i !== correctIndex);
      const indexToRemove = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      
      const newOptions = question.options.filter((_, index) => index !== indexToRemove);
      const newCorrectAnswer = correctIndex > indexToRemove ? correctIndex - 1 : correctIndex;
      
      question = {
        ...question,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      };
    }
    
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setSelectedColor('');
    setSliderValue(question.sliderMin || 0);
    setBlankAnswers(question.type === 'fill-blanks' ? new Array(question.blanks?.length || 0).fill('') : []);
    setTimeLeft(getQuestionTime(question.type));
    setShowResult(false);
    setLastAnswerCorrect(null);
    setIsTyping(false);

    // Animate question appearance
    if (questionRef.current) {
      questionRef.current.style.transform = 'translateY(20px)';
      questionRef.current.style.opacity = '0';
      setTimeout(() => {
        if (questionRef.current) {
          questionRef.current.style.transition = 'all 0.5s ease-out';
          questionRef.current.style.transform = 'translateY(0)';
          questionRef.current.style.opacity = '1';
        }
      }, 100);
    }
  }, [enemy, gameMode.current, adventureSkills?.skillEffects.truthLiesActive]);

  useEffect(() => {
    if (!currentQuestion || isAnswering || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, isAnswering, showResult]);

  // Typing animation effect
  useEffect(() => {
    if (currentQuestion?.type === 'type-answer' || currentQuestion?.type === 'fill-blanks') {
      setIsTyping(true);
    }
  }, [currentQuestion]);

  const handleAnswer = (answerIndex: number | null) => {
    if (isAnswering || !currentQuestion) return;

    setIsAnswering(true);
    
    let userAnswer: string | number | string[];
    
    switch (currentQuestion.type) {
      case 'multiple-choice':
        setSelectedAnswer(answerIndex);
        userAnswer = answerIndex ?? -1;
        break;
      case 'color-picker':
        userAnswer = selectedColor;
        break;
      case 'number-slider':
        userAnswer = sliderValue;
        break;
      case 'fill-blanks':
        userAnswer = blankAnswers;
        break;
      default:
        userAnswer = typedAnswer;
    }

    const isCorrect = checkAnswer(currentQuestion, userAnswer);
    setLastAnswerCorrect(isCorrect);
    setShowResult(true);

    setTimeout(() => {
      onAttack(isCorrect, currentQuestion.category);
      
      const newQuestion = getQuestionByZone(enemy.zone);
      setCurrentQuestion(newQuestion);
      setSelectedAnswer(null);
      setTypedAnswer('');
      setSelectedColor('');
      setSliderValue(newQuestion.sliderMin || 0);
      setBlankAnswers(newQuestion.type === 'fill-blanks' ? new Array(newQuestion.blanks?.length || 0).fill('') : []);
      setIsAnswering(false);
      setTimeLeft(getQuestionTime(newQuestion.type));
      setShowResult(false);
      setLastAnswerCorrect(null);
      setIsTyping(false);
    }, 2000);
  };

  const handleSkipCard = () => {
    if (onUseSkipCard && adventureSkills?.selectedSkill?.type === 'skip_card' && !adventureSkills.skillEffects.skipCardUsed) {
      onUseSkipCard();
      // Automatically answer correctly
      handleAnswer(currentQuestion?.correctAnswer as number);
    }
  };

  const handleBlankChange = (index: number, value: string) => {
    const newAnswers = [...blankAnswers];
    newAnswers[index] = value;
    setBlankAnswers(newAnswers);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBorder = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-green-400';
      case 'medium': return 'border-yellow-400';
      case 'hard': return 'border-red-400';
      default: return 'border-gray-400';
    }
  };

  const getModeIcon = () => {
    switch (gameMode.current) {
      case 'blitz': return <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'bloodlust': return <Sword className="w-5 h-5 text-red-400 animate-pulse" />;
      case 'crazy': return <Skull className="w-5 h-5 text-purple-400 animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  const getModeColor = () => {
    switch (gameMode.current) {
      case 'blitz': return 'bg-yellow-600';
      case 'bloodlust': return 'bg-red-600';
      case 'crazy': return 'bg-purple-600';
      default: return 'bg-blue-600';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'color-picker': return <Palette className="w-4 h-4" />;
      case 'number-slider': return <Sliders className="w-4 h-4" />;
      case 'fill-blanks': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options?.map((option, index) => {
              let buttonClass = 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transform transition-all duration-200';
              
              if (showResult) {
                if (index === currentQuestion.correctAnswer) {
                  buttonClass = 'bg-green-600 text-white border border-green-500 scale-105';
                } else if (index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
                  buttonClass = 'bg-red-600 text-white border border-red-500';
                } else {
                  buttonClass = 'bg-gray-600 text-gray-400 border border-gray-600';
                }
              } else if (selectedAnswer === index) {
                buttonClass = 'bg-blue-600 text-white border border-blue-500 scale-105';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswering || showResult}
                  className={`p-4 rounded-lg font-semibold text-left ${buttonClass} ${
                    !isAnswering && !showResult ? 'hover:scale-102' : 'cursor-not-allowed'
                  }`}
                  style={{
                    animation: `slideInUp 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <span className="font-bold mr-3 text-lg">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              );
            })}
          </div>
        );

      case 'color-picker':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {currentQuestion.colors?.map((color, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedColor(color);
                    setTimeout(() => handleAnswer(null), 300);
                  }}
                  disabled={isAnswering || showResult}
                  className={`w-full h-16 rounded-lg border-4 transition-all duration-300 transform ${
                    selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-gray-600 hover:scale-105'
                  } ${showResult && color === currentQuestion.correctAnswer ? 'ring-4 ring-green-400' : ''}`}
                  style={{ 
                    backgroundColor: color,
                    animation: `colorPulse 0.4s ease-out ${index * 0.1}s both`
                  }}
                />
              ))}
            </div>
            {selectedColor && (
              <div className="text-center">
                <p className="text-white">Selected color: <span className="font-bold" style={{ color: selectedColor }}>●</span></p>
              </div>
            )}
          </div>
        );

      case 'number-slider':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-blue-400">{sliderValue}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={currentQuestion.sliderMin}
                max={currentQuestion.sliderMax}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                disabled={isAnswering || showResult}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((sliderValue - (currentQuestion.sliderMin || 0)) / ((currentQuestion.sliderMax || 100) - (currentQuestion.sliderMin || 0))) * 100}%, #374151 ${((sliderValue - (currentQuestion.sliderMin || 0)) / ((currentQuestion.sliderMax || 100) - (currentQuestion.sliderMin || 0))) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>{currentQuestion.sliderMin}</span>
                <span>{currentQuestion.sliderMax}</span>
              </div>
            </div>
            <button
              onClick={() => handleAnswer(null)}
              disabled={isAnswering || showResult}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 text-lg ${
                !isAnswering && !showResult
                  ? 'bg-blue-600 text-white hover:bg-blue-500 transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          </div>
        );

      case 'fill-blanks':
        const questionParts = currentQuestion.question.split('___');
        return (
          <div className="space-y-4">
            <div className="text-lg leading-relaxed">
              {questionParts.map((part, index) => (
                <span key={index}>
                  {part}
                  {index < questionParts.length - 1 && (
                    <input
                      type="text"
                      value={blankAnswers[index] || ''}
                      onChange={(e) => handleBlankChange(index, e.target.value)}
                      disabled={isAnswering || showResult}
                      className={`inline-block mx-2 px-3 py-1 bg-gray-800 text-white rounded border-2 border-yellow-400 focus:border-yellow-300 focus:outline-none min-w-[120px] text-center font-semibold ${
                        isTyping ? 'shadow-yellow-400/50 shadow-lg' : ''
                      }`}
                      placeholder={`Blank ${index + 1}`}
                      style={{
                        animation: `blankGlow 2s ease-in-out infinite ${index * 0.2}s`
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleAnswer(null)}
              disabled={isAnswering || showResult || blankAnswers.some(answer => !answer.trim())}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 text-lg ${
                !isAnswering && !showResult && !blankAnswers.some(answer => !answer.trim())
                  ? 'bg-purple-600 text-white hover:bg-purple-500 transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit All Answers
            </button>
          </div>
        );

      default: // type-answer
        return (
          <div className="space-y-4">
            <div className={`relative ${isTyping ? 'typing-glow' : ''}`}>
              <input
                ref={typeInputRef}
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAnswering && !showResult && handleAnswer(null)}
                disabled={isAnswering || showResult}
                placeholder="Type your answer here..."
                className={`w-full p-4 bg-gray-800 text-white rounded-lg border-2 border-yellow-400 focus:border-yellow-300 focus:outline-none text-lg font-semibold ${
                  isTyping ? 'shadow-yellow-400/50 shadow-lg' : ''
                }`}
                style={{
                  animation: isTyping ? 'typeGlow 2s ease-in-out infinite' : 'none'
                }}
              />
            </div>
            <button
              onClick={() => handleAnswer(null)}
              disabled={isAnswering || showResult || !typedAnswer.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 text-lg ${
                !isAnswering && !showResult && typedAnswer.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-500 transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          </div>
        );
    }
  };

  if (!currentQuestion) {
    return (
      <div className="bg-gradient-to-br from-red-900/80 via-purple-900/80 to-black/80 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-red-500/50">
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-lg">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-900/80 via-purple-900/80 to-black/80 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-red-500/50">
      {/* Question Section */}
      <div className="mb-6" ref={questionRef}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-white font-semibold text-lg">Knowledge Challenge</h3>
            {getQuestionTypeIcon(currentQuestion.type)}
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className={`font-bold text-lg px-3 py-1 rounded-lg ${
              timeLeft <= 3 ? 'text-red-400 animate-pulse bg-red-900/30' : 'text-yellow-400 bg-yellow-900/30'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className={`bg-black/50 p-6 rounded-xl border-2 ${getDifficultyBorder(currentQuestion.difficulty)} mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-lg">{currentQuestion.category}</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)} bg-black/30 px-3 py-1 rounded-lg`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
              <span className="text-xs text-purple-400 bg-black/30 px-3 py-1 rounded-lg">
                {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 
                 currentQuestion.type === 'color-picker' ? 'Color Picker' :
                 currentQuestion.type === 'number-slider' ? 'Number Slider' :
                 currentQuestion.type === 'fill-blanks' ? 'Fill Blanks' : 'Type Answer'}
              </span>
            </div>
          </div>
          <p className="text-white font-semibold text-lg sm:text-xl mb-6 leading-relaxed text-center">
            {currentQuestion.question}
          </p>

          {/* Answer Input */}
          {renderQuestionInput()}

          {/* Skip Card Button */}
          {adventureSkills?.selectedSkill?.type === 'skip_card' && !adventureSkills.skillEffects.skipCardUsed && (
            <div className="mt-4">
              <button
                onClick={handleSkipCard}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all flex items-center gap-2 justify-center"
              >
                <SkipForward className="w-4 h-4" />
                Use Skip Card
              </button>
            </div>
          )}
        </div>

        {/* Result Feedback */}
        {showResult && (
          <div className={`text-center p-4 rounded-xl transition-all duration-500 ${
            lastAnswerCorrect 
              ? 'bg-green-900/50 border border-green-500 animate-pulse' 
              : 'bg-red-900/50 border border-red-500'
          }`}>
            <p className={`font-bold text-lg ${
              lastAnswerCorrect ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastAnswerCorrect 
                ? '🎉 Correct! You deal damage!' 
                : '❌ Wrong! The enemy attacks you!'}
            </p>
            {!lastAnswerCorrect && (
              <p className="text-gray-300 text-sm mt-2">
                Correct answer: {
                  currentQuestion.type === 'multiple-choice' 
                    ? `${String.fromCharCode(65 + (currentQuestion.correctAnswer as number))}. ${currentQuestion.options?.[currentQuestion.correctAnswer as number]}`
                    : currentQuestion.type === 'color-picker'
                    ? <span style={{ color: currentQuestion.correctAnswer as string }}>● {currentQuestion.correctAnswer}</span>
                    : Array.isArray(currentQuestion.correctAnswer)
                    ? (currentQuestion.correctAnswer as string[]).join(', ')
                    : currentQuestion.correctAnswer
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Combat Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Combat - Zone {enemy.zone}</h2>
          {getModeIcon()}
        </div>
        <p className="text-red-300 text-xl font-semibold">{enemy.name}</p>
        
        {/* Game Mode Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <span className={`px-3 py-1 rounded-lg ${getModeColor()} text-white font-semibold text-sm`}>
            {gameMode.current.toUpperCase()} MODE
          </span>
          
          {knowledgeStreak.current > 0 && (
            <span className="text-yellow-300 flex items-center gap-2 bg-yellow-900/30 px-3 py-1 rounded-lg">
              🔥 {knowledgeStreak.current} Streak ({Math.round((knowledgeStreak.multiplier - 1) * 100)}% bonus)
            </span>
          )}

          {!hasUsedRevival && (
            <span className="text-green-300 flex items-center gap-2 bg-green-900/30 px-3 py-1 rounded-lg">
              <RotateCcw className="w-4 h-4" />
              Revival Available
            </span>
          )}

          {/* Adventure Skill Display */}
          {adventureSkills?.selectedSkill && (
            <span className="text-purple-300 flex items-center gap-2 bg-purple-900/30 px-3 py-1 rounded-lg">
              <Zap className="w-4 h-4" />
              {adventureSkills.selectedSkill.name}
            </span>
          )}
        </div>
      </div>

      {/* Health Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="text-white font-semibold">You</span>
            {!hasUsedRevival && (
              <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded-full">
                💖 Revival Ready
              </span>
            )}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-300 mt-2 text-center">{playerStats.hp}/{playerStats.maxHp}</p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <span className="text-orange-400 flex items-center gap-1">
              <Sword className="w-4 h-4" />
              {playerStats.atk}
            </span>
            <span className="text-blue-400 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {playerStats.def}
            </span>
          </div>
        </div>

        <div className="bg-black/40 p-4 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="text-white font-semibold">{enemy.name}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-300 mt-2 text-center">{enemy.hp}/{enemy.maxHp}</p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <span className="text-orange-400 flex items-center gap-1">
              <Sword className="w-4 h-4" />
              {enemy.atk}
            </span>
            <span className="text-blue-400 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {enemy.def}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 space-y-2">
        <p className="text-sm text-gray-300">
          Answer correctly to <span className="text-green-400 font-semibold">deal damage</span>!
        </p>
        <p className={`text-sm font-semibold ${
          gameMode.current === 'blitz' || gameMode.current === 'bloodlust' ? 'text-yellow-400' : 'text-blue-400'
        }`}>
          ⏰ You have {getQuestionTime(currentQuestion.type)} seconds to answer!
        </p>
        {!hasUsedRevival && (
          <p className="text-green-400 text-sm font-semibold">
            💖 Don't worry - you get one free revival if you die!
          </p>
        )}
      </div>

      {/* Combat Log */}
      <div className="bg-black/50 rounded-xl p-4 max-h-40 overflow-y-auto border border-gray-600/50 mt-6">
        <h4 className="text-white font-semibold mb-3 text-lg">Combat Log</h4>
        <div className="space-y-2">
          {combatLog.slice(-6).map((log, index) => (
            <p key={index} className="text-sm text-gray-300 leading-relaxed">
              {log}
            </p>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes colorPulse {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes typeGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(250, 204, 21, 0.6);
          }
        }

        @keyframes blankGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(250, 204, 21, 0.2);
          }
          50% {
            box-shadow: 0 0 25px rgba(250, 204, 21, 0.5);
          }
        }

        .typing-glow::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(45deg, transparent, rgba(250, 204, 21, 0.3), transparent);
          border-radius: 12px;
          z-index: -1;
          animation: typeGlow 2s ease-in-out infinite;
        }

        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .slider-thumb::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};