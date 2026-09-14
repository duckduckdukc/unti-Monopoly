/** 障碍事件的预备动作、创建、移动和销毁。 */
class ObstacleManager {
  constructor(gameElement) {
    this.gameElement = gameElement;
    this.objects = [];
    this.pendingSeniorEvents = [];
  }

  reset() {
    // 新游戏、读档或游戏结束时清除全部障碍和待触发事件。
    this.objects.forEach(object => object.element.remove());
    this.objects = [];
    this.pendingSeniorEvents = [];
  }

  randomLane() {
    return GameConfig.lanes[Math.floor(Math.random() * GameConfig.lanes.length)];
  }

  spawn(careerElapsed, seniorManager, playerX) {
    const seniorAvailable = Boolean(seniorManager.getActiveSenior());
    const availableTypes = GameConfig.obstacles.filter(type =>
      type.source !== "senior" || seniorAvailable
    );
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    if (type.source !== "senior") {
      this.createObstacle(type, null, playerX);
      return;
    }

    const senior = seniorManager.getActiveSenior();
    if (!senior || !seniorManager.startAction(senior.id, type.action, careerElapsed)) return;

    // 先播放前辈动作，动作结束后再从前辈所在位置生成雷或锅。
    this.pendingSeniorEvents.push({
      typeId: type.id,
      seniorId: senior.id,
      dueAt: careerElapsed + GameConfig.seniors.actionDuration,
      targetX: playerX
    });
  }

  processPending(careerElapsed, seniorManager, playerX) {
    this.pendingSeniorEvents = this.pendingSeniorEvents.filter(event => {
      if (careerElapsed < event.dueAt) return true;

      const type = GameConfig.obstacles.find(item => item.id === event.typeId);
      const origin = seniorManager.getSnapshot(event.seniorId);
      if (type && origin) this.createObstacle(type, origin, playerX ?? event.targetX);
      return false;
    });
  }

  createObstacle(type, origin, playerX) {
    const element = document.createElement("div");
    element.className = `obstacle ${type.className} from-${type.source}`;
    element.dataset.name = type.name;
    element.setAttribute("aria-label", type.name);

    let x = this.randomLane();
    let y = -100;
    let velocityX = 0;

    if (type.source === "ground") {
      x = 12 + Math.random() * 76;
      y = -65;
      velocityX = (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 9);
    }

    if (type.source === "senior" && origin) {
      x = origin.x;
      y = origin.y + 54;
      if (type.action === "throw") {
        velocityX = ((playerX ?? x) - x) / 1.15;
      }
    }

    element.style.left = x + "%";
    element.style.top = y + "px";
    this.gameElement.appendChild(element);

    this.objects.push({
      element,
      x,
      y,
      velocityX,
      speedMultiplier: type.speedMultiplier,
      source: type.source,
      hit: false
    });
  }

  update(forwardSpeed, deltaSeconds) {
    this.objects.forEach(object => {
      object.y += forwardSpeed * object.speedMultiplier * deltaSeconds;

      if (object.velocityX) {
        object.x += object.velocityX * deltaSeconds;

        // 杂活在道路边缘反弹；前辈甩出的锅则继续沿原方向飞行。
        if (object.source === "ground" && (object.x < 11 || object.x > 89)) {
          object.x = Math.max(11, Math.min(89, object.x));
          object.velocityX *= -1;
        }

        object.element.style.left = object.x + "%";
      }

      object.element.style.top = object.y + "px";
    });

    this.removeOffscreen();
  }

  removeOffscreen() {
    // 障碍离开屏幕下方后，同时删除 DOM 元素和数组记录。
    this.objects = this.objects.filter(object => {
      if (object.y > this.gameElement.clientHeight + 100) {
        object.element.remove();
        return false;
      }
      return true;
    });
  }
}
