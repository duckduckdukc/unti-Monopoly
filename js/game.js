/**
 * 游戏总控制器：维护连续职业时间、速度、事件、碰撞、暂停和存档。
 */
class Game {
  constructor() {
    this.gameElement = document.getElementById("game");
    this.player = new Player(document.getElementById("player"));
    this.seniors = new SeniorManager(this.gameElement, this.player);
    this.obstacles = new ObstacleManager(this.gameElement);
    this.ui = new UI();

    this.running = false;
    this.paused = false;
    this.hp = GameConfig.player.hp;
    this.careerElapsed = 0;
    this.speed = GameConfig.game.startSpeed;
    this.lastFrameAt = 0;
    this.nextSpawnAt = 0;
    this.lastCheckpointIndex = 0;

    // 最佳记录按已完成月份保存，兼容旧版本的 work_best_month。
    const savedBest = Number(localStorage.getItem("work_best_month") || 0);
    this.best = Number.isFinite(savedBest) ? Math.max(0, savedBest) : 0;
    this.ui.updateBest(this.best);
    this.ui.updateHP(this.hp);
    this.ui.updateCareer(this.careerElapsed);
    this.ui.updateSpeed(this.speed);
    this.ui.setSaveState(this.readSave());

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("startBtn").addEventListener("click", () => this.startNewGame());
    document.getElementById("continueSaveBtn").addEventListener("click", () => this.continueSavedGame());
    document.getElementById("restartBtn").addEventListener("click", () => this.startNewGame());
    document.getElementById("pauseBtn").addEventListener("click", () => this.pause());
    document.getElementById("resumeBtn").addEventListener("click", () => this.resume());

    document.addEventListener("keydown", event => {
      if (![" ", "Escape", "p", "P"].includes(event.key)) return;
      event.preventDefault();
      if (this.running) this.pause();
      else if (this.paused) this.resume();
    });

    window.addEventListener("pagehide", () => {
      if (this.running || this.paused) this.saveProgress();
    });

    this.player.bindControls(this);
  }

  get secondsPerMonth() {
    return GameConfig.career.secondsPerYear / GameConfig.career.monthsPerYear;
  }

  get workYears() {
    return this.careerElapsed / GameConfig.career.secondsPerYear;
  }

  getForwardSpeed(workYears = this.workYears) {
    return Math.min(
      GameConfig.game.peakSpeed,
      GameConfig.game.startSpeed + workYears * GameConfig.game.speedPerYear
    );
  }

  readSave() {
    try {
      const save = JSON.parse(localStorage.getItem("work_game_save"));
      if (!save || !Number.isFinite(save.hp)) return null;

      if (save.version === 2 && Number.isFinite(save.careerElapsed)) {
        const careerElapsed = Math.max(0, save.careerElapsed);
        return {
          version: 2,
          careerElapsed,
          hp: Math.max(1, Math.min(GameConfig.player.hp, Math.floor(save.hp))),
          playerX: Number.isFinite(save.playerX) ? save.playerX : GameConfig.player.startX,
          checkpointIndex: Number.isFinite(save.checkpointIndex)
            ? Math.max(0, Math.floor(save.checkpointIndex))
            : Math.floor(
              careerElapsed / (
                GameConfig.career.secondsPerYear * GameConfig.career.checkpointEveryYears
              )
            ),
          seniors: Array.isArray(save.seniors) ? save.seniors : null
        };
      }

      // 旧版存档按“30 秒一个月”记录，这里保留月数比例并迁移到新时间轴。
      if (Number.isFinite(save.level)) {
        const oldLevelSeconds = 30;
        const completedMonthPart = Math.max(0, save.level - 1) +
          Math.max(0, Number(save.elapsed) || 0) / oldLevelSeconds;
        const careerElapsed = completedMonthPart * this.secondsPerMonth;
        return {
          version: 2,
          careerElapsed,
          hp: Math.max(1, Math.min(GameConfig.player.hp, Math.floor(save.hp))),
          playerX: GameConfig.player.startX,
          checkpointIndex: Math.floor(
            careerElapsed / (
              GameConfig.career.secondsPerYear * GameConfig.career.checkpointEveryYears
            )
          ),
          seniors: null
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  saveProgress() {
    const save = {
      version: 2,
      careerElapsed: this.careerElapsed,
      hp: this.hp,
      playerX: this.player.x,
      speed: this.speed,
      checkpointIndex: this.lastCheckpointIndex,
      seniors: this.seniors.serialize()
    };

    localStorage.setItem("work_game_save", JSON.stringify(save));
    this.ui.setSaveState(save);
  }

  clearSave() {
    localStorage.removeItem("work_game_save");
    this.ui.setSaveState(null);
  }

  resetWorld(save = null) {
    this.obstacles.reset();
    if (save) this.player.setX(save.playerX);
    else this.player.reset();
    this.seniors.reset(save?.seniors || null);
    this.nextSpawnAt = this.careerElapsed + 0.8;
  }

  startNewGame() {
    this.running = false;
    this.clearSave();
    this.hp = GameConfig.player.hp;
    this.careerElapsed = 0;
    this.speed = GameConfig.game.startSpeed;
    this.lastCheckpointIndex = 0;
    this.resetWorld();
    this.startPlaying();
  }

  continueSavedGame() {
    const save = this.readSave();
    if (!save) {
      this.startNewGame();
      return;
    }

    this.running = false;
    this.hp = save.hp;
    this.careerElapsed = save.careerElapsed;
    this.speed = this.getForwardSpeed();
    this.lastCheckpointIndex = save.checkpointIndex;
    this.resetWorld(save);
    this.startPlaying();
  }

  startPlaying() {
    this.running = true;
    this.paused = false;
    this.lastFrameAt = performance.now();
    this.player.setRunning(true);
    this.player.updateCareerAppearance(this.workYears);
    this.gameElement.classList.remove("is-paused");
    this.ui.updateHP(this.hp);
    this.ui.updateCareer(this.careerElapsed);
    this.ui.updateSpeed(this.speed);
    this.ui.hideStart();
    this.ui.hideGameOver();
    this.ui.hideOverlays();
    this.updateRoadSpeed();
    requestAnimationFrame(time => this.loop(time));
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.paused = true;
    this.player.setRunning(false);
    this.gameElement.classList.add("is-paused");
    this.saveProgress();
    this.ui.showPause();
  }

  resume() {
    if (!this.paused) return;
    this.running = true;
    this.paused = false;
    this.lastFrameAt = performance.now();
    this.player.setRunning(true);
    this.gameElement.classList.remove("is-paused");
    this.ui.hideOverlays();
    requestAnimationFrame(time => this.loop(time));
  }

  updateRoadSpeed() {
    const duration = GameConfig.game.roadStartDuration *
      GameConfig.game.startSpeed / this.speed;
    this.gameElement.style.setProperty("--road-duration", `${duration.toFixed(3)}s`);
  }

  getSpawnGap() {
    const progress = Math.min(1, this.workYears / GameConfig.career.peakYear);
    const gapRange = GameConfig.game.startSpawnGap - GameConfig.game.minSpawnGap;
    return (GameConfig.game.startSpawnGap - gapRange * progress) *
      (0.82 + Math.random() * 0.36);
  }

  scheduleNextSpawn() {
    this.nextSpawnAt = this.careerElapsed + this.getSpawnGap();
  }

  updateBest() {
    const completedMonths = Math.floor(this.careerElapsed / this.secondsPerMonth);
    if (completedMonths <= this.best) return;

    this.best = completedMonths;
    localStorage.setItem("work_best_month", this.best);
    this.ui.updateBest(this.best);
  }

  handleCheckpoint() {
    const checkpointIndex = Math.floor(
      this.workYears / GameConfig.career.checkpointEveryYears
    );
    if (checkpointIndex <= this.lastCheckpointIndex) return;

    this.lastCheckpointIndex = checkpointIndex;
    this.saveProgress();
    const savedYear = checkpointIndex * GameConfig.career.checkpointEveryYears;
    this.ui.showMessage(`💾 工作满 ${savedYear} 年，记录已保存`, 1600);
  }

  checkCollisions() {
    this.obstacles.objects.forEach(obstacle => {
      if (obstacle.hit || !this.running) return;

      if (CollisionManager.isColliding(this.player.element, obstacle.element)) {
        obstacle.hit = true;
        obstacle.element.style.opacity = ".35";
        const effect = obstacle.element.dataset.effect || "generic";
        this.player.playHitEffect(effect);
        this.hp = Math.max(0, this.hp - GameConfig.player.collisionDamage);
        this.ui.updateHP(this.hp);
        const hitMessage = effect === "pot"
          ? "🍳 被大锅砸中了！"
          : effect === "mine" ? "💣 被雷炸懵了！" : `💥 ${obstacle.element.dataset.name}！`;
        this.ui.showMessage(hitMessage);

        if (this.hp <= 0) {
          this.end("今天的工作量，成功突破了你的心理防线。");
        }
      }
    });
  }

  loop(now) {
    if (!this.running) return;

    // 限制单帧增量，切换浏览器标签页不会让职业时间和障碍突然跳跃。
    const deltaSeconds = Math.max(0, Math.min(0.05, (now - this.lastFrameAt) / 1000));
    this.lastFrameAt = now;
    this.careerElapsed += deltaSeconds;
    this.speed = this.getForwardSpeed();
    this.player.updateCareerAppearance(this.workYears);

    this.ui.updateCareer(this.careerElapsed);
    this.ui.updateSpeed(this.speed);
    this.updateRoadSpeed();

    const overtaken = this.seniors.update(
      this.speed,
      this.workYears,
      deltaSeconds,
      this.careerElapsed
    );
    if (overtaken.length) {
      this.ui.showMessage(`🏃 你超过了${overtaken.join("、")}！`, 1500);
    }

    this.obstacles.processPending(this.careerElapsed, this.seniors, this.player.x);
    if (this.careerElapsed >= this.nextSpawnAt) {
      this.obstacles.spawn(this.careerElapsed, this.seniors, this.player.x);
      this.scheduleNextSpawn();
    }

    this.obstacles.update(this.speed, deltaSeconds);
    this.checkCollisions();

    if (this.running) {
      this.updateBest();
      this.handleCheckpoint();
      requestAnimationFrame(time => this.loop(time));
    }
  }

  end(reason) {
    this.running = false;
    this.paused = false;
    this.player.setRunning(false);
    this.gameElement.classList.add("is-paused");
    this.clearSave();
    this.ui.showGameOver(this.careerElapsed, reason);
  }
}

// 页面脚本加载完成后创建唯一的游戏实例。
const game = new Game();
