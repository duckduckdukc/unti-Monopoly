/**
 * 游戏参数集中配置。
 * 距离使用像素或画面宽度百分比；时间除特别注明外使用秒。
 */
const GameConfig = {
  player: {
    startAge: 22,           // 主角入职时的年龄
    startX: 50,             // 开局时角色的水平位置（50 表示正中间）
    minX: 12,               // 角色可移动到的最左边界
    maxX: 88,               // 角色可移动到的最右边界
    keyboardSpeed: 8,       // 每按一次方向键移动的百分比
    hp: 100,                // 满血数值
    collisionDamage: 34,    // 每次撞到障碍扣除的血量
    hitEffectDuration: 1000,// 鸭鸭受击动画持续时间（毫秒）
    ageStages: [
      { minWorkYears: 0, age: 22, asset: "./assets/player/duck-age-22.png" },
      { minWorkYears: 5, age: 27, asset: "./assets/player/duck-age-27.png" },
      { minWorkYears: 10, age: 32, asset: "./assets/player/duck-age-32.png" },
      { minWorkYears: 15, age: 37, asset: "./assets/player/duck-age-37.png" }
    ]
  },

  career: {
    secondsPerYear: 20,     // 现实 20 秒对应 1 个工作年，即 1 分钟 = 3 年
    monthsPerYear: 12,
    checkpointEveryYears: 3,// 每 3 年静默保存一次，不暂停游戏
    peakYear: 15            // 工作 15 年达到速度巅峰
  },

  game: {
    startSpeed: 210,        // 入职初速；约 700px 高画面有 2.7 秒反应时间
    speedPerYear: 18,       // 每工作一年增加的前进速度
    peakSpeed: 480,         // 工作 15 年时达到的封顶速度
    startSpawnGap: 1.25,    // 入职初期事件生成间隔
    minSpawnGap: 0.65,      // 15 年后的最短生成间隔
    roadStartDuration: 0.9  // 入职初期道路纹理滚动一轮的秒数
  },

  seniors: {
    distanceScale: 0.04,    // 把双方速度差换算成画面中的垂直距离变化
    actionDuration: 0.48,   // 埋雷/甩锅预备动作持续时间
    slow: {
      sprite: "./assets/npc/duck-senior-45.png",
      initialDistance: [370, 400],
      baseSpeed: [200, 210],
      slowdownPerYear: [2, 4],
      distanceScale: 0.04,
      minSpeed: 145
    },
    fast: {
      sprite: "./assets/npc/duck-senior-58.png",
      initialDistance: [420, 460],
      baseSpeed: [200, 210],
      slowdownPerYear: [1, 2],
      distanceScale: 0.008,
      minSpeed: 165
    }
  },

  // 三条道路的水平中心位置。
  lanes: [18, 50, 82],

  // source 决定障碍从天空、地面还是前辈所在位置出现。
  obstacles: [
    { id: "skyPot", className: "sky-pot", name: "天降大锅", source: "sky", effect: "pot", asset: "./assets/obstacles/cartoon-pan.png", speedMultiplier: 1.3 },
    { id: "seniorMine", className: "senior-mine", name: "前辈埋雷", source: "senior", action: "bury", effect: "mine", speedMultiplier: 0.82 },
    { id: "seniorPot", className: "senior-pot", name: "前辈甩锅", source: "senior", action: "throw", effect: "pot", asset: "./assets/obstacles/cartoon-pan.png", speedMultiplier: 1.12 },
    { id: "skyTask", className: "sky-task", name: "天降任务", source: "sky", effect: "task", speedMultiplier: 1.18 },
    { id: "chores", className: "chores", name: "杂活", source: "ground", effect: "chores", speedMultiplier: 0.9 }
  ]
};
