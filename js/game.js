/**
 * 游戏总控制器。
 * 负责状态、计时、月份切换、难度、碰撞、暂停和存档；
 * 角色、障碍物和画面显示分别交给其他类处理。
 */
class Game {
  constructor() {
    // 组合页面元素和三个功能模块。
    this.gameElement = document.getElementById("game");
    this.player = new Player(document.getElementById("player"));
    this.obstacles = new ObstacleManager(this.gameElement);
    this.ui = new UI();

    // 当前一局的运行状态。
    this.running = false;
    this.paused = false;
    this.hp = GameConfig.player.hp;
    this.score = 0;
    this.level = 1;
    this.levelElapsed = 0;
    this.speed = GameConfig.game.startSpeed;
    this.runStartedAt = 0;
    this.lastSpawn = 0;

    // 最佳月份独立于当前存档保存，游戏失败后仍会保留。
    this.best = Number(localStorage.getItem("work_best_month") || 0);
    this.ui.updateBest(this.best);
    this.ui.updateHP(this.hp);
    this.ui.updateLevel(this.level);
    this.ui.setSaveState(this.readSave());

    this.bindEvents();
  }

  bindEvents() {
    // “开始上班”永远创建新游戏并覆盖当前存档。
    document.getElementById("startBtn").addEventListener("click", () => {
      this.startNewGame();
    });

    document.getElementById("continueSaveBtn").addEventListener("click", () => {
      this.continueSavedGame();
    });

    document.getElementById("restartBtn").addEventListener("click", () => {
      this.startNewGame();
    });

    // 页面上的暂停、恢复和半年节点继续按钮。
    document.getElementById("pauseBtn").addEventListener("click", () => this.pause());
    document.getElementById("resumeBtn").addEventListener("click", () => this.resume());
    document.getElementById("nextLevelBtn").addEventListener("click", () => this.startLevel());

    // 空格、Esc 或 P 可以在“运行”和“暂停”之间切换。
    document.addEventListener("keydown", event => {
      if ([" ", "Escape", "p", "P"].includes(event.key)) {
        event.preventDefault();
        if (this.running) this.pause();
        else if (this.paused) this.resume();
      }
    });

    // 关闭或刷新页面前再保存一次，减少进度丢失。
    window.addEventListener("pagehide", () => {
      if (this.running || this.paused) this.saveProgress();
    });

    this.player.bindControls(this);
  }

  readSave() {
    try {
      const save = JSON.parse(localStorage.getItem("work_game_save"));
      if (!save || !Number.isFinite(save.level) || !Number.isFinite(save.hp)) return null;

      // 限制存档数值范围，避免旧存档或手动修改造成异常。
      return {
        level: Math.max(1, Math.floor(save.level)),
        hp: Math.max(1, Math.min(100, Math.floor(save.hp))),
        elapsed: Math.max(
          0,
          Math.min(GameConfig.game.levelDuration - 1, Number(save.elapsed) || 0)
        )
      };
    } catch (error) {
      return null;
    }
  }

  saveProgress() {
    // 正在运行时，先把本段真实经过的时间计入本月进度。
    if (this.running) this.captureElapsed(performance.now());

    const save = {
      level: this.level,
      hp: this.hp,
      elapsed: this.levelElapsed
    };

    localStorage.setItem("work_game_save", JSON.stringify(save));
    this.ui.setSaveState(save);
  }

  clearSave() {
    localStorage.removeItem("work_game_save");
    this.ui.setSaveState(null);
  }

  resetLevel() {
    // 每个月开始时清场、把角色放回中间，并重置月内难度。
    this.obstacles.reset();
    this.player.reset();
    this.score = Math.floor(this.levelElapsed);
    this.speed = GameConfig.game.startSpeed;
    this.lastSpawn = 0;
    this.ui.updateHP(this.hp);
    this.ui.updateScore(this.score);
    this.ui.updateLevel(this.level);
  }

  startNewGame() {
    // 新游戏从第 1 年 1 月、满血开始。
    this.clearSave();
    this.level = 1;
    this.hp = GameConfig.player.hp;
    this.levelElapsed = 0;
    this.startLevel();
  }

  continueSavedGame() {
    // 没有有效存档时安全地退回新游戏。
    const save = this.readSave();
    if (!save) {
      this.startNewGame();
      return;
    }

    this.level = save.level;
    this.hp = save.hp;
    this.levelElapsed = save.elapsed;
    this.startLevel();
  }

  startLevel() {
    // 开始或自动进入一个月，并启动逐帧更新。
    this.running = true;
    this.paused = false;
    this.runStartedAt = performance.now();
    this.resetLevel();
    this.ui.hideStart();
    this.ui.hideGameOver();
    this.ui.hideOverlays();
    requestAnimationFrame(time => this.loop(time));
  }

  captureElapsed(now) {
    // 保存时使用分段计时，暂停期间的时间不会算入游戏。
    this.levelElapsed += (now - this.runStartedAt) / 1000;
    this.runStartedAt = now;
  }

  pause() {
    // 主动暂停同时触发自动存档。
    if (!this.running) return;
    this.captureElapsed(performance.now());
    this.running = false;
    this.paused = true;
    this.saveProgress();
    this.ui.showPause();
  }

  resume() {
    // 从暂停点继续计时，并避免把暂停时长算进生成间隔。
    if (!this.paused) return;
    this.running = true;
    this.paused = false;
    this.runStartedAt = performance.now();
    this.lastSpawn = this.runStartedAt;
    this.ui.hideOverlays();
    requestAnimationFrame(time => this.loop(time));
  }

  updateDifficulty() {
    // 障碍速度只随“本月秒数”增加，下个月重新从初始速度开始。
    this.speed = GameConfig.game.startSpeed + this.score * GameConfig.game.speedIncrease;
  }

  getSpawnGap() {
    // 时间越久生成越快，但不会低于 minSpawnGap。
    return Math.max(
      GameConfig.game.minSpawnGap,
      GameConfig.game.startSpawnGap - this.score * GameConfig.game.spawnIncrease
    );
  }

  checkCollisions() {
    this.obstacles.objects.forEach(obstacle => {
      // 同一个障碍只造成一次伤害。
      if (obstacle.hit) return;

      if (CollisionManager.isColliding(this.player.element, obstacle.element)) {
        obstacle.hit = true;
        obstacle.element.style.opacity = ".35";
        this.hp = Math.max(0, this.hp - GameConfig.player.collisionDamage);
        this.ui.updateHP(this.hp);
        this.ui.showMessage("💥 " + obstacle.element.dataset.name + "！");

        if (this.hp <= 0) {
          this.end("今天的工作量，成功突破了你的心理防线。");
        }
      }
    });
  }

  loop(now) {
    if (!this.running) return;

    // levelElapsed 是暂停前累计值，后半段是本次恢复后经过的时间。
    const elapsed = this.levelElapsed + (now - this.runStartedAt) / 1000;
    this.score = Math.min(GameConfig.game.levelDuration, Math.floor(elapsed));
    this.ui.updateScore(this.score);

    // 达到本月时长后，先处理跨月，再停止当前帧。
    if (elapsed >= GameConfig.game.levelDuration) {
      this.completeLevel();
      return;
    }

    this.updateDifficulty();
    const spawnGap = this.getSpawnGap();

    if (now - this.lastSpawn > spawnGap) {
      this.obstacles.spawn();
      this.lastSpawn = now;
    }

    this.obstacles.update(this.speed);
    this.checkCollisions();

    if (this.running) requestAnimationFrame(time => this.loop(time));
  }

  completeLevel() {
    // 跨月时先停止旧循环，保存“下一个月 0 秒”的状态。
    this.running = false;
    const completedLevel = this.level;
    this.obstacles.reset();

    if (completedLevel > this.best) {
      this.best = completedLevel;
      localStorage.setItem("work_best_month", this.best);
      this.ui.updateBest(this.best);
    }

    this.level++;
    this.levelElapsed = 0;
    this.saveProgress();

    // 只有达到自动暂停间隔（默认每 6 个月）才显示休息界面。
    if (completedLevel % GameConfig.game.pauseEveryMonths === 0) {
      this.paused = true;
      this.resetLevel();
      this.ui.showCheckpoint(completedLevel);
      return;
    }

    // 普通月份只显示短提示，然后立即开始下个月。
    this.paused = false;
    this.ui.showMessage(`📅 第 ${completedLevel} 个月过去了`);
    this.startLevel();
  }

  end(reason) {
    // 血量归零后清除当前进度，但不会清除最佳月份。
    this.running = false;
    this.paused = false;
    this.clearSave();
    this.ui.showGameOver(this.score, reason);
  }
}

// 页面脚本加载完成后创建唯一的游戏实例。
const game = new Game();
