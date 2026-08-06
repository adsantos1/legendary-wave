import * as THREE from 'three';

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.touchJoystick = { active: false, dx: 0, dz: 0, startX: 0, startY: 0 };
    this.touchShooting = false;
    this.dashTriggered = false;
    this.weaponSelectTriggered = null;
    this.toggleTimeTriggered = false;
    this.pauseTriggered = false;

    // Gamepad state
    this.gamepadIndex = null;
    this.gamepadConnected = false;
    this.gamepadAimDir = null; // { x, z }
    this.gamepadShooting = false;
    this.prevGamepadButtons = {};

    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        this.weaponSelectTriggered = parseInt(e.key) - 1;
      }
      if (e.code === 'Space') {
        this.dashTriggered = true;
      }
      if (e.key.toLowerCase() === 't') {
        this.toggleTimeTriggered = true;
      }
      if (e.code === 'Escape' || e.key.toLowerCase() === 'p') {
        this.pauseTriggered = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.down = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    // Gamepad connection listeners
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
      this.gamepadConnected = true;
      this.updateGamepadHUD(true);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.gamepadConnected = false;
        this.updateGamepadHUD(false);
      }
    });

    this.setupTouchControls();
  }

  updateGamepadHUD(connected) {
    const card = document.getElementById('gamepad-card-btn');
    if (card) {
      if (connected) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    }
  }

  setupTouchControls() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const touchFireBtn = document.getElementById('touch-fire-btn');
    const touchDashBtn = document.getElementById('touch-dash-btn');

    if (!joystickZone) return;

    joystickZone.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = joystickZone.getBoundingClientRect();
      this.touchJoystick.active = true;
      this.touchJoystick.startX = rect.left + rect.width / 2;
      this.touchJoystick.startY = rect.top + rect.height / 2;
      this.updateJoystick(touch, joystickKnob);
    }, { passive: true });

    joystickZone.addEventListener('touchmove', (e) => {
      if (!this.touchJoystick.active) return;
      const touch = e.touches[0];
      this.updateJoystick(touch, joystickKnob);
    }, { passive: true });

    const resetJoystick = () => {
      this.touchJoystick.active = false;
      this.touchJoystick.dx = 0;
      this.touchJoystick.dz = 0;
      if (joystickKnob) {
        joystickKnob.style.transform = `translate(0px, 0px)`;
      }
    };

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    if (touchFireBtn) {
      touchFireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchShooting = true;
      });
      touchFireBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.touchShooting = false;
      });
    }

    if (touchDashBtn) {
      touchDashBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.dashTriggered = true;
      });
    }
  }

  updateJoystick(touch, knob) {
    const maxRadius = 40;
    let deltaX = touch.clientX - this.touchJoystick.startX;
    let deltaY = touch.clientY - this.touchJoystick.startY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist > maxRadius) {
      deltaX = (deltaX / dist) * maxRadius;
      deltaY = (deltaY / dist) * maxRadius;
    }

    if (knob) {
      knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    this.touchJoystick.dx = deltaX / maxRadius;
    this.touchJoystick.dz = deltaY / maxRadius;
  }

  pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;

    if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
      gp = gamepads[this.gamepadIndex];
    } else {
      // Find first available connected gamepad
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          gp = gamepads[i];
          this.gamepadIndex = i;
          if (!this.gamepadConnected) {
            this.gamepadConnected = true;
            this.updateGamepadHUD(true);
          }
          break;
        }
      }
    }

    if (!gp) return null;

    // Helper for deadzone
    const applyDeadzone = (val, threshold = 0.18) => Math.abs(val) > threshold ? val : 0;

    // 1. Left Stick Movement
    const moveX = applyDeadzone(gp.axes[0]);
    const moveZ = applyDeadzone(gp.axes[1]);

    // 2. Right Stick Aiming
    const aimX = applyDeadzone(gp.axes[2]);
    const aimZ = applyDeadzone(gp.axes[3]);
    const aimLen = Math.sqrt(aimX * aimX + aimZ * aimZ);

    if (aimLen > 0.2) {
      this.gamepadAimDir = { x: aimX / aimLen, z: aimZ / aimLen };
      this.gamepadRightStickActive = true;
    } else {
      this.gamepadRightStickActive = false;
    }

    // 3. Triggers & Shooting (RT for Shooting)
    const rtVal = gp.buttons[7] ? gp.buttons[7].value : 0;
    const rtPressed = gp.buttons[7] ? gp.buttons[7].pressed : false;
    this.gamepadShooting = rtVal > 0.2 || rtPressed;

    // Helper for edge-triggered buttons (press once)
    const isJustPressed = (btnIndex) => {
      const pressed = gp.buttons[btnIndex] && (gp.buttons[btnIndex].pressed || gp.buttons[btnIndex].value > 0.5);
      const wasPressed = !!this.prevGamepadButtons[btnIndex];
      this.prevGamepadButtons[btnIndex] = pressed;
      return pressed && !wasPressed;
    };

    // 4. Dash: A button (0) or LT trigger (6)
    const aPressed = isJustPressed(0);
    const ltPressed = gp.buttons[6] && gp.buttons[6].value > 0.5;
    if (aPressed || ltPressed) {
      this.dashTriggered = true;
    }

    // 5. Day/Night Toggle: Y button (3)
    if (isJustPressed(3)) {
      this.toggleTimeTriggered = true;
    }

    // 6. Pause: Start button (9), Select button (8)
    if (isJustPressed(9) || isJustPressed(8)) {
      this.pauseTriggered = true;
    }

    // 7. Weapon Switch: LB (4) -> Previous, RB (5) / X (2) -> Next, D-Pad -> Direct selection
    if (isJustPressed(4)) { // LB -> Change to Previous Weapon
      this.weaponSelectTriggered = 'prev';
    }
    if (isJustPressed(5) || isJustPressed(2)) { // RB / X -> Change to Next Weapon
      this.weaponSelectTriggered = 'next';
    }
    if (isJustPressed(12)) this.weaponSelectTriggered = 0; // D-Pad Up -> Pistol
    if (isJustPressed(13)) this.weaponSelectTriggered = 1; // D-Pad Down -> Shotgun
    if (isJustPressed(14)) this.weaponSelectTriggered = 2; // D-Pad Left -> Rifle
    if (isJustPressed(15)) this.weaponSelectTriggered = 3; // D-Pad Right -> SMG

    return { moveX, moveZ };
  }

  getMovementVector() {
    let dx = 0;
    let dz = 0;

    // Keyboard
    if (this.keys['w'] || this.keys['arrowup']) dz -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dz += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    // Touch Joystick
    if (this.touchJoystick.active) {
      dx += this.touchJoystick.dx;
      dz += this.touchJoystick.dz;
    }

    // Gamepad Stick
    const gpMove = this.pollGamepad();
    if (gpMove) {
      dx += gpMove.moveX;
      dz += gpMove.moveZ;
    }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0.001) {
      const normalizedDx = dx / len;
      const normalizedDz = dz / len;

      if (!this.gamepadRightStickActive && (dx !== 0 || dz !== 0)) {
        this.lastMovementAimDir = { x: normalizedDx, z: normalizedDz };
      }

      return { dx: normalizedDx, dz: normalizedDz, isMoving: true };
    }
    return { dx: 0, dz: 0, isMoving: false };
  }

  getAimDirection(camera, playerPos) {
    if (this.gamepadConnected) {
      if (this.gamepadRightStickActive && this.gamepadAimDir) {
        return new THREE.Vector3(this.gamepadAimDir.x, 0, this.gamepadAimDir.z).normalize();
      }
      if (this.lastMovementAimDir) {
        return new THREE.Vector3(this.lastMovementAimDir.x, 0, this.lastMovementAimDir.z).normalize();
      }
    }

    // Default Mouse Raycast
    this.mouseNDC.x = (this.mouse.x / window.innerWidth) * 2 - 1;
    this.mouseNDC.y = -(this.mouse.y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, camera);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, target);

    if (!target) return new THREE.Vector3(0, 0, 1);

    const dir = new THREE.Vector3(target.x - playerPos.x, 0, target.z - playerPos.z);
    dir.normalize();
    return dir;
  }

  isShooting() {
    return this.mouse.down || this.touchShooting || this.gamepadShooting;
  }

  consumeDash() {
    if (this.dashTriggered) {
      this.dashTriggered = false;
      return true;
    }
    return false;
  }

  consumeWeaponSelect() {
    const sel = this.weaponSelectTriggered;
    this.weaponSelectTriggered = null;
    return sel;
  }

  consumeToggleTime() {
    if (this.toggleTimeTriggered) {
      this.toggleTimeTriggered = false;
      return true;
    }
    return false;
  }

  consumePause() {
    if (this.pauseTriggered) {
      this.pauseTriggered = false;
      return true;
    }
    return false;
  }
}
