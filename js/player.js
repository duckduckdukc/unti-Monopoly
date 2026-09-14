/** 角色位置和电脑/手机输入控制。 */
class Player {
  constructor(element) {
    this.element = element;
    this.x = GameConfig.player.startX;
    this.touchStartX = null;
  }

  reset() {
    // 只在新游戏开始时回到道路中央；跨月和暂停不会重置位置。
    this.x = GameConfig.player.startX;
    this.updatePosition();
  }

  setX(value) {
    this.x = Math.max(GameConfig.player.minX, Math.min(GameConfig.player.maxX, value));
    this.updatePosition();
  }

  setRunning(running) {
    this.element.classList.toggle("running", running);
  }

  move(dx) {
    // dx 是百分比位移；边界值在 config.js 中配置。
    this.x = Math.max(
      GameConfig.player.minX,
      Math.min(GameConfig.player.maxX, this.x + dx)
    );
    this.updatePosition();
  }

  updatePosition() {
    // CSS 的 translateX(-50%) 会让这里的百分比代表角色中心点。
    this.element.style.left = this.x + "%";
  }

  bindControls(game) {
    // 键盘控制只在游戏运行时生效。
    document.addEventListener("keydown", event => {
      if (!game.running) return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        this.move(-GameConfig.player.keyboardSpeed);
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        this.move(GameConfig.player.keyboardSpeed);
      }
    });

    // 记录手指起点，touchmove 再换算成页面宽度百分比。
    game.gameElement.addEventListener("touchstart", event => {
      if (event.touches.length) {
        this.touchStartX = event.touches[0].clientX;
      }
    }, { passive: true });

    game.gameElement.addEventListener("touchmove", event => {
      if (!game.running || this.touchStartX === null) return;

      const currentX = event.touches[0].clientX;
      const dx = currentX - this.touchStartX;

      if (Math.abs(dx) > 5) {
        this.move(dx / game.gameElement.clientWidth * 100);
        this.touchStartX = currentX;
      }
    }, { passive: true });

    // 手指离开后清空起点，避免下一次滑动跳跃。
    game.gameElement.addEventListener("touchend", () => {
      this.touchStartX = null;
    }, { passive: true });
  }
}
