/** 使用两个元素的外接矩形判断是否重叠。 */
class CollisionManager {
  static isColliding(elementA, elementB) {
    const a = elementA.getBoundingClientRect();
    const b = elementB.getBoundingClientRect();

    // 四种“完全分离”情况都不成立时，两个矩形发生碰撞。
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }
}
