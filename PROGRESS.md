# 🌊 LEGENDARY WAVE - Project Roadmap & Progress Checklist

## 📌 Project Overview
**LEGENDARY WAVE** is a high-octane 3D top-down MOBA-style zombie wave survival shooter built with **Three.js**, **Vite**, and **Web Audio API**. Designed for instant browser play with full Keyboard/Mouse and Xbox Gamepad support.

---

## Phase 1: Core Foundation & Framework Migration (Completed)
- [x] Migrate legacy HTML single-file prototype into modular Vite + Three.js project structure
- [x] Glassmorphism HUD overlay with dynamic HP, Dash Cooldown, Kills, Wave, and Score counters
- [x] Responsive 60 FPS WebGL renderer with anti-aliasing & post-processing shadows
- [x] Mobile Web Touch Controls (Virtual Joystick + Action buttons)
- [x] Sound FX synthesis engine (Web Audio API for guns, explosions, damage, wave clears)
- [x] Author Credit & Instagram Link ("Created by Arnold Santos" -> https://www.instagram.com/arnoldsantosart)

---

## Phase 2: Controls & Weapon System Expansion (Completed)
- [x] Full HTML5 Gamepad API integration (Xbox twin-stick controls, deadzones, single-press button tracking)
- [x] Dedicated 360° Right Stick aiming without auto-fire; RT for shooting, LT/A for Dash
- [x] LB / RB weapon cycling & D-Pad direct weapon selection
- [x] 8 Distinct Weapons Implemented:
  - [x] Pistol (Unlimited ammo)
  - [x] Shotgun (Spread burst)
  - [x] Assault Rifle (Rapid fire)
  - [x] SMG (High fire-rate spray)
  - [x] Plasma Sniper (High damage piercing rail)
  - [x] Minigun (Ultra fast gatling)
  - [x] RPG Rocket Launcher (AOE explosion & distance-falloff blast physics)
  - [x] Flamethrower (Cone spray damage & flame particle streams)
- [x] Scavengeable glowing weapon crates spawning throughout arena

---

## Phase 3: Environment, Lighting & Dynamic Architecture (Completed)
- [x] Dynamic Day/Night Lighting Cycle (Bright sunlight vs Night navy mode with dense fog)
- [x] Time toggle key (`T` / `Y` button / HUD Card button)
- [x] 3D Boundary walls and procedural city obstacles
- [x] **4 Distinct 3D Enterable Buildings & Compound Structure**:
  - [x] **Red Country Barn** at `(20, 12)` ($14 \times 18$, crimson wood, hay bales, warm lantern)
  - [x] **Tactical Outpost Compound** at `(-24, -18)` ($16 \times 20$, slate stone brick, supply crates, warm lantern)
  - [x] **Supply Hangar Armory** at `(-26, 22)` ($18 \times 16$, industrial corrugated steel, steel shelves, cyan industrial light)
  - [x] **Brick Watchtower Refuge** at `(24, -22)` ($14 \times 14$, reinforced red brick, tactical table, warm yellow light)
  - [x] **Dynamic Roof Disappear Mechanics**: All roofs smoothly fade to 0% opacity when hero enters any building doorway!

---

## Phase 4: Low-Poly 3D Characters & Camera Engine (Completed)
- [x] Low-Poly Tactical Hero 3D Model with Kevlar vest, helmet, glowing visor, backpack, and boots
- [x] Jointed hero running limb animation physics & breathing idle motion
- [x] 4 Low-Poly Zombie Archetypes (Walkers, Runners, Toxic Spitters, Brute Tanks) with jointed lunge-running physics
- [x] `GLTFLoader` and `AnimationManager` skeletal animation engine integration (`public/assets/README.txt`)
- [x] **Dynamic Tactical MOBA Camera**:
  - [x] Aim Look-Ahead Pan (3.5 unit offset towards mouse/gamepad aim direction)
  - [x] Spring-damped smooth LERP tracking (`dt * 8.0`)
  - [x] Zero camera jostling filter for right stick aiming
  - [x] Mouse scroll wheel dynamic zoom in/out

---

## Phase 5: Upcoming Features & Enhancements (Planned / Next)

### 5.1 Mega Boss Zombie & Horde Mechanics
- [x] **Mega Boss Zombie (Abomination)**: Spawns every 5 waves (Wave 5, 10, 15...) with top-center Neon Boss HP Bar & warning banner!
  - [x] **Ground Pound Smash**: AOE shockwave ring that damages & knocks player back with screen shake
  - [x] **Berserker Charge**: High-speed straight line rush attack (3.5x speed)
  - [x] **Abomination Titan Scale**: 2.6x giant crimson brute model with glowing red eyes
- [x] **Punk Zombie Biker Escort**: High-speed Motorbike Biker with Neon Green Mohawk, Studded Leather Jacket, Chopper mesh, exhaust smoke FX, and engine roar audio that spawns alongside the Mega Boss!
- [ ] Horde Wave Modifiers (e.g. Fast Runner Swarm Wave, Foggy Night Tank Wave)

### 5.2 Explosives, Environment Interactables & Turrets
- [x] **Red Explosive Barrels**: Placed around arena with hazard bands; explode when shot (160 AOE damage, shockwaves, screen shake, and zombie group obliteration!)
- [x] **Banana Health & Slip Peel Trap System**: Pick up 3D bananas (+35 HP heal) & drop banana peels on floor that cause zombies to slip, spin out of control, and slow down by 75% for 3.5 seconds!
- [ ] **Deployable Auto-Turrets**: Collectable turret items that automatically target nearby zombies
- [ ] Barricades & Repairable Fences

### 5.3 Hero Ultimate Abilities & Power-ups
- [ ] **Airstrike Bombardment**: Call down orbital missile strikes on target location
- [ ] **Personal Energy Shield**: Temporary invincibility barrier
- [ ] **Freeze Grenade**: Slows/freezes all zombies in blast radius for 4 seconds
- [ ] Temporary Power-up Crates (Double Damage, Speed Boost, Unlimited Ammo)

### 5.4 Perk & Upgrade Shop System
- [ ] In-Game Upgrade Terminal / Inter-wave Shop Screen:
  - [ ] Upgrade Max HP (+25 HP)
  - [ ] Upgrade Movement Speed & Dash Cooldown
  - [ ] Upgrade Armor (Damage Reduction)
  - [ ] Upgrade Ammo Capacity & Weapon Damage

### 5.5 Audio & Synthwave BGM Engine
- [ ] Dynamic Synthwave / Cyberpunk Zombie Action BGM (synthesized or audio tracks)
- [ ] Music intensity increases during Night waves and Boss fights

### 5.6 High Score & Save System
- [ ] LocalStorage High Score Leaderboard & Stats Tracking (Highest Wave, Total Kills, Best Score)
- [ ] Custom Player Name Input & Achievements System
