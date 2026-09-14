/**
 * 所有界面更新集中在这里。
 * 本类只负责显示，不决定游戏何时开始、暂停或结束。
 */
class UI {
  constructor() {
    // 缓存常用 DOM，避免游戏循环中反复查询页面。
    this.hp = document.getElementById("hp");
    this.hpFill = document.getElementById("hpFill");
    this.score = document.getElementById("score");
    this.level = document.getElementById("level");
    this.best = document.getElementById("best");
    this.start = document.getElementById("start");
    this.gameOver = document.getElementById("gameover");
    this.finalScore = document.getElementById("finalScore");
    this.reason = document.getElementById("reason");
    this.message = document.getElementById("message");
    this.pause = document.getElementById("pause");
    this.levelComplete = document.getElementById("levelComplete");
    this.levelCompleteTitle = document.getElementById("levelCompleteTitle");
    this.levelCompleteText = document.getElementById("levelCompleteText");
    this.continueSaveBtn = document.getElementById("continueSaveBtn");
    this.saveInfo = document.getElementById("saveInfo");
  }

  updateHP(value) {
    // 血量限制在 0～100；低于 30 时血条变红。
    const safeValue = Math.max(0, Math.min(100, value));
    this.hp.textContent = safeValue;
    this.hpFill.style.width = safeValue + "%";
    this.hpFill.classList.toggle("danger", safeValue <= 30);
  }

  updateScore(value) {
    this.score.textContent = value;
  }

  updateBest(value) {
    this.best.textContent = value;
  }

  updateLevel(value) {
    // level 是累计月份，从 1 开始；这里把它换算成年和月。
    const monthsPerYear = GameConfig.game.monthsPerYear;
    const year = Math.floor((value - 1) / monthsPerYear) + 1;
    const month = (value - 1) % monthsPerYear + 1;
    this.level.textContent = `第 ${year} 年 · ${month} 月`;
  }

  showMessage(text) {
    // 短提示显示半秒后自动消失。
    this.message.textContent = text;

    setTimeout(() => {
      this.message.textContent = "";
    }, 500);
  }

  hideStart() {
    this.start.style.display = "none";
  }

  hideGameOver() {
    this.gameOver.style.display = "none";
  }

  hideOverlays() {
    // 开始/继续月份时关闭所有暂停类遮罩。
    this.pause.style.display = "none";
    this.levelComplete.style.display = "none";
  }

  showPause() {
    this.pause.style.display = "flex";
  }

  showCheckpoint(completedLevel) {
    // 12 的倍数显示年度文案，否则显示半年节点文案。
    const monthsPerYear = GameConfig.game.monthsPerYear;
    const years = Math.floor(completedLevel / monthsPerYear);
    const months = completedLevel % monthsPerYear;

    this.levelCompleteTitle.textContent = completedLevel % monthsPerYear === 0
      ? `又熬过了 ${years} 年！`
      : "半年节点，喘口气";

    this.levelCompleteText.textContent = years > 0
      ? `你已经坚持了 ${years} 年${months ? ` ${months} 个月` : ""}。`
      : `你已经坚持了 ${completedLevel} 个月。`;

    this.levelComplete.style.display = "flex";
  }

  setSaveState(save) {
    // 只有存在有效存档时，开始页才显示“继续存档”。
    this.continueSaveBtn.style.display = save ? "inline-block" : "none";
    this.saveInfo.textContent = save
      ? `存档：第 ${save.level} 关，体力 ${save.hp}`
      : "";
  }

  showGameOver(score, reason) {
    this.finalScore.textContent = score;
    this.reason.textContent = reason;
    this.gameOver.style.display = "flex";
  }
}
