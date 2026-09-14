/** 障碍物的创建、移动和销毁。 */
class ObstacleManager {
  constructor(gameElement) {
    this.gameElement = gameElement;
    this.objects = [];
  }

  reset() {
    // 跨月或重新开始时清除页面和内存中的全部障碍。
    this.objects.forEach(object => object.element.remove());
    this.objects = [];
  }

  spawn() {
    // 随机选择障碍种类和三条跑道中的一条。
    const types = GameConfig.obstacles;
    const obstacleType = types[Math.floor(Math.random() * types.length)];

    const element = document.createElement("div");
    element.className = "obstacle " + obstacleType.className;
    element.dataset.name = obstacleType.name;

    const laneIndex = Math.floor(Math.random() * GameConfig.lanes.length);
    const laneX = GameConfig.lanes[laneIndex];

    element.style.left = laneX + "%";
    element.style.top = "-90px";

    this.gameElement.appendChild(element);

    // y 保存纵向像素位置；hit 防止同一障碍重复扣血。
    this.objects.push({
      element,
      x: laneX,
      y: -90,
      hit: false
    });
  }

  update(speed) {
    // 游戏按约 60 帧/秒运行，因此把每秒速度换算为每帧位移。
    this.objects.forEach(object => {
      object.y += speed / 60;
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
