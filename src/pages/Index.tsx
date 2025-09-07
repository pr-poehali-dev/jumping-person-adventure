import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';

interface Obstacle {
  id: number;
  x: number;
  type: 'rock' | 'spike' | 'bird';
  height: number;
}

const RunnerGame = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('runnerHighScore') || '0'));
  const [playerY, setPlayerY] = useState(50);
  const [isJumping, setIsJumping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [obstacleIdCounter, setObstacleIdCounter] = useState(0);

  // Проверка коллизий
  const checkCollision = useCallback(() => {
    const playerLeft = 80;
    const playerRight = 120;
    const playerBottom = playerY;
    const playerTop = playerY + 60;

    for (const obstacle of obstacles) {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + 40;
      const obstacleBottom = obstacle.type === 'bird' ? 80 : 0;
      const obstacleTop = obstacleBottom + obstacle.height;

      if (playerRight > obstacleLeft && 
          playerLeft < obstacleRight && 
          playerTop > obstacleBottom && 
          playerBottom < obstacleTop) {
        return true;
      }
    }
    return false;
  }, [obstacles, playerY]);

  // Игровая логика
  const jump = useCallback(() => {
    if (!isJumping && gameState === 'playing') {
      setIsJumping(true);
      setPlayerY(20);
      
      if (soundEnabled) {
        console.log('🦘 ПРЫЖОК!');
      }
      
      setTimeout(() => {
        setPlayerY(50);
        setIsJumping(false);
      }, 600);
    }
  }, [isJumping, gameState, soundEnabled]);

  const boost = useCallback(() => {
    if (gameState === 'playing') {
      setSpeed(prev => Math.min(prev + 0.5, 5));
      
      if (soundEnabled) {
        console.log('💨 ПУУУУК! УСКОРЕНИЕ!');
      }
      
      setTimeout(() => setSpeed(prev => Math.max(prev - 0.3, 1)), 1000);
    }
  }, [gameState, soundEnabled]);

  // Генерация препятствий
  const generateObstacle = useCallback(() => {
    const types: ('rock' | 'spike' | 'bird')[] = ['rock', 'spike', 'bird'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newObstacle: Obstacle = {
      id: obstacleIdCounter,
      x: 800,
      type: randomType,
      height: randomType === 'bird' ? 40 : randomType === 'spike' ? 60 : 50
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    setObstacleIdCounter(prev => prev + 1);
  }, [obstacleIdCounter]);

  // Управление клавишами
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        boost();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, boost]);

  // Игровой цикл
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = setInterval(() => {
        // Обновление счета
        setScore(prev => prev + Math.floor(speed));
        
        // Движение препятствий
        setObstacles(prev => 
          prev
            .map(obs => ({ ...obs, x: obs.x - (3 + speed) }))
            .filter(obs => obs.x > -50)
        );
        
        // Проверка коллизий
        if (checkCollision()) {
          setGameState('gameOver');
          if (soundEnabled) {
            console.log('💥 БУМ! ИГРА ОКОНЧЕНА!');
          }
        }
      }, 50);
      
      // Генерация новых препятствий
      const obstacleGenerator = setInterval(() => {
        if (Math.random() < 0.3 + (speed * 0.1)) {
          generateObstacle();
        }
      }, 1000);
      
      return () => {
        clearInterval(gameLoop);
        clearInterval(obstacleGenerator);
      };
    }
  }, [gameState, speed, checkCollision, generateObstacle, soundEnabled]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setSpeed(1);
    setObstacles([]);
    setObstacleIdCounter(0);
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const endGame = () => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('runnerHighScore', score.toString());
    }
    setGameState('menu');
    setObstacles([]);
  };

  const getObstacleEmoji = (type: string) => {
    switch (type) {
      case 'rock': return '🪨';
      case 'spike': return '⚡';
      case 'bird': return '🦅';
      default: return '🪨';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-2xl">
            🏃‍♂️ RUNNER GAME
          </h1>
          <p className="text-xl text-white/80">Управляй, прыгай и пукай для ускорения!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Игровое поле */}
          <div className="lg:col-span-2">
            <Card className="h-96 relative overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 border-4 border-white shadow-2xl">
              <CardContent className="p-0 h-full relative">
                {/* Игровой мир */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-300 to-green-300">
                  {/* Облака */}
                  <div className="absolute top-8 left-20 text-4xl animate-pulse">☁️</div>
                  <div className="absolute top-12 right-32 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>☁️</div>
                  
                  {/* Земля */}
                  <div className="absolute bottom-0 w-full h-20 bg-gradient-to-r from-green-500 to-green-600">
                    <div className="absolute inset-0 bg-repeat-x opacity-50" 
                         style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 22px)' }}>
                    </div>
                  </div>
                  
                  {/* Персонаж */}
                  <div 
                    className="absolute left-20 transition-all duration-300 ease-out text-6xl z-10"
                    style={{ 
                      bottom: `${playerY}px`,
                      transform: isJumping ? 'rotate(-15deg)' : 'rotate(0deg)'
                    }}
                  >
                    🏃‍♂️
                  </div>

                  {/* Препятствия */}
                  {obstacles.map((obstacle) => (
                    <div
                      key={obstacle.id}
                      className="absolute text-4xl z-5"
                      style={{
                        left: `${obstacle.x}px`,
                        bottom: obstacle.type === 'bird' ? '80px' : '0px',
                        transform: obstacle.type === 'bird' ? 'translateY(-10px)' : 'none'
                      }}
                    >
                      {getObstacleEmoji(obstacle.type)}
                    </div>
                  ))}

                  {/* Эффект скорости */}
                  {speed > 1 && (
                    <div className="absolute left-10 bottom-16 text-3xl animate-ping">
                      💨
                    </div>
                  )}
                </div>

                {/* Игровое меню */}
                {gameState === 'menu' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Card className="p-6 text-center bg-white/90 backdrop-blur-sm">
                      <CardTitle className="text-3xl mb-4">🎮 Начать игру!</CardTitle>
                      <Button onClick={startGame} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                        ПОЕХАЛИ! 🚀
                      </Button>
                    </Card>
                  </div>
                )}

                {/* Game Over */}
                {gameState === 'gameOver' && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Card className="p-8 text-center bg-white/95 backdrop-blur-sm">
                      <CardTitle className="text-4xl mb-2 text-red-600">💥 ИГРА ОКОНЧЕНА!</CardTitle>
                      <p className="text-xl mb-4">Очки: <strong>{score}</strong></p>
                      {score > highScore && (
                        <p className="text-lg text-green-600 mb-4">🎉 Новый рекорд!</p>
                      )}
                      <div className="flex gap-4 justify-center">
                        <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                          🔄 Заново
                        </Button>
                        <Button onClick={endGame} size="lg" variant="outline">
                          📋 В меню
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Пауза */}
                {gameState === 'paused' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Card className="p-6 text-center bg-white/90 backdrop-blur-sm">
                      <CardTitle className="text-2xl mb-4">⏸️ Пауза</CardTitle>
                      <Button onClick={pauseGame} size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                        Продолжить
                      </Button>
                    </Card>
                  </div>
                )}

                {/* Счет */}
                {gameState === 'playing' && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="text-lg p-2 bg-white/90">
                      Очки: {score}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Кнопки управления */}
            {gameState === 'playing' && (
              <div className="flex gap-4 mt-4 justify-center">
                <Button onClick={jump} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                  <Icon name="ArrowUp" size={20} className="mr-2" />
                  ПРЫЖОК
                </Button>
                <Button onClick={boost} size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold">
                  💨 УСКОРЕНИЕ
                </Button>
                <Button onClick={pauseGame} variant="outline" size="lg">
                  <Icon name="Pause" size={20} className="mr-2" />
                  Пауза
                </Button>
                <Button onClick={endGame} variant="destructive" size="lg">
                  <Icon name="Square" size={20} className="mr-2" />
                  Стоп
                </Button>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="records">🏆 Рекорды</TabsTrigger>
                <TabsTrigger value="controls">🎮 Управление</TabsTrigger>
                <TabsTrigger value="settings">⚙️ Настройки</TabsTrigger>
              </TabsList>

              <TabsContent value="records">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Trophy" size={24} className="text-yellow-500" />
                      Лучшие результаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>🥇 Рекорд:</span>
                      <Badge variant="outline" className="text-lg">{highScore}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>📊 Текущий:</span>
                      <Badge variant="secondary" className="text-lg">{score}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>⚡ Скорость:</span>
                      <Badge variant="outline" className="text-lg">{speed.toFixed(1)}x</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="controls">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Gamepad2" size={24} />
                      Как играть
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">ПРОБЕЛ</kbd>
                        <span>или</span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↑</kbd>
                        <span>- Прыжок</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">SHIFT</kbd>
                        <span>- Ускорение (пук)</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Совет:</strong> Используй ускорение с умом - оно временное, но дает больше очков!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Settings" size={24} />
                      Настройки
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">🔊 Звуковые эффекты</label>
                        <p className="text-xs text-gray-500">Включить забавные звуки</p>
                      </div>
                      <Switch 
                        checked={soundEnabled} 
                        onCheckedChange={setSoundEnabled}
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        setHighScore(0);
                        localStorage.removeItem('runnerHighScore');
                      }} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Icon name="RotateCcw" size={16} className="mr-2" />
                      Сбросить рекорды
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerGame;