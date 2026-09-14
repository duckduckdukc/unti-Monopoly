/** 管理道路前方的两名前辈、前进速度、垂直距离和事件动作。 */
class SeniorManager {
  constructor(gameElement, player) {
    this.gameElement = gameElement;
    this.player = player;
    this.seniors = [];
  }

  randomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  createInitialStates() {
    const lanes = [...GameConfig.lanes].sort(() => Math.random() - 0.5);
    const slow = GameConfig.seniors.slow;
    const fast = GameConfig.seniors.fast;

    return [
      {
        id: "senior-slow",
        label: "前辈甲",
        variant: "slow",
        x: lanes[0],
        initialDistance: this.randomBetween(slow.initialDistance),
        verticalDistance: 0,
        baseSpeed: this.randomBetween(slow.baseSpeed),
        slowdownPerYear: this.randomBetween(slow.slowdownPerYear),
        distanceScale: slow.distanceScale,
        minSpeed: slow.minSpeed,
        currentSpeed: 0,
        overtaken: false,
        removed: false,
        action: null
      },
      {
        id: "senior-fast",
        label: "前辈乙",
        variant: "fast",
        x: lanes[1],
        initialDistance: this.randomBetween(fast.initialDistance),
        verticalDistance: 0,
        baseSpeed: this.randomBetween(fast.baseSpeed),
        slowdownPerYear: this.randomBetween(fast.slowdownPerYear),
        distanceScale: fast.distanceScale,
        minSpeed: fast.minSpeed,
        currentSpeed: 0,
        overtaken: false,
        removed: false,
        action: null
      }
    ].map(senior => ({
      ...senior,
      verticalDistance: senior.initialDistance,
      currentSpeed: senior.baseSpeed
    }));
  }

  isValidSavedState(state) {
    return state && typeof state.id === "string" &&
      Number.isFinite(state.x) && Number.isFinite(state.verticalDistance) &&
      Number.isFinite(state.baseSpeed) && Number.isFinite(state.slowdownPerYear);
  }

  reset(savedStates = null) {
    this.seniors.forEach(senior => senior.element?.remove());

    const states = Array.isArray(savedStates) && savedStates.length === 2 &&
      savedStates.every(state => this.isValidSavedState(state))
      ? savedStates
      : this.createInitialStates();

    this.seniors = states.map(state => {
      const senior = {
        ...state,
        distanceScale: Number.isFinite(state.distanceScale)
          ? state.distanceScale
          : GameConfig.seniors[state.variant]?.distanceScale || GameConfig.seniors.distanceScale,
        overtaken: Boolean(state.overtaken),
        removed: Boolean(state.removed),
        action: null,
        element: null,
        screenY: 0
      };

      if (!senior.removed) senior.element = this.createElement(senior);
      return senior;
    });

    this.updatePositions();
  }

  createElement(senior) {
    const element = document.createElement("div");
    element.className = `senior ${senior.variant}`;
    element.dataset.id = senior.id;
    element.innerHTML = `
      <span class="senior-name">${senior.label}</span>
      <span class="senior-action"></span>
      <span class="senior-head"></span>
      <span class="senior-body"></span>
      <span class="senior-arm left"></span>
      <span class="senior-arm right"></span>
      <span class="senior-leg left"></span>
      <span class="senior-leg right"></span>
    `;
    this.gameElement.appendChild(element);
    return element;
  }

  update(playerSpeed, careerYears, deltaSeconds, careerElapsed) {
    const overtakenNow = [];

    this.seniors.forEach(senior => {
      if (senior.removed) return;

      senior.currentSpeed = Math.max(
        senior.minSpeed,
        senior.baseSpeed - senior.slowdownPerYear * careerYears
      );
      senior.verticalDistance -= (
        playerSpeed - senior.currentSpeed
      ) * deltaSeconds * senior.distanceScale;

      if (!senior.overtaken && senior.verticalDistance <= 0) {
        senior.overtaken = true;
        senior.action = null;
        senior.element?.classList.remove("action-bury", "action-throw");
        senior.element?.classList.add("overtaken");
        overtakenNow.push(senior.label);
      }

      if (senior.action && careerElapsed >= senior.action.endsAt) {
        senior.action = null;
        senior.element?.classList.remove("action-bury", "action-throw");
        const actionLabel = senior.element?.querySelector(".senior-action");
        if (actionLabel) actionLabel.textContent = "";
      }

      if (senior.overtaken && senior.verticalDistance < -130) {
        senior.removed = true;
        senior.element?.remove();
        senior.element = null;
      }
    });

    this.updatePositions();
    return overtakenNow;
  }

  updatePositions() {
    const fallbackPlayerTop = this.gameElement.clientHeight * 0.82;
    const playerTop = this.player.element.offsetTop || fallbackPlayerTop;
    const largestVisibleGap = Math.max(180, playerTop - 105);

    this.seniors.forEach(senior => {
      if (!senior.element) return;

      // 距离过大时让 NPC 贴近远景边缘显示；真实距离仍保存在 verticalDistance。
      const displayedDistance = Math.min(senior.verticalDistance, largestVisibleGap);
      senior.screenY = playerTop - displayedDistance;
      senior.element.style.left = senior.x + "%";
      senior.element.style.top = senior.screenY + "px";
      senior.element.dataset.verticalDistance = senior.verticalDistance.toFixed(1);
    });
  }

  getActiveSenior() {
    const active = this.seniors.filter(senior =>
      !senior.overtaken && !senior.removed && senior.element && senior.verticalDistance > 15
    );
    return active.length ? active[Math.floor(Math.random() * active.length)] : null;
  }

  startAction(seniorId, action, careerElapsed) {
    const senior = this.seniors.find(item => item.id === seniorId);
    if (!senior?.element || senior.overtaken) return false;

    senior.element.classList.remove("action-bury", "action-throw");
    senior.element.classList.add(`action-${action}`);
    senior.action = {
      type: action,
      endsAt: careerElapsed + GameConfig.seniors.actionDuration
    };

    const actionLabel = senior.element.querySelector(".senior-action");
    if (actionLabel) actionLabel.textContent = action === "bury" ? "埋雷…" : "甩锅！";
    return true;
  }

  getSnapshot(seniorId) {
    const senior = this.seniors.find(item => item.id === seniorId);
    if (!senior?.element || senior.removed) return null;
    return { id: senior.id, x: senior.x, y: senior.screenY, label: senior.label };
  }

  serialize() {
    return this.seniors.map(({ element, screenY, action, ...state }) => ({
      ...state,
      action: null
    }));
  }
}
