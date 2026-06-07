// ═══════════════════════════════════════════════════
// WEAPON SKIN MANAGER — Krunker-style skin system
// Spin gacha, marketplace, rarity tiers
// ═══════════════════════════════════════════════════

export const RARITY = {
  COMMON:       { key: 'common',       label: 'Common',       color: '#aaaaaa', glow: '#888888', chance: 40 },
  UNCOMMON:     { key: 'uncommon',     label: 'Uncommon',     color: '#44cc44', glow: '#33aa33', chance: 25 },
  RARE:         { key: 'rare',         label: 'Rare',         color: '#4488ff', glow: '#3366dd', chance: 18 },
  EPIC:         { key: 'epic',         label: 'Epic',         color: '#aa44ff', glow: '#8833dd', chance: 10 },
  LEGENDARY:    { key: 'legendary',    label: 'Legendary',    color: '#ffaa00', glow: '#dd8800', chance: 5 },
  MYTHIC:       { key: 'mythic',       label: 'Mythic',       color: '#ff3366', glow: '#dd2244', chance: 1.8 },
  UNOBTAINABLE: { key: 'unobtainable', label: 'Unobtainable', color: '#ff00ff', glow: '#cc00cc', chance: 0.2 },
};

// Full skin catalog
export const SKIN_CATALOG = [
  // ─── COMMON (40%) ───
  { id: 'default',      name: 'Standard Issue',  rarity: RARITY.COMMON, price: 0,    body: 0x3a3a52, accent: 0x00ffcc, dark: 0x22223a, barrel: 0x4a4a62, grip: 0x282840, desc: 'Arme de base' },
  { id: 'slate',        name: 'Slate',           rarity: RARITY.COMMON, price: 50,   body: 0x445566, accent: 0x88aacc, dark: 0x334455, barrel: 0x556677, grip: 0x2a3a4a, desc: 'Finition ardoise classique' },
  { id: 'sand',         name: 'Desert Sand',     rarity: RARITY.COMMON, price: 50,   body: 0x8a7a60, accent: 0xccbb88, dark: 0x6a5a40, barrel: 0x9a8a70, grip: 0x5a4a30, desc: 'Camouflage desert' },
  { id: 'olive',        name: 'Military Olive',  rarity: RARITY.COMMON, price: 50,   body: 0x4a5a30, accent: 0x88aa44, dark: 0x3a4a20, barrel: 0x5a6a40, grip: 0x2a3a10, desc: 'Vert militaire' },
  { id: 'gunmetal',     name: 'Gunmetal',        rarity: RARITY.COMMON, price: 60,   body: 0x3a3a44, accent: 0x7788aa, dark: 0x2a2a34, barrel: 0x4a4a55, grip: 0x222230, desc: 'Acier bruni' },
  { id: 'snow',         name: 'Arctic White',    rarity: RARITY.COMMON, price: 60,   body: 0xccccdd, accent: 0xeeeeff, dark: 0xaaaabb, barrel: 0xbbbbcc, grip: 0x999aaa, desc: 'Camouflage neige' },
  { id: 'rust',         name: 'Rusty',           rarity: RARITY.COMMON, price: 40,   body: 0x6a3a22, accent: 0xaa5533, dark: 0x4a2a12, barrel: 0x7a4a32, grip: 0x3a2010, desc: 'Rouille vintage' },
  { id: 'midnight',     name: 'Midnight',        rarity: RARITY.COMMON, price: 50,   body: 0x1a1a2e, accent: 0x3344aa, dark: 0x0d0d1a, barrel: 0x2a2a3e, grip: 0x111122, desc: 'Noir profond' },

  // ─── UNCOMMON (25%) ───
  { id: 'crimson',      name: 'Crimson Fury',    rarity: RARITY.UNCOMMON, price: 120, body: 0x661122, accent: 0xff2244, dark: 0x440011, barrel: 0x772233, grip: 0x330011, desc: 'Rouge sang intense' },
  { id: 'ocean',        name: 'Deep Ocean',      rarity: RARITY.UNCOMMON, price: 120, body: 0x1a3355, accent: 0x00aaff, dark: 0x0d2244, barrel: 0x2a4466, grip: 0x0a1a33, desc: 'Bleu ocean profond' },
  { id: 'toxic',        name: 'Toxic Waste',     rarity: RARITY.UNCOMMON, price: 130, body: 0x2a3a1a, accent: 0x66ff00, dark: 0x1a2a0a, barrel: 0x3a4a2a, grip: 0x1a2a0a, desc: 'Vert toxique radioactif' },
  { id: 'violet',       name: 'Purple Haze',     rarity: RARITY.UNCOMMON, price: 120, body: 0x3a2255, accent: 0xaa66ff, dark: 0x2a1144, barrel: 0x4a3366, grip: 0x1a0a33, desc: 'Brume violette' },
  { id: 'copper',       name: 'Burnished Copper', rarity: RARITY.UNCOMMON, price: 140, body: 0x7a4422, accent: 0xdd8844, dark: 0x5a3312, barrel: 0x8a5533, grip: 0x4a2a11, desc: 'Cuivre poli' },
  { id: 'frost',        name: 'Frostbite',       rarity: RARITY.UNCOMMON, price: 130, body: 0x88bbdd, accent: 0xaaddff, dark: 0x6699bb, barrel: 0x99ccee, grip: 0x5588aa, desc: 'Glace givrante' },
  { id: 'sakura',       name: 'Sakura',          rarity: RARITY.UNCOMMON, price: 150, body: 0x553344, accent: 0xff88aa, dark: 0x442233, barrel: 0x664455, grip: 0x331122, desc: 'Cerisier japonais' },
  { id: 'carbon',       name: 'Carbon Fiber',    rarity: RARITY.UNCOMMON, price: 140, body: 0x2a2a2a, accent: 0xff4400, dark: 0x1a1a1a, barrel: 0x3a3a3a, grip: 0x111111, desc: 'Fibre de carbone racing' },

  // ─── RARE (18%) ───
  { id: 'neon_pink',    name: 'Neon Punk',       rarity: RARITY.RARE, price: 250, body: 0x220022, accent: 0xff00ff, dark: 0x110011, barrel: 0x330033, grip: 0x110011, desc: 'Cyberpunk neon rose' },
  { id: 'gold_rush',    name: 'Gold Rush',       rarity: RARITY.RARE, price: 280, body: 0x8a7722, accent: 0xffdd44, dark: 0x6a5500, barrel: 0x9a8833, grip: 0x554400, desc: 'Plaque or massif' },
  { id: 'electric',     name: 'Electric Storm',  rarity: RARITY.RARE, price: 260, body: 0x112244, accent: 0x44ddff, dark: 0x0a1133, barrel: 0x223355, grip: 0x081122, desc: 'Eclairs electriques' },
  { id: 'inferno',      name: 'Inferno',         rarity: RARITY.RARE, price: 270, body: 0x441100, accent: 0xff6600, dark: 0x330a00, barrel: 0x552200, grip: 0x220800, desc: 'Feu infernal' },
  { id: 'venom',        name: 'Venom Strike',    rarity: RARITY.RARE, price: 260, body: 0x0a2a1a, accent: 0x00ff88, dark: 0x051a0a, barrel: 0x1a3a2a, grip: 0x041108, desc: 'Venin de serpent' },
  { id: 'phantom',      name: 'Phantom Gray',    rarity: RARITY.RARE, price: 240, body: 0x444455, accent: 0xccddff, dark: 0x333344, barrel: 0x555566, grip: 0x222233, desc: 'Fantome translucide' },
  { id: 'bloodmoon',    name: 'Blood Moon',      rarity: RARITY.RARE, price: 300, body: 0x2a0a0a, accent: 0xff0033, dark: 0x1a0505, barrel: 0x3a1a1a, grip: 0x150505, desc: 'Lune de sang' },

  // ─── EPIC (10%) ───
  { id: 'galaxy',       name: 'Galaxy',          rarity: RARITY.EPIC, price: 500, body: 0x0a0a2a, accent: 0xaa66ff, dark: 0x050515, barrel: 0x1a1a3a, grip: 0x080822, desc: 'Nebuleuse galactique' },
  { id: 'dragon',       name: 'Dragon Scale',    rarity: RARITY.EPIC, price: 550, body: 0x2a1100, accent: 0xff4400, dark: 0x1a0800, barrel: 0x4a2200, grip: 0x150a00, desc: 'Ecailles de dragon' },
  { id: 'aurora',       name: 'Aurora Borealis', rarity: RARITY.EPIC, price: 520, body: 0x0a2233, accent: 0x00ffaa, dark: 0x051122, barrel: 0x1a3344, grip: 0x040d1a, desc: 'Aurore boreale magique' },
  { id: 'titanium',     name: 'Titanium Elite',  rarity: RARITY.EPIC, price: 480, body: 0x606680, accent: 0xeeeeff, dark: 0x4a4a60, barrel: 0x707790, grip: 0x3a3a50, desc: 'Titane premium poli' },
  { id: 'cherry',       name: 'Cherry Blossom',  rarity: RARITY.EPIC, price: 500, body: 0x442233, accent: 0xff66aa, dark: 0x331122, barrel: 0x553344, grip: 0x220a18, desc: 'Fleur de cerisier enchantee' },
  { id: 'cyberwave',    name: 'Cyberwave',       rarity: RARITY.EPIC, price: 550, body: 0x1a0a2a, accent: 0xff00cc, dark: 0x0d0518, barrel: 0x2a1a3a, grip: 0x0a0515, desc: 'Synthwave retro-futuriste' },

  // ─── LEGENDARY (5%) ───
  { id: 'void',         name: 'Void Walker',     rarity: RARITY.LEGENDARY, price: 1200, body: 0x050510, accent: 0x8800ff, dark: 0x020208, barrel: 0x0a0a1a, grip: 0x030308, desc: 'Forge dans le vide cosmique' },
  { id: 'solar',        name: 'Solar Flare',     rarity: RARITY.LEGENDARY, price: 1300, body: 0x553300, accent: 0xffcc00, dark: 0x331a00, barrel: 0x664400, grip: 0x2a1a00, desc: 'Eruption solaire brulante' },
  { id: 'frozen',       name: 'Frozen Abyss',    rarity: RARITY.LEGENDARY, price: 1100, body: 0x1a4466, accent: 0x00eeff, dark: 0x0d2233, barrel: 0x2a5577, grip: 0x0a1a2a, desc: 'Glace eternelle des abysses' },
  { id: 'obsidian',     name: 'Obsidian Edge',   rarity: RARITY.LEGENDARY, price: 1400, body: 0x111118, accent: 0xff2200, dark: 0x08080c, barrel: 0x1a1a22, grip: 0x0a0a0e, desc: 'Obsidienne tranchante volcanique' },
  { id: 'prismatic',    name: 'Prismatic',       rarity: RARITY.LEGENDARY, price: 1500, body: 0x2a2a3a, accent: 0x00ffcc, dark: 0x1a1a2a, barrel: 0x3a3a4a, grip: 0x151520, desc: 'Reflets prismatiques changeants' },

  // ─── MYTHIC (1.8%) ───
  { id: 'supernova',    name: 'Supernova',       rarity: RARITY.MYTHIC, price: 3000, body: 0x1a0505, accent: 0xff4400, dark: 0x0a0202, barrel: 0x2a0808, grip: 0x0a0303, desc: 'Explosion stellaire devastatrice' },
  { id: 'darkstar',     name: 'Dark Star',       rarity: RARITY.MYTHIC, price: 3200, body: 0x050510, accent: 0xaa00ff, dark: 0x020208, barrel: 0x080818, grip: 0x030308, desc: 'Etoile noire antimatiee' },
  { id: 'quantum',      name: 'Quantum Flux',    rarity: RARITY.MYTHIC, price: 3500, body: 0x0a1a2a, accent: 0x00ffff, dark: 0x050d15, barrel: 0x152535, grip: 0x040a12, desc: 'Fluctuation quantique instable' },
  { id: 'phoenix',      name: 'Phoenix Rebirth', rarity: RARITY.MYTHIC, price: 3000, body: 0x2a0a00, accent: 0xff8800, dark: 0x150500, barrel: 0x3a1a0a, grip: 0x120500, desc: 'Renaissance du phoenix immortel' },

  // ─── UNOBTAINABLE (0.2%) ───
  { id: 'chromatic',    name: 'Chromatic',       rarity: RARITY.UNOBTAINABLE, price: 9999, body: 0x1a1a2a, accent: 0xffffff, dark: 0x0d0d18, barrel: 0x2a2a3a, grip: 0x0a0a15, desc: 'Spectrum chromatique vivant — anime' },
  { id: 'singularity',  name: 'Singularity',     rarity: RARITY.UNOBTAINABLE, price: 9999, body: 0x000008, accent: 0xff00ff, dark: 0x000004, barrel: 0x000010, grip: 0x000004, desc: 'Point de singularite — trou noir absolu' },
];

// ── Spin tiers ──
export const SPIN_TIERS = [
  { id: 'basic',   name: 'Basic Spin',   price: 100,  label: '100 CR', guaranteedMinRarity: 'common' },
  { id: 'premium', name: 'Premium Spin', price: 400,  label: '400 CR', guaranteedMinRarity: 'uncommon' },
  { id: 'elite',   name: 'Elite Spin',   price: 1200, label: '1200 CR', guaranteedMinRarity: 'rare' },
];

export class WeaponSkinManager {
  constructor(profileManager) {
    this.pm = profileManager;
  }

  // ── Owned skins ──
  getOwnedSkins() {
    const p = this.pm.profile;
    if (!p.ownedSkins) p.ownedSkins = ['default'];
    return p.ownedSkins;
  }

  getEquippedSkin() {
    const p = this.pm.profile;
    return p.equippedSkin || 'default';
  }

  getEquippedSkinData() {
    const id = this.getEquippedSkin();
    return SKIN_CATALOG.find(s => s.id === id) || SKIN_CATALOG[0];
  }

  ownsSkin(skinId) {
    return this.getOwnedSkins().includes(skinId);
  }

  equipSkin(skinId) {
    if (!this.ownsSkin(skinId)) return false;
    this.pm.profile.equippedSkin = skinId;
    this.pm._save();
    return true;
  }

  // ── Purchase ──
  buySkin(skinId) {
    const skin = SKIN_CATALOG.find(s => s.id === skinId);
    if (!skin) return { ok: false, msg: 'Skin introuvable' };
    if (this.ownsSkin(skinId)) return { ok: false, msg: 'Deja possede' };
    const p = this.pm.profile;
    if ((p.credits || 0) < skin.price) return { ok: false, msg: 'Credits insuffisants' };
    p.credits -= skin.price;
    if (!p.ownedSkins) p.ownedSkins = ['default'];
    p.ownedSkins.push(skinId);
    this.pm._save();
    return { ok: true, skin };
  }

  // ── Spin / Gacha ──
  spin(tierId) {
    const tier = SPIN_TIERS.find(t => t.id === tierId);
    if (!tier) return { ok: false, msg: 'Tier invalide' };
    const p = this.pm.profile;
    if ((p.credits || 0) < tier.price) return { ok: false, msg: 'Credits insuffisants' };

    p.credits -= tier.price;

    // Build weighted pool
    const minRarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unobtainable'];
    const minIdx = minRarityOrder.indexOf(tier.guaranteedMinRarity);

    // Collect eligible skins
    const pool = [];
    for (const skin of SKIN_CATALOG) {
      const rarIdx = minRarityOrder.indexOf(skin.rarity.key);
      if (rarIdx >= minIdx) {
        pool.push({ skin, weight: skin.rarity.chance });
      }
    }

    // Weighted random pick
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let picked = pool[0].skin;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) { picked = entry.skin; break; }
    }

    // Award skin (or give credit refund if duplicate)
    const isDupe = this.ownsSkin(picked.id);
    if (!isDupe) {
      if (!p.ownedSkins) p.ownedSkins = ['default'];
      p.ownedSkins.push(picked.id);
    } else {
      // Duplicate → partial credit refund based on rarity
      const refunds = { common: 15, uncommon: 30, rare: 60, epic: 120, legendary: 300, mythic: 600, unobtainable: 1500 };
      p.credits += refunds[picked.rarity.key] || 15;
    }

    this.pm._save();
    return { ok: true, skin: picked, isDupe };
  }

  // ── Catalog queries ──
  getCatalog() { return SKIN_CATALOG; }

  getCatalogByRarity(rarityKey) {
    return SKIN_CATALOG.filter(s => s.rarity.key === rarityKey);
  }

  getSkinById(id) {
    return SKIN_CATALOG.find(s => s.id === id);
  }

  getSpinTiers() { return SPIN_TIERS; }
}
