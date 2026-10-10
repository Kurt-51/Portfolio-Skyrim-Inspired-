import { sound, SKYRIM_SHOUTS } from './audio.js';
import { PORTFOLIO_DATA } from './data.js';

/**
 * Skyrim Main Application Coordinator
 * - Rotating Dragonborn Thu'um Shouts with bespoke procedural acoustics (No on-screen text banner)
 * - Procedural Skyrim "Dragonborn" Theme Song ("Sons of Skyrim") with full Play/Pause & Mute/Unmute
 * - Stealth Eye reticle, Magicka regeneration, and modal mechanics
 */

class App {
  constructor() {
    this.maxMagicka = 450;
    this.currentMagicka = 450;
    this.isRecharging = false;
    this.isAudioMuted = false;

    this.init();
  }

  init() {
    // 1. Setup Stealth Eye Reticle
    this.initStealthEye();

    // 3. Setup Rotating Thu'um Shout Mechanics
    this.initShoutMechanics();

    // 4. Setup Project Gallery & Filters
    this.initGallery();

    // 5. Setup Modals
    this.initModals();

    // 6. Setup Navigation & Audio Toggles
    this.initNav();

    // 7. Setup Keyboard Shortcuts
    this.initKeyboard();

    // 8. Start Natural Magicka Regeneration Loop
    this.startMagickaRegen();
  }

  initStealthEye() {
    const reticle = document.getElementById('hud-crosshair');
    if (!reticle) return;

    window.addEventListener('pointermove', (e) => {
      reticle.style.left = `${e.clientX}px`;
      reticle.style.top = `${e.clientY}px`;
    });
  }

  initShoutMechanics() {
    const shoutBtn = document.getElementById('hud-fire-btn');
    const heroShoutBtn = document.getElementById('hero-fire-btn');
    const potionBtn = document.getElementById('hud-reload-btn');

    const handleShout = () => {
      this.castThuUm();
    };

    if (shoutBtn) shoutBtn.addEventListener('click', handleShout);
    if (heroShoutBtn) heroShoutBtn.addEventListener('click', handleShout);
    if (potionBtn) potionBtn.addEventListener('click', () => this.drinkPotion());

    // Left click on screen to cast a rotating shout (if not clicking interactive HTML elements)
    window.addEventListener('pointerdown', (e) => {
      if (
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('.modal-content') ||
        e.target.closest('.nav-links')
      ) {
        return;
      }
      this.castThuUm();
    });
  }

  castThuUm() {
    const shoutCost = 75;

    if (this.currentMagicka < shoutCost) {
      sound.playEmptyClick();
      const statusEl = document.getElementById('hud-reload-status');
      if (statusEl) {
        statusEl.textContent = 'LOW MAGICKA!';
        statusEl.style.color = '#ef4444';
        setTimeout(() => {
          if (statusEl) {
            statusEl.textContent = "THU'UM READY";
            statusEl.style.color = 'var(--skyrim-aurora)';
          }
        }, 1200);
      }
      return;
    }

    // 1. Drain Magicka
    this.currentMagicka = Math.max(0, this.currentMagicka - shoutCost);
    this.updateMagickaDisplay();

    // 2. Pick next rotating Skyrim Dragon Shout
    const shout = sound.getNextShout();

    // 3. Play the distinct sound synthesis for this shout
    sound.playShout(shout.type);

    // 4. Ethereal Screen Flash & Stealth Eye Opening (No on-screen shout text)
    const flash = document.getElementById('screen-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 120);
    }

    const reticle = document.getElementById('hud-crosshair');
    if (reticle) {
      reticle.classList.add('firing');
      setTimeout(() => reticle.classList.remove('firing'), 380);
    }

    // Steel blade draw chime follow-up
    setTimeout(() => {
      sound.playSwordDraw();
    }, 480);
  }

  drinkPotion() {
    if (this.isRecharging || this.currentMagicka >= this.maxMagicka) return;
    this.isRecharging = true;

    sound.playSpellRecharge();

    const statusEl = document.getElementById('hud-reload-status');
    if (statusEl) statusEl.textContent = 'RECHARGING...';

    setTimeout(() => {
      this.currentMagicka = this.maxMagicka;
      this.isRecharging = false;
      this.updateMagickaDisplay();
      if (statusEl) {
        statusEl.textContent = "THU'UM READY";
        statusEl.style.color = 'var(--skyrim-aurora)';
      }
    }, 600);
  }

  updateMagickaDisplay() {
    const magickaBar = document.getElementById('bar-magicka');
    const magickaNum = document.getElementById('num-magicka');

    const pct = Math.max(0, Math.min(100, (this.currentMagicka / this.maxMagicka) * 100));

    if (magickaBar) {
      magickaBar.style.width = `${pct}%`;
    }
    if (magickaNum) {
      magickaNum.textContent = `${Math.round(this.currentMagicka)}/${this.maxMagicka}`;
    }
  }

  startMagickaRegen() {
    setInterval(() => {
      if (this.currentMagicka < this.maxMagicka && !this.isRecharging) {
        this.currentMagicka = Math.min(this.maxMagicka, this.currentMagicka + 12);
        this.updateMagickaDisplay();
      }
    }, 400);
  }

  initGallery() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const category = tab.dataset.filter;
        this.renderGallery(category);
        sound.playUiBeep(900);
      });
    });

    this.renderGallery('all');
  }

  renderGallery(filter) {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    const filtered =
      filter === 'all'
        ? PORTFOLIO_DATA.projects
        : PORTFOLIO_DATA.projects.filter((p) => p.category === filter);

    galleryGrid.innerHTML = filtered
      .map(
        (project) => `
      <article class="project-card" data-id="${project.id}">
        <div class="project-thumb-frame">
          <img src="${project.image}" alt="${project.title}" class="project-thumb" loading="lazy" />
        </div>
        <div class="project-body">
          <div class="project-badge">◈ ${project.categoryLabel}</div>
          <h3 class="project-title">${project.title}</h3>
          <p class="project-desc">${project.desc}</p>
          <div class="tags-cloud">
            ${project.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </article>
    `
      )
      .join('');

    galleryGrid.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const project = PORTFOLIO_DATA.projects.find((p) => p.id === id);
        if (project) this.openProjectModal(project);
      });
    });
  }

  initModals() {
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop').classList.remove('open');
        sound.playUiBeep(700);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
          sound.playUiBeep(700);
        }
      });
    });
  }

  openProjectModal(project) {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    document.getElementById('modal-project-title').textContent = project.title;
    document.getElementById('modal-project-type').textContent = `◈ ${project.categoryLabel}`;
    document.getElementById('modal-project-desc').textContent = project.desc;
    document.getElementById('modal-project-img').src = project.image;

    const tagsContainer = document.getElementById('modal-project-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = project.tags
        .map((t) => `<span class="tag">${t}</span>`)
        .join('');
    }

    modal.classList.add('open');
    sound.playLevelUp();
  }

  initNav() {
    // Music Play/Pause Toggle
    const musicPlayBtn = document.getElementById('btn-music-toggle');
    if (musicPlayBtn) {
      musicPlayBtn.addEventListener('click', () => {
        const isPlaying = sound.toggleDragonbornSong();
        musicPlayBtn.textContent = 'Music';
        musicPlayBtn.classList.toggle('active', isPlaying);
        if (isPlaying) {
          sound.playLevelUp();
        }
      });
    }

    // Sound FX Mute Toggle
    const sfxBtn = document.getElementById('btn-sound-toggle');
    if (sfxBtn) {
      sfxBtn.addEventListener('click', () => {
        this.isAudioMuted = sound.toggleMute();
        sfxBtn.textContent = this.isAudioMuted ? 'SFX: OFF' : 'SFX: ON';
        sfxBtn.classList.toggle('active', !this.isAudioMuted);
      });
    }

    // Contact Form submission (Courier Letter)
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        sound.playLevelUp();
        alert('◈ COURIER DISPATCHED: "Hey, you. You\'re finally awake. I have delivered your letter into the hands of Leon B. Escaner. May the Divines guide your path."');
        form.reset();
      });
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.castThuUm();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.drinkPotion();
      } else if (e.code === 'KeyP' || e.code === 'KeyM') {
        const musicPlayBtn = document.getElementById('btn-music-toggle');
        if (musicPlayBtn) musicPlayBtn.click();
      }
    });
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
