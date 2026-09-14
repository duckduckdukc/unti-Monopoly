/**
 * 游戏参数集中配置。
 * 想调整数值时优先修改本文件，不需要改动主循环。
 * 位置统一使用百分比；时间间隔除特别注明外使用毫秒。
 */
const GameConfig = {
  player: {
    startX: 50,          // 开局时角色的水平位置（50 表示正中间）
    minX: 12,            // 角色可移动到的最左边界
    maxX: 88,            // 角色可移动到的最右边界
    keyboardSpeed: 8,    // 每按一次方向键移动的百分比
    hp: 100,             // 满血数值
    collisionDamage: 34  // 每次撞到障碍扣除的血量
  },

  game: {
    levelDuration: 30,   // 每个月持续多少秒
    monthsPerYear: 12,   // 多少个月算一年
    pauseEveryMonths: 6, // 每经过多少个月自动暂停一次
    startSpeed: 260,     // 每个月开始时的障碍下落速度
    speedIncrease: 7,    // 本月每过一秒增加多少速度
    startSpawnGap: 900,  // 月初生成障碍的间隔（毫秒）
    minSpawnGap: 420,    // 障碍生成间隔的下限（毫秒）
    spawnIncrease: 8     // 本月每过一秒，生成间隔缩短多少毫秒
  },

  // 三条跑道的水平中心位置。
  lanes: [18, 50, 82],

  // className 对应 css/game.css 中的外观；name 用于碰撞提示。
  obstacles: [
    { className: "pot", name: "前辈甩锅" },
    { className: "mine", name: "前辈埋雷" },
    { className: "task", name: "天降任务" },
    { className: "coffee", name: "加班咖啡" },
    { className: "boss", name: "领导来了" }
  ]
};
