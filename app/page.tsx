"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Coins, Gift, Trophy, Target, Brain, Heart } from "lucide-react"

interface VendingItem {
  id: string
  name: string
  icon: string
  description: string
  timeCost: number // in seconds
  category: "snacks" | "drinks" | "premium" | "digital"
  stock: number
  rarity: "common" | "rare" | "legendary"
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  multiplier: number // time multiplier
}

interface UserStats {
  totalTimeSpent: number
  itemsPurchased: number
  currentStreak: number
  patienceLevel: string
}

const VENDING_ITEMS: VendingItem[] = [
  {
    id: "1",
    name: "Chocolate Bar",
    icon: "🍫",
    description: "Sweet milk chocolate",
    timeCost: 60,
    category: "snacks",
    stock: 8,
    rarity: "common",
  },
  {
    id: "2",
    name: "Potato Chips",
    icon: "🍟",
    description: "Crispy golden chips",
    timeCost: 45,
    category: "snacks",
    stock: 12,
    rarity: "common",
  },
  {
    id: "3",
    name: "Energy Drink",
    icon: "⚡",
    description: "Boost your energy",
    timeCost: 90,
    category: "drinks",
    stock: 6,
    rarity: "common",
  },
  {
    id: "4",
    name: "Coffee",
    icon: "☕",
    description: "Fresh hot coffee",
    timeCost: 120,
    category: "drinks",
    stock: 10,
    rarity: "common",
  },
  {
    id: "5",
    name: "Premium Cookie",
    icon: "🍪",
    description: "Artisan baked cookie",
    timeCost: 180,
    category: "premium",
    stock: 4,
    rarity: "rare",
  },
  {
    id: "6",
    name: "Smoothie",
    icon: "🥤",
    description: "Healthy fruit smoothie",
    timeCost: 150,
    category: "drinks",
    stock: 5,
    rarity: "rare",
  },
  {
    id: "7",
    name: "Digital Wallpaper",
    icon: "🖼️",
    description: "HD desktop wallpaper",
    timeCost: 30,
    category: "digital",
    stock: 99,
    rarity: "common",
  },
  {
    id: "8",
    name: "Meditation Track",
    icon: "🧘",
    description: "10-min guided meditation",
    timeCost: 300,
    category: "digital",
    stock: 15,
    rarity: "rare",
  },
  {
    id: "9",
    name: "Golden Ticket",
    icon: "🎫",
    description: "Mystery premium reward",
    timeCost: 600,
    category: "premium",
    stock: 1,
    rarity: "legendary",
  },
  {
    id: "10",
    name: "Time Crystal",
    icon: "💎",
    description: "Rare temporal artifact",
    timeCost: 900,
    category: "premium",
    stock: 1,
    rarity: "legendary",
  },
]

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "wait",
    name: "Patient Wait",
    icon: <Clock className="w-5 h-5" />,
    description: "Simply wait and contemplate",
    multiplier: 1,
  },
  {
    id: "focus",
    name: "Mindful Focus",
    icon: <Brain className="w-5 h-5" />,
    description: "Stay focused on the screen",
    multiplier: 1,
  },
  {
    id: "click",
    name: "Click Challenge",
    icon: <Target className="w-5 h-5" />,
    description: "Prove your dedication",
    multiplier: 0.8,
  },
  {
    id: "breathe",
    name: "Breathing Exercise",
    icon: <Heart className="w-5 h-5" />,
    description: "Guided breathing session",
    multiplier: 0.9,
  },
]

export default function TimeVendingMachine() {
  const [selectedItem, setSelectedItem] = useState<VendingItem | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [progress, setProgress] = useState(0)
  const [userStats, setUserStats] = useState<UserStats>({
    totalTimeSpent: 0,
    itemsPurchased: 0,
    currentStreak: 0,
    patienceLevel: "Novice",
  })
  const [inventory, setInventory] = useState<VendingItem[]>([])
  const [items, setItems] = useState(VENDING_ITEMS)
  const [clickCount, setClickCount] = useState(0)
  const [clickTarget, setClickTarget] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [showSuccess, setShowSuccess] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getPatienceLevel = (totalTime: number): string => {
    if (totalTime >= 3600) return "Zen Master"
    if (totalTime >= 1800) return "Patient Sage"
    if (totalTime >= 900) return "Time Warrior"
    if (totalTime >= 300) return "Apprentice"
    return "Novice"
  }

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-400 to-orange-500"
      case "rare":
        return "bg-gradient-to-r from-purple-400 to-pink-500"
      default:
        return "bg-gradient-to-r from-blue-400 to-cyan-500"
    }
  }

  const startPayment = async () => {
    if (!selectedItem || !selectedPayment) return

    const actualTime = Math.ceil(selectedItem.timeCost * selectedPayment.multiplier)
    setTimeRemaining(actualTime)
    setProgress(0)
    setIsProcessing(true)
    startTimeRef.current = Date.now()

    if (selectedPayment.id === "click") {
      setClickTarget(Math.max(10, Math.floor(actualTime / 3)))
      setClickCount(0)
    }

    if (selectedPayment.id === "breathe") {
      startBreathingExercise()
    }

    // Start countdown timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(0, actualTime - elapsed)
      const progressPercent = ((actualTime - remaining) / actualTime) * 100

      setTimeRemaining(remaining)
      setProgress(progressPercent)

      if (remaining <= 0) {
        completePayment()
      }
    }, 1000)
  }

  const startBreathingExercise = () => {
    let phase: "inhale" | "hold" | "exhale" = "inhale"
    let phaseTime = 0

    const breathingTimer = setInterval(() => {
      phaseTime++

      if (phase === "inhale" && phaseTime >= 4) {
        phase = "hold"
        phaseTime = 0
      } else if (phase === "hold" && phaseTime >= 4) {
        phase = "exhale"
        phaseTime = 0
      } else if (phase === "exhale" && phaseTime >= 4) {
        phase = "inhale"
        phaseTime = 0
      }

      setBreathingPhase(phase)

      if (!isProcessing) {
        clearInterval(breathingTimer)
      }
    }, 1000)
  }

  const handleClick = () => {
    if (selectedPayment?.id === "click" && isProcessing) {
      setClickCount((prev) => prev + 1)
    }
  }

  const completePayment = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (!selectedItem) return

    // Check if click challenge was completed
    if (selectedPayment?.id === "click" && clickCount < clickTarget) {
      cancelPayment()
      return
    }

    // Update inventory and stats
    setInventory((prev) => [...prev, selectedItem])
    setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? { ...item, stock: item.stock - 1 } : item)))

    const timeSpent = Math.ceil(selectedItem.timeCost * (selectedPayment?.multiplier || 1))
    setUserStats((prev) => ({
      totalTimeSpent: prev.totalTimeSpent + timeSpent,
      itemsPurchased: prev.itemsPurchased + 1,
      currentStreak: prev.currentStreak + 1,
      patienceLevel: getPatienceLevel(prev.totalTimeSpent + timeSpent),
    }))

    setShowSuccess(true)
    setIsProcessing(false)
    setSelectedItem(null)
    setSelectedPayment(null)

    setTimeout(() => setShowSuccess(false), 3000)
  }

  const cancelPayment = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsProcessing(false)
    setTimeRemaining(0)
    setProgress(0)
    setClickCount(0)
    setSelectedItem(null)
    setSelectedPayment(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            ⏰ TIME VENDING MACHINE
          </h1>
          <p className="text-xl text-gray-300 mb-6">Pay with Minutes, Not Money • Your Time is Your Currency</p>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-cyan-500/30 p-4">
              <div className="text-2xl font-bold text-cyan-400">{formatTime(userStats.totalTimeSpent)}</div>
              <div className="text-sm text-gray-400">Time Invested</div>
            </Card>
            <Card className="bg-slate-800/50 border-purple-500/30 p-4">
              <div className="text-2xl font-bold text-purple-400">{userStats.itemsPurchased}</div>
              <div className="text-sm text-gray-400">Items Earned</div>
            </Card>
            <Card className="bg-slate-800/50 border-green-500/30 p-4">
              <div className="text-2xl font-bold text-green-400">{userStats.currentStreak}</div>
              <div className="text-sm text-gray-400">Current Streak</div>
            </Card>
            <Card className="bg-slate-800/50 border-yellow-500/30 p-4">
              <div className="text-2xl font-bold text-yellow-400">{userStats.patienceLevel}</div>
              <div className="text-sm text-gray-400">Patience Level</div>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vending Machine Display */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/80 border-slate-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Select Your Investment
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className={`relative cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                      selectedItem?.id === item.id
                        ? "border-cyan-400 bg-cyan-900/30"
                        : item.stock === 0
                          ? "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
                          : "border-slate-600 bg-slate-700/50 hover:border-purple-400"
                    }`}
                    onClick={() => item.stock > 0 && setSelectedItem(item)}
                  >
                    <div className="p-4 text-center">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-semibold text-white text-sm mb-1">{item.name}</div>
                      <div className="text-xs text-gray-400 mb-2">{item.description}</div>
                      <Badge className={`text-xs ${getRarityColor(item.rarity)} text-white`}>
                        {formatTime(item.timeCost)}
                      </Badge>
                      <div className="absolute top-2 right-2 bg-slate-900 text-white text-xs px-2 py-1 rounded">
                        {item.stock}
                      </div>
                      {item.rarity === "legendary" && (
                        <div className="absolute top-2 left-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Payment & Processing Panel */}
          <div className="space-y-6">
            {/* Selected Item */}
            {selectedItem && (
              <Card className="bg-slate-800/80 border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Selected Item</h3>
                <div className="text-center">
                  <div className="text-4xl mb-2">{selectedItem.icon}</div>
                  <div className="font-semibold text-white">{selectedItem.name}</div>
                  <div className="text-gray-400 text-sm mb-2">{selectedItem.description}</div>
                  <Badge className={`${getRarityColor(selectedItem.rarity)} text-white`}>
                    Cost: {formatTime(selectedItem.timeCost)}
                  </Badge>
                </div>
              </Card>
            )}

            {/* Payment Methods */}
            {selectedItem && !isProcessing && (
              <Card className="bg-slate-800/80 border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Choose Payment Method</h3>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all duration-200 border-2 ${
                        selectedPayment?.id === method.id
                          ? "border-cyan-400 bg-cyan-900/30"
                          : "border-slate-600 bg-slate-700/50 hover:border-purple-400"
                      }`}
                      onClick={() => setSelectedPayment(method)}
                    >
                      <div className="p-4 flex items-center gap-3">
                        {method.icon}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{method.name}</div>
                          <div className="text-sm text-gray-400">{method.description}</div>
                          {method.multiplier !== 1 && (
                            <div className="text-xs text-green-400">
                              {Math.round((1 - method.multiplier) * 100)}% time discount!
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {selectedPayment && (
                  <Button
                    onClick={startPayment}
                    className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    Start Payment ({formatTime(Math.ceil(selectedItem.timeCost * selectedPayment.multiplier))})
                  </Button>
                )}
              </Card>
            )}

            {/* Processing Timer */}
            {isProcessing && (
              <Card className="bg-slate-800/80 border-red-500 p-6">
                <h3 className="text-xl font-bold text-red-400 mb-4 text-center">⏳ Payment in Progress</h3>

                <div className="text-center mb-6">
                  <div className="text-4xl font-mono text-red-400 mb-2">{formatTime(timeRemaining)}</div>
                  <Progress value={progress} className="mb-4" />
                  <div className="text-sm text-gray-400">{Math.round(progress)}% Complete</div>
                </div>

                {/* Payment-specific UI */}
                {selectedPayment?.id === "click" && (
                  <div className="text-center mb-4">
                    <Button
                      onClick={handleClick}
                      className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-2xl mb-2"
                    >
                      🎯
                    </Button>
                    <div className="text-white">
                      Clicks: {clickCount} / {clickTarget}
                    </div>
                  </div>
                )}

                {selectedPayment?.id === "breathe" && (
                  <div className="text-center mb-4">
                    <div
                      className={`w-20 h-20 mx-auto rounded-full transition-all duration-1000 ${
                        breathingPhase === "inhale"
                          ? "bg-blue-500 scale-110"
                          : breathingPhase === "hold"
                            ? "bg-purple-500 scale-110"
                            : "bg-green-500 scale-90"
                      }`}
                    ></div>
                    <div className="text-white mt-2 capitalize">
                      {breathingPhase === "inhale" ? "Breathe In" : breathingPhase === "hold" ? "Hold" : "Breathe Out"}
                    </div>
                  </div>
                )}

                {selectedPayment?.id === "focus" && (
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
                    <div className="text-white mt-2">Stay focused on the circle</div>
                  </div>
                )}

                <Button
                  onClick={cancelPayment}
                  variant="outline"
                  className="w-full border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  Cancel Payment
                </Button>
              </Card>
            )}

            {/* Inventory */}
            <Card className="bg-slate-800/80 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Your Collection ({inventory.length})
              </h3>
              {inventory.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No items yet. Start investing your time!</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {inventory.map((item, index) => (
                    <div key={index} className="text-center p-2 bg-slate-700/50 rounded">
                      <div className="text-2xl">{item.icon}</div>
                      <div className="text-xs text-gray-400">{item.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-green-900 border-green-500 p-8 text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Complete!</h3>
              <div className="text-4xl mb-2">{selectedItem.icon}</div>
              <div className="text-xl text-white mb-4">You earned: {selectedItem.name}</div>
              <div className="text-green-400">Time well invested!</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
