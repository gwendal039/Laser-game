// ═══════════════════════════════════════════════════
// BODY COSMETIC MANAGER — Krunker-style body cosmetics
// Equipment slots: hat, face, body, back, waist, shoes
// ═══════════════════════════════════════════════════

import { RARITY } from './WeaponSkinManager.js';

export const COSMETIC_SLOTS = [
  { id: 'hat',   label: 'Casque',     icon: '🪖' },
  { id: 'face',  label: 'Visiere',    icon: '🥽' },
  { id: 'body',  label: 'Armure',     icon: '🦺' },
  { id: 'back',  label: 'Dos',        icon: '🎒' },
  { id: 'waist', label: 'Ceinture',   icon: '⚡' },
  { id: 'shoes', label: 'Bottes',     icon: '👢' },
  { id: 'glow',  label: 'Aura',       icon: '✨' },
  { id: 'dye',   label: 'Teinture',   icon: '🎨' },
];

// ── Cosmetic catalog ──
// Each item: { id, name, slot, rarity, price, desc, visual }
// visual contains CSS properties used for preview & 3D rendering
export const COSMETIC_CATALOG = [

  // ═══════ CASQUE (HAT) ═══════
  { id: 'hat_bandana',      name: 'Bandana',         slot: 'hat', rarity: RARITY.COMMON,    price: 40,   desc: 'Bandeau de combattant',         visual: { color: '#cc3333', shape: 'band' } },
  { id: 'hat_cap',          name: 'Casquette',       slot: 'hat', rarity: RARITY.COMMON,    price: 50,   desc: 'Casquette tactique',            visual: { color: '#3a3a52', shape: 'cap' } },
  { id: 'hat_beret',        name: 'Beret',           slot: 'hat', rarity: RARITY.COMMON,    price: 50,   desc: 'Beret militaire',               visual: { color: '#2a4a2a', shape: 'beret' } },
  { id: 'hat_helmet',       name: 'Casque Tactique', slot: 'hat', rarity: RARITY.UNCOMMON,  price: 120,  desc: 'Casque avec visiere integree',  visual: { color: '#4a4a55', shape: 'helmet', accent: '#00ffcc' } },
  { id: 'hat_crown',        name: 'Couronne',        slot: 'hat', rarity: RARITY.RARE,      price: 280,  desc: 'Couronne royale doree',         visual: { color: '#ffcc00', shape: 'crown' } },
  { id: 'hat_cyber',        name: 'Cyber Helmet',    slot: 'hat', rarity: RARITY.EPIC,      price: 500,  desc: 'Casque cyberpunk lumineux',     visual: { color: '#1a1a2a', shape: 'helmet', accent: '#ff00ff' } },
  { id: 'hat_halo',         name: 'Halo',            slot: 'hat', rarity: RARITY.LEGENDARY, price: 1200, desc: 'Aureole divine lumineuse',      visual: { color: '#ffdd44', shape: 'halo', glow: true } },
  { id: 'hat_glitch',       name: 'Glitch Crown',    slot: 'hat', rarity: RARITY.MYTHIC,    price: 3000, desc: 'Couronne numerique instable',   visual: { color: '#00ffcc', shape: 'crown', glow: true, animated: true } },

  // ═══════ VISIERE (FACE) ═══════
  { id: 'face_mask',        name: 'Masque Noir',     slot: 'face', rarity: RARITY.COMMON,    price: 40,   desc: 'Masque de ninja',               visual: { color: '#1a1a1a', shape: 'mask' } },
  { id: 'face_visor',       name: 'Visiere LED',     slot: 'face', rarity: RARITY.UNCOMMON,  price: 130,  desc: 'Visiere a affichage LED',       visual: { color: '#00aaff', shape: 'visor' } },
  { id: 'face_skull',       name: 'Masque Crane',    slot: 'face', rarity: RARITY.RARE,      price: 260,  desc: 'Masque tete de mort',           visual: { color: '#ffffff', shape: 'skull' } },
  { id: 'face_neon',        name: 'Neon Visor',      slot: 'face', rarity: RARITY.EPIC,      price: 480,  desc: 'Visiere neon pulsante',         visual: { color: '#ff00ff', shape: 'visor', glow: true } },
  { id: 'face_void',        name: 'Void Mask',       slot: 'face', rarity: RARITY.LEGENDARY, price: 1100, desc: 'Masque du vide absolu',         visual: { color: '#8800ff', shape: 'mask', glow: true } },

  // ═══════ ARMURE (BODY) ═══════
  { id: 'body_vest',        name: 'Gilet Tactique',  slot: 'body', rarity: RARITY.COMMON,    price: 60,   desc: 'Gilet pare-balles standard',    visual: { color: '#3a4a3a', shape: 'vest' } },
  { id: 'body_jacket',      name: 'Veste Combat',    slot: 'body', rarity: RARITY.COMMON,    price: 50,   desc: 'Veste de combat classique',     visual: { color: '#4a4a52', shape: 'jacket' } },
  { id: 'body_plate',       name: 'Plastron',        slot: 'body', rarity: RARITY.UNCOMMON,  price: 140,  desc: 'Armure de poitrine renforcee',  visual: { color: '#5a5a65', shape: 'plate', accent: '#00ccff' } },
  { id: 'body_neon',        name: 'Armure Neon',     slot: 'body', rarity: RARITY.RARE,      price: 300,  desc: 'Armure a bandes neon',          visual: { color: '#1a1a2a', shape: 'plate', accent: '#00ff88' } },
  { id: 'body_dragon',      name: 'Armure Dragon',   slot: 'body', rarity: RARITY.EPIC,      price: 550,  desc: 'Ecailles de dragon forgees',    visual: { color: '#661100', shape: 'plate', accent: '#ff4400' } },
  { id: 'body_crystal',     name: 'Armure Cristal',  slot: 'body', rarity: RARITY.LEGENDARY, price: 1300, desc: 'Cristaux d\'energie pure',      visual: { color: '#aaccff', shape: 'plate', accent: '#ffffff', glow: true } },

  // ═══════ DOS (BACK) ═══════
  { id: 'back_pack',        name: 'Sac Tactique',    slot: 'back', rarity: RARITY.COMMON,    price: 50,   desc: 'Sac a dos militaire',           visual: { color: '#3a4a3a', shape: 'pack' } },
  { id: 'back_cape',        name: 'Cape Courte',     slot: 'back', rarity: RARITY.UNCOMMON,  price: 120,  desc: 'Cape de combat',                visual: { color: '#2a2a44', shape: 'cape' } },
  { id: 'back_jetpack',     name: 'Jetpack',         slot: 'back', rarity: RARITY.RARE,      price: 280,  desc: 'Reacteur dorsal',               visual: { color: '#4a4a55', shape: 'jetpack', accent: '#ff4400' } },
  { id: 'back_wings',       name: 'Ailes Neon',      slot: 'back', rarity: RARITY.EPIC,      price: 520,  desc: 'Ailes d\'energie lumineuse',    visual: { color: '#00ffcc', shape: 'wings', glow: true } },
  { id: 'back_phoenix',     name: 'Ailes Phoenix',   slot: 'back', rarity: RARITY.LEGENDARY, price: 1400, desc: 'Ailes de feu du phoenix',       visual: { color: '#ff6600', shape: 'wings', glow: true } },
  { id: 'back_void',        name: 'Portail Void',    slot: 'back', rarity: RARITY.MYTHIC,    price: 3200, desc: 'Portail dimensionnel vivant',   visual: { color: '#8800ff', shape: 'portal', glow: true, animated: true } },

  // ═══════ CEINTURE (WAIST) ═══════
  { id: 'waist_belt',       name: 'Ceinture Utility', slot: 'waist', rarity: RARITY.COMMON,   price: 40,   desc: 'Ceinture utilitaire',           visual: { color: '#4a3a2a', shape: 'belt' } },
  { id: 'waist_ammo',       name: 'Cartouchiere',    slot: 'waist', rarity: RARITY.UNCOMMON,  price: 110,  desc: 'Ceinture de munitions',         visual: { color: '#5a5a3a', shape: 'ammo' } },
  { id: 'waist_holster',    name: 'Holster Laser',   slot: 'waist', rarity: RARITY.RARE,      price: 250,  desc: 'Holster a laser secondaire',    visual: { color: '#3a3a52', shape: 'holster', accent: '#00ffcc' } },
  { id: 'waist_energy',     name: 'Ceinture Plasma', slot: 'waist', rarity: RARITY.EPIC,      price: 500,  desc: 'Generateur d\'energie plasma',  visual: { color: '#1a1a2a', shape: 'energy', accent: '#44ddff', glow: true } },

  // ═══════ BOTTES (SHOES) ═══════
  { id: 'shoes_boots',      name: 'Bottes Combat',   slot: 'shoes', rarity: RARITY.COMMON,    price: 50,   desc: 'Bottes militaires standard',    visual: { color: '#3a3a2a', shape: 'boots' } },
  { id: 'shoes_speed',      name: 'Runners',         slot: 'shoes', rarity: RARITY.UNCOMMON,  price: 130,  desc: 'Chaussures legeres rapides',    visual: { color: '#2a2a3a', shape: 'runners', accent: '#00ff88' } },
  { id: 'shoes_hover',      name: 'Hover Boots',     slot: 'shoes', rarity: RARITY.RARE,      price: 270,  desc: 'Bottes anti-gravite',           visual: { color: '#3a3a52', shape: 'hover', accent: '#00ccff', glow: true } },
  { id: 'shoes_flame',      name: 'Flame Walkers',   slot: 'shoes', rarity: RARITY.EPIC,      price: 520,  desc: 'Laissent des traces de feu',    visual: { color: '#4a2a1a', shape: 'boots', accent: '#ff4400', glow: true } },
  { id: 'shoes_quantum',    name: 'Quantum Steps',   slot: 'shoes', rarity: RARITY.LEGENDARY, price: 1200, desc: 'Deforment l\'espace-temps',     visual: { color: '#1a1a2a', shape: 'hover', accent: '#aa00ff', glow: true } },

  // ═══════ AURA (GLOW) ═══════
  { id: 'glow_green',       name: 'Aura Toxique',    slot: 'glow', rarity: RARITY.UNCOMMON,  price: 150,  desc: 'Halo vert radioactif',          visual: { color: '#00ff44', opacity: 0.3 } },
  { id: 'glow_blue',        name: 'Aura Glace',      slot: 'glow', rarity: RARITY.UNCOMMON,  price: 150,  desc: 'Aura de givre',                 visual: { color: '#44ccff', opacity: 0.3 } },
  { id: 'glow_fire',        name: 'Aura Flamme',     slot: 'glow', rarity: RARITY.RARE,      price: 300,  desc: 'Halo de feu ardent',            visual: { color: '#ff4400', opacity: 0.4 } },
  { id: 'glow_purple',      name: 'Aura Void',       slot: 'glow', rarity: RARITY.EPIC,      price: 550,  desc: 'Energie du vide',               visual: { color: '#aa00ff', opacity: 0.4 } },
  { id: 'glow_rainbow',     name: 'Aura Prisme',     slot: 'glow', rarity: RARITY.LEGENDARY, price: 1500, desc: 'Spectre chromatique vivant',    visual: { color: '#ffffff', opacity: 0.5, animated: true } },
  { id: 'glow_dark',        name: 'Aura Singularity', slot: 'glow', rarity: RARITY.MYTHIC,   price: 3500, desc: 'Trou noir miniature',           visual: { color: '#000000', opacity: 0.6, animated: true } },

  // ═══════ TEINTURE (DYE) — changes body color ═══════
  { id: 'dye_red',          name: 'Rouge Sang',      slot: 'dye', rarity: RARITY.COMMON,    price: 30,   desc: 'Teinture rouge intense',        visual: { color: '#cc2222' } },
  { id: 'dye_blue',         name: 'Bleu Electrique', slot: 'dye', rarity: RARITY.COMMON,    price: 30,   desc: 'Teinture bleu vif',             visual: { color: '#2244cc' } },
  { id: 'dye_green',        name: 'Vert Toxique',    slot: 'dye', rarity: RARITY.COMMON,    price: 30,   desc: 'Teinture verte acide',          visual: { color: '#22aa22' } },
  { id: 'dye_purple',       name: 'Violet Royal',    slot: 'dye', rarity: RARITY.COMMON,    price: 30,   desc: 'Teinture violette royale',      visual: { color: '#7722cc' } },
  { id: 'dye_orange',       name: 'Orange Fusion',   slot: 'dye', rarity: RARITY.COMMON,    price: 30,   desc: 'Teinture orange vive',          visual: { color: '#cc6600' } },
  { id: 'dye_pink',         name: 'Rose Neon',       slot: 'dye', rarity: RARITY.UNCOMMON,  price: 80,   desc: 'Teinture rose fluorescente',    visual: { color: '#ff44aa' } },
  { id: 'dye_gold',         name: 'Or Imperial',     slot: 'dye', rarity: RARITY.RARE,      price: 250,  desc: 'Teinture or brillant',          visual: { color: '#ddaa22' } },
  { id: 'dye_chrome',       name: 'Chrome',          slot: 'dye', rarity: RARITY.EPIC,      price: 500,  desc: 'Reflet chrome metallique',      visual: { color: '#ccccdd' } },
  { id: 'dye_shadow',       name: 'Ombre Absolue',   slot: 'dye', rarity: RARITY.LEGENDARY, price: 1000, desc: 'Noir absolu sans reflet',       visual: { color: '#0a0a10' } },
  { id: 'dye_prism',        name: 'Prismatique',     slot: 'dye', rarity: RARITY.MYTHIC,    price: 3000, desc: 'Couleurs changeantes perpetuelles', visual: { color: '#ffffff', animated: true } },
];

export class BodyCosmeticManager {
  constructor(profileManager) {
    this.pm = profileManager;
  }

  // ── Owned cosmetics ──
  getOwned() {
    const p = this.pm.profile;
    if (!p.ownedCosmetics) p.ownedCosmetics = [];
    return p.ownedCosmetics;
  }

  // ── Equipped cosmetics per slot ──
  getEquipped() {
    const p = this.pm.profile;
    if (!p.equippedCosmetics) p.equippedCosmetics = {};
    return p.equippedCosmetics;
  }

  getEquippedForSlot(slotId) {
    return this.getEquipped()[slotId] || null;
  }

  getEquippedItemForSlot(slotId) {
    const id = this.getEquippedForSlot(slotId);
    if (!id) return null;
    return COSMETIC_CATALOG.find(c => c.id === id) || null;
  }

  ownsCosmetic(cosmeticId) {
    return this.getOwned().includes(cosmeticId);
  }

  equipCosmetic(cosmeticId) {
    const item = COSMETIC_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return false;
    if (!this.ownsCosmetic(cosmeticId)) return false;
    const p = this.pm.profile;
    if (!p.equippedCosmetics) p.equippedCosmetics = {};
    p.equippedCosmetics[item.slot] = cosmeticId;
    this.pm._save();
    return true;
  }

  unequipSlot(slotId) {
    const p = this.pm.profile;
    if (!p.equippedCosmetics) return;
    delete p.equippedCosmetics[slotId];
    this.pm._save();
  }

  buyCosmetic(cosmeticId) {
    const item = COSMETIC_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return { ok: false, msg: 'Item introuvable' };
    if (this.ownsCosmetic(cosmeticId)) return { ok: false, msg: 'Deja possede' };
    const p = this.pm.profile;
    if ((p.credits || 0) < item.price) return { ok: false, msg: 'Credits insuffisants' };
    p.credits -= item.price;
    if (!p.ownedCosmetics) p.ownedCosmetics = [];
    p.ownedCosmetics.push(cosmeticId);
    this.pm._save();
    return { ok: true, item };
  }

  // ── Catalog queries ──
  getCatalog() { return COSMETIC_CATALOG; }
  getSlots() { return COSMETIC_SLOTS; }

  getItemsForSlot(slotId) {
    return COSMETIC_CATALOG.filter(c => c.slot === slotId);
  }

  getItemById(id) {
    return COSMETIC_CATALOG.find(c => c.id === id);
  }
}
