// ООП: Dragon — дракон, Player — рыцарь, Game — управление боем.

"use strict";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Dragon {
  constructor() {
    this.maxHp = this.hp = randomInt(105, 135);
    this.hit = randomInt(7, 11);
    this.superHit = randomInt(15, 23);
    this.fireCount = randomInt(2, 4);
  }

  attack() {
    if (this.fireCount > 0 && Math.random() < 0.48) {
      this.fireCount--;
      return {
        damage: this.superHit,
        name: "огнём",
        fire: true
      };
    }

    return {
      damage: this.hit,
      name: "когтями",
      fire: false
    };
  }
}

class Player {
  constructor() {
    this.maxHp = this.hp = randomInt(90, 110);
    this.hit = randomInt(9, 13);
    this.superHit = randomInt(20, 29);
    this.ultimates = randomInt(2, 3);
    this.maxShield = this.shield = randomInt(24, 32);
    this.shieldReady = false;
  }
}

class Game {
  constructor() {
    this.round = 1;
    this.log = [];
    this.reset(false);
  }

  reset(newRound = true) {
    if (newRound) this.round++;

    this.dragon = new Dragon();
    this.player = new Player();
    this.over = false;
    this.log = [];

    this.turn = Math.random() < 0.68
      ? "player"
      : "dragon";

    document.getElementById("endModal")
      .classList.add("hidden");

    this.addLog(
      this.turn === "player"
        ? "Рыцарь поднимает меч. Твой ход!"
        : "Дракон рычит и атакует первым…",
      "muted"
    );

    this.updateTurn();
    this.render();

    if (this.turn === "dragon") {
      setTimeout(() => this.dragonAttack(), 700);
    }
  }

  addLog(message, type = "") {
    this.log.unshift({ message, type });
    this.log = this.log.slice(0, 24);

    const list = document.getElementById("battleLog");
    list.replaceChildren();

    this.log.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = entry.message;
      if (entry.type) li.className = entry.type;
      list.appendChild(li);
    });

    this.render();
  }

  animate(id, className, duration = 600) {
    const el = document.getElementById(id);
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);

    setTimeout(() => {
      el.classList.remove(className);
    }, duration);
  }

  showImpact(symbol = "✦") {
    const impact = document.getElementById("impact");
    impact.textContent = symbol;
    impact.classList.remove("show");
    void impact.offsetWidth;
    impact.classList.add("show");
  }

  playerAttack(useUltimate = false) {
    if (this.over || this.turn !== "player") return;
    if (useUltimate && this.player.ultimates <= 0) return;

    const damage = useUltimate
      ? this.player.superHit
      : this.player.hit;

    if (useUltimate) this.player.ultimates--;

    this.dragon.hp = Math.max(
      0,
      this.dragon.hp - damage
    );

    this.animate("knightSprite", "attacking", 450);
    this.animate("dragonSprite", "hurt", 350);
    this.showImpact(useUltimate ? "✹" : "⚔");

    this.addLog(
      useUltimate
        ? `Суперудар! Рыцарь наносит ${damage} урона.`
        : `Рыцарь рубит дракона мечом: −${damage} здоровья.`,
      "good"
    );

    this.render();

    if (this.checkEnd()) return;

    this.turn = "dragon";
    this.updateTurn();

    setTimeout(() => this.dragonAttack(), 850);
  }

  prepareShield() {
    if (
      this.over ||
      this.turn !== "player" ||
      this.player.shield <= 0
    ) return;

    this.player.shieldReady = true;

    document.getElementById("shieldArt")
      .classList.add("raised");

    this.addLog(
      "Рыцарь поднимает щит и готовится к удару.",
      "good"
    );

    this.turn = "dragon";
    this.updateTurn();

    setTimeout(() => this.dragonAttack(), 750);
  }

  dragonAttack() {
    if (this.over) return;

    const attack = this.dragon.attack();

    this.animate("dragonSprite", "dragon-attacking", 600);

    if (attack.fire) {
      document.getElementById("dragonSide")
        .classList.add("breathing");

      this.spawnFire();

      setTimeout(() => {
        document.getElementById("dragonSide")
          .classList.remove("breathing");
      }, 750);
    }

    setTimeout(() => {
      if (this.player.shieldReady && this.player.shield > 0) {
        const absorbed = Math.min(
          this.player.shield,
          attack.damage
        );

        this.player.shield = Math.max(
          0,
          this.player.shield - attack.damage
        );

        const remaining = attack.damage - absorbed;

        if (remaining > 0) {
          this.player.hp = Math.max(
            0,
            this.player.hp - remaining
          );
        }

        this.player.shieldReady = false;

        document.getElementById("shieldArt")
          .classList.remove("raised");

        this.showImpact("🛡");
        this.animate("knightSprite", "hurt", 350);

        this.addLog(
          `Щит блокирует ${absorbed} урона` +
          (remaining
            ? `, ещё ${remaining} проходит сквозь защиту.`
            : ". Удар отражён!"),
          remaining ? "danger" : "good"
        );
      } else {
        this.player.hp = Math.max(
          0,
          this.player.hp - attack.damage
        );

        this.animate("knightSprite", "hurt", 350);
        this.showImpact(attack.fire ? "🔥" : "✦");

        this.addLog(
          attack.fire
            ? `Дракон изрыгает пламя! −${attack.damage} здоровья.`
            : `Дракон бьёт когтями: −${attack.damage} здоровья.`,
          "danger"
        );
      }

      this.render();

      if (this.checkEnd()) return;

      this.turn = "player";
      this.updateTurn();
    }, attack.fire ? 420 : 300);
  }

  spawnFire() {
    const canvas = document.getElementById("effects");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const particles = Array.from({ length: 42 }, () => ({
      x: rect.width * 0.77,
      y: rect.height * 0.48 + (Math.random() - 0.5) * 24,
      vx: -(3 + Math.random() * 6),
      vy: (Math.random() - 0.5) * 3,
      r: 3 + Math.random() * 10,
      life: 1
    }));

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.r *= 0.985;
        p.life -= 0.025;

        ctx.globalAlpha = Math.max(0, p.life);

        const grad = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.r * 2
        );

        grad.addColorStop(0, "#fff5b0");
        grad.addColorStop(0.3, "#ffb12f");
        grad.addColorStop(1, "#ed3e20");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(
          p.x, p.y, p.r * 1.7, p.r,
          -0.2, 0, Math.PI * 2
        );
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      frame++;

      if (frame < 22) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    };

    requestAnimationFrame(draw);
  }

  checkEnd() {
    if (this.dragon.hp > 0 && this.player.hp > 0) {
      return false;
    }

    this.over = true;

    if (this.dragon.hp <= 0 && this.player.hp <= 0) {
      this.finish(
        "НИЧЬЯ",
        "Оба бойца пали в этой битве.",
        "⚖"
      );
    } else if (this.dragon.hp <= 0) {
      this.finish(
        "ПОБЕДА!",
        "Дракон повержен. Королевство спасено!",
        "♛"
      );
    } else {
      this.finish(
        "ПОРАЖЕНИЕ",
        "Дракон оказался сильнее. Попробуй снова.",
        "🔥"
      );
    }

    return true;
  }

  finish(title, message, emblem) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalText").textContent = message;
    document.getElementById("modalEmblem").textContent = emblem;
    document.getElementById("endModal")
      .classList.remove("hidden");

    document.getElementById("turnIndicator").textContent =
      "● БИТВА ОКОНЧЕНА";

    document.getElementById("hintText").textContent = message;

    this.updateButtons();
  }

  updateTurn() {
    if (this.over) return;

    const playerTurn = this.turn === "player";

    document.getElementById("turnIndicator").textContent =
      playerTurn ? "● ТВОЙ ХОД" : "● ХОД ДРАКОНА";

    document.getElementById("hintText").textContent =
      playerTurn
        ? "Выбери действие. Щит блокирует следующий удар."
        : "Дракон готовит ответную атаку…";

    this.updateButtons();
  }

  updateButtons() {
    const active = this.turn === "player" && !this.over;

    document.getElementById("attackBtn").disabled = !active;

    document.getElementById("ultimateBtn").disabled =
      !active || this.player.ultimates <= 0;

    document.getElementById("shieldBtn").disabled =
      !active || this.player.shield <= 0;
  }

  render() {
    if (!this.player || !this.dragon) return;

    const p = this.player;
    const d = this.dragon;

    setText("playerHpText", `${p.hp} / ${p.maxHp}`);
    setText("dragonHpText", `${d.hp} / ${d.maxHp}`);
    setText("playerHit", p.hit);
    setText("playerUltCount", p.ultimates);

    setText(
      "shieldText",
      `Щит: ${p.shield} / ${p.maxShield}` +
      (p.shieldReady ? " · поднят" : "")
    );

    setText("dragonHit", d.hit);
    setText("dragonFireCount", d.fireCount);

    document.getElementById("playerHpBar").style.width =
      `${p.hp / p.maxHp * 100}%`;

    document.getElementById("dragonHpBar").style.width =
      `${d.hp / d.maxHp * 100}%`;

    setText(
      "roundBadge",
      `БИТВА ${String(this.round).padStart(2, "0")}`
    );

    this.updateButtons();
  }
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

const game = new Game();

document.getElementById("attackBtn")
  .addEventListener("click", () => game.playerAttack(false));

document.getElementById("ultimateBtn")
  .addEventListener("click", () => game.playerAttack(true));

document.getElementById("shieldBtn")
  .addEventListener("click", () => game.prepareShield());

document.getElementById("restartBtn")
  .addEventListener("click", () => game.reset(true));

document.getElementById("modalRestart")
  .addEventListener("click", () => game.reset(true));

document.getElementById("clearLogBtn")
  .addEventListener("click", () => {
    game.log = [];
    game.addLog("Летопись очищена. Битва продолжается.", "muted");
  });

document.addEventListener("keydown", event => {
  if (event.repeat || event.target.matches("input,textarea")) return;

  if (event.key === "1") game.playerAttack(false);
  if (event.key === "2") game.prepareShield();
  if (event.key === "3") game.playerAttack(true);
});
