// ═══════════════════════════════════════════════════
// SHOP MANAGER — Cosmetics shop & inventory
// ═══════════════════════════════════════════════════

const SHOP_ITEMS = {
  // ── LASER COLORS ──
  laser_cyan:    { name: 'Cyan Laser',    slot: 'laserColor', color: 0x00ffff, css: '#00ffff', price: 0,    category: 'laser' },
  laser_red:     { name: 'Red Laser',     slot: 'laserColor', color: 0xff3333, css: '#ff3333', price: 200,  category: 'laser' },
  laser_green:   { name: 'Green Laser',   slot: 'laserColor', color: 0x33ff66, css: '#33ff66', price: 200,  category: 'laser' },
  laser_purple:  { name: 'Purple Laser',  slot: 'laserColor', color: 0xcc44ff, css: '#cc44ff', price: 300,  category: 'laser' },
  laser_gold:    { name: 'Gold Laser',    slot: 'laserColor', color: 0xffcc00, css: '#ffcc00', price: 400,  category: 'laser' },
  laser_pink:    { name: 'Pink Laser',    slot: 'laserColor', color: 0xff66cc, css: '#ff66cc', price: 300,  category: 'laser' },
  laser_white:   { name: 'White Laser',   slot: 'laserColor', color: 0xffffff, css: '#ffffff', price: 500,  category: 'laser' },

  // ── CROSSHAIR STYLES ──
  crosshair_default: { name: 'Standard',   slot: 'crosshairStyle', style: 'default', price: 0,    category: 'crosshair' },
  crosshair_dot:     { name: 'Dot Only',    slot: 'crosshairStyle', style: 'dot',     price: 150,  category: 'crosshair' },
  crosshair_circle:  { name: 'Circle',      slot: 'crosshairStyle', style: 'circle',  price: 250,  category: 'crosshair' },
  crosshair_cross:   { name: 'Cross Thin',  slot: 'crosshairStyle', style: 'cross',   price: 200,  category: 'crosshair' },

  // ── CROSSHAIR COLORS ──
  crosshair_color_green:  { name: 'Green',   slot: 'crosshairColor', css: '#00ffcc', price: 0,    category: 'chColor' },
  crosshair_color_red:    { name: 'Red',      slot: 'crosshairColor', css: '#ff4444', price: 100,  category: 'chColor' },
  crosshair_color_yellow: { name: 'Yellow',   slot: 'crosshairColor', css: '#ffff00', price: 100,  category: 'chColor' },
  crosshair_color_white:  { name: 'White',    slot: 'crosshairColor', css: '#ffffff', price: 150,  category: 'chColor' },
  crosshair_color_pink:   { name: 'Pink',     slot: 'crosshairColor', css: '#ff66cc', price: 150,  category: 'chColor' },

  // ── IMPACT EFFECTS ──
  impact_default:  { name: 'Standard',    slot: 'impactEffect', effect: 'default',  price: 0,    category: 'impact' },
  impact_sparks:   { name: 'Sparks',      slot: 'impactEffect', effect: 'sparks',   price: 350,  category: 'impact' },
  impact_ring:     { name: 'Neon Ring',    slot: 'impactEffect', effect: 'ring',     price: 400,  category: 'impact' },
  impact_burst:    { name: 'Burst',        slot: 'impactEffect', effect: 'burst',    price: 500,  category: 'impact' },
};

const CATEGORIES = [
  { id: 'laser',     name: 'LASER COLOR',     slot: 'laserColor' },
  { id: 'crosshair', name: 'CROSSHAIR STYLE', slot: 'crosshairStyle' },
  { id: 'chColor',   name: 'CROSSHAIR COLOR', slot: 'crosshairColor' },
  { id: 'impact',    name: 'IMPACT EFFECT',   slot: 'impactEffect' },
];

export class ShopManager {
  constructor(profileManager) {
    this.profile = profileManager;
    this.ITEMS = SHOP_ITEMS;
    this.CATEGORIES = CATEGORIES;
  }

  getItemsByCategory(categoryId) {
    return Object.entries(SHOP_ITEMS)
      .filter(([, item]) => item.category === categoryId)
      .map(([id, item]) => ({
        id,
        ...item,
        owned: this.profile.ownsCosmetic(id),
        equipped: this._isEquipped(id, item.slot),
      }));
  }

  _isEquipped(id, slot) {
    return this.profile.cosmetics.equipped[slot] === id;
  }

  buyItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return { success: false, error: 'Item not found' };
    if (this.profile.ownsCosmetic(itemId)) return { success: false, error: 'Already owned' };
    if (!this.profile.spendCredits(item.price)) return { success: false, error: 'Not enough credits' };

    this.profile.ownCosmetic(itemId);
    return { success: true };
  }

  equipItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return false;
    if (!this.profile.ownsCosmetic(itemId)) return false;
    this.profile.equipCosmetic(item.slot, itemId);
    return true;
  }

  getEquipped() {
    const eq = this.profile.cosmetics.equipped;
    const result = {};
    for (const [slot, itemId] of Object.entries(eq)) {
      if (itemId && SHOP_ITEMS[itemId]) {
        result[slot] = { id: itemId, ...SHOP_ITEMS[itemId] };
      }
    }
    return result;
  }

  getLaserColor() {
    const eq = this.profile.cosmetics.equipped.laserColor;
    return SHOP_ITEMS[eq]?.color || 0x00ffff;
  }

  getCrosshairColor() {
    const eq = this.profile.cosmetics.equipped.crosshairColor;
    return SHOP_ITEMS[eq]?.css || '#00ffcc';
  }

  getCrosshairStyle() {
    const eq = this.profile.cosmetics.equipped.crosshairStyle;
    return SHOP_ITEMS[eq]?.style || 'default';
  }
}
