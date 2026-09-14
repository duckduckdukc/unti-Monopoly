/**
 * 所有界面更新集中在这里。
 * 本类只负责显示，不决定游戏何时开始、暂停或结束。
 */
class UI {
  constructor() {
    // 缓存常用 DOM，避免游戏循环中反复查询页面。
    this.hp = document.getElementById("hp");
    this.hpFill = document.getElementById("hpFill");
    this.level = document.getElementById("level");
    this.speed = document.getElementById("speed");
    this.best = document.getElementById("best");
    this.start = document.getElementById("start");
    this.gameOver = document.getElementById("gameover");
    this.finalTenure = document.getElementById("finalTenure");
    this.reason = document.getElementById("reason");
    this.message = document.getElementById("message");
    this.pause = document.getElementById("pause");
    this.continueSaveBtn = document.getElementById("continueSaveBtn");
    this.saveInfo = document.getElementById("saveInfo");
    this.messageTimer = null;
  }

  updateHP(value) {
    // 血量限制在 0～100；低于 30 时血条变红。
    const safeValue = Math.max(0, Math.min(100, value));
    this.hp.textContent = safeValue;
    this.hpFill.style.width = safeValue + "%";
    this.hpFill.classList.toggle("danger", safeValue <= 30);
  }

  getCareerPosition(careerElapsed) {
    const secondsPerMonth = GameConfig.career.secondsPerYear / GameConfig.career.monthsPerYear;
    const completedMonths = Math.floor(Math.max(0, careerElapsed) / secondsPerMonth);
    return {
      completedMonths,
      year: Math.floor(completedMonths / GameConfig.career.monthsPerYear) + 1,
      month: completedMonths % GameConfig.career.monthsPerYear + 1
    };
  }

  formatCompletedMonths(completedMonths) {
    const years = Math.floor(completedMonths / GameConfig.career.monthsPerYear);
    const months = completedMonths % GameConfig.career.monthsPerYear;
    if (!years) return `${months} 个月`;
    return `${years} 年${months ? ` ${months} 个月` : ""}`;
  }

  updateCareer(careerElapsed) {
    const { year, month } = this.getCareerPosition(careerElapsed);
    this.level.textContent = `工作第 ${year} 年 · 第 ${month} 月`;
  }

  updateSpeed(value) {
    this.speed.textContent = Math.round(value);
  }

  updateBest(completedMonths) {
    this.best.textContent = this.formatCompletedMonths(completedMonths);
  }

  showMessage(text, duration = 700) {
    this.message.textContent = text;
    clearTimeout(this.messageTimer);

    this.messageTimer = setTimeout(() => {
      this.message.textContent = "";
    }, duration);
  }

  hideStart() {
    this.start.style.display = "none";
  }

  hideGameOver() {
    this.gameOver.style.display = "none";
  }

  hideOverlays() {
    // 开始或恢复时关闭暂停遮罩。
    this.pause.style.display = "none";
  }

  showPause() {
    this.pause.style.display = "flex";
  }

  setSaveState(save) {
    // 只有存在有效存档时，开始页才显示“继续存档”。
    this.continueSaveBtn.style.display = save ? "inline-block" : "none";
    if (!save) {
      this.saveInfo.textContent = "";
      return;
    }

    const { year, month } = this.getCareerPosition(save.careerElapsed);
    this.saveInfo.textContent = `存档：工作第 ${year} 年第 ${month} 月，体力 ${save.hp}`;
  }

  showGameOver(careerElapsed, reason) {
    // 与顶部角标使用同一口径，显示角色当前走到的工作年月。
    const { year, month } = this.getCareerPosition(careerElapsed);
    this.finalTenure.textContent = `工作第 ${year} 年 · 第 ${month} 月`;
    this.reason.textContent = reason;
    this.gameOver.style.display = "flex";
  }
}
