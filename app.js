const {
  useState,
  useEffect,
  useRef
} = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const roll20 = () => Math.floor(Math.random() * 20) + 1;
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Ordered by hue around the color wheel (Brown grouped with Orange as its
// dark/desaturated cousin; Black and White are the achromatic outliers at
// the end, dark to light).
const ENEMY_COLORS = [{
  name: "Red",
  hex: "#ef4444"
}, {
  name: "Orange",
  hex: "#f97316"
}, {
  name: "Brown",
  hex: "#92400e"
}, {
  name: "Yellow",
  hex: "#eab308"
}, {
  name: "Light Green",
  hex: "#a3e635"
}, {
  name: "Green",
  hex: "#22c55e"
}, {
  name: "Light Blue",
  hex: "#7dd3fc"
}, {
  name: "Blue",
  hex: "#3b82f6"
}, {
  name: "Purple",
  hex: "#a855f7"
}, {
  name: "Black",
  hex: "#3f3f46"
}, {
  name: "White",
  hex: "#f8fafc"
}];
const NPC_COLOR = "#a1a1aa";

// 2014 DMG-style CR -> XP table (verified against DMG p.275), used only for
// the rough difficulty estimate. Keyed by numeric CR value so both "1/8"
// and "0.125" style entry resolve to the same lookup.
const CR_XP = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000
};
function parseCR(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.includes("/")) {
    const [n, d] = s.split("/").map(Number);
    if (!d || isNaN(n)) return null;
    return n / d;
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}
function crToXP(raw) {
  const v = parseCR(raw);
  return v !== null && CR_XP[v] !== undefined ? CR_XP[v] : null;
}

// Per-character XP thresholds by level: [Easy, Medium, Hard, Deadly].
const XP_THRESHOLDS = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700]
};
const MULTIPLIER_ROWS = [1, 1.5, 2, 2.5, 3, 4];
function multiplierRowIndex(monsterCount) {
  if (monsterCount <= 1) return 0;
  if (monsterCount === 2) return 1;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 3;
  if (monsterCount <= 14) return 4;
  return 5;
}
function computeDifficulty(enemies, partyLevel, partyCount) {
  const withCr = enemies.filter(e => crToXP(e.cr) !== null);
  if (withCr.length === 0 || !partyLevel || partyCount <= 0) return null;
  const rawXP = withCr.reduce((sum, e) => sum + crToXP(e.cr), 0);
  let idx = multiplierRowIndex(enemies.length);
  if (partyCount <= 2) idx = Math.min(idx + 1, MULTIPLIER_ROWS.length - 1);
  if (partyCount >= 6) idx = Math.max(idx - 1, 0);
  const multiplier = MULTIPLIER_ROWS[idx];
  const adjustedXP = Math.round(rawXP * multiplier);
  const perChar = XP_THRESHOLDS[clamp(partyLevel, 1, 20)];
  const [easy, medium, hard, deadly] = perChar.map(n => n * partyCount);
  let band = "Trivial";
  if (adjustedXP >= deadly) band = "Deadly";else if (adjustedXP >= hard) band = "Hard";else if (adjustedXP >= medium) band = "Medium";else if (adjustedXP >= easy) band = "Easy";
  return {
    band,
    adjustedXP,
    rawXP,
    multiplier,
    easy,
    medium,
    hard,
    deadly,
    missingCr: enemies.length - withCr.length
  };
}
const STATE_KEY = "dndTracker.state.v3";
const ENCOUNTERS_KEY = "dndTracker.encounters.v3";
const PARTIES_KEY = "dndTracker.parties.v3";
const ENEMY_TEMPLATES_KEY = "dndTracker.enemyTemplates.v1";
const NPC_TEMPLATES_KEY = "dndTracker.npcTemplates.v1";
function makeDefaultAdvanced() {
  return {
    ac: "",
    size: "",
    speed: "",
    abilities: {
      str: "",
      dex: "",
      con: "",
      int: "",
      wis: "",
      cha: ""
    },
    skills: "",
    senses: "",
    immunities: "",
    resistances: "",
    vulnerabilities: "",
    traits: [{
      name: "",
      desc: ""
    }],
    actions: [{
      name: "",
      desc: ""
    }]
  };
}
function hasAdvancedInfo(adv) {
  if (!adv) return false;
  if (adv.ac || adv.size || adv.speed) return true;
  if (adv.abilities && Object.values(adv.abilities).some(v => v)) return true;
  if (adv.skills || adv.senses || adv.immunities || adv.resistances || adv.vulnerabilities) return true;
  if (adv.traits && adv.traits.some(t => t.name || t.desc)) return true;
  if (adv.actions && adv.actions.some(a => a.name || a.desc)) return true;
  return false;
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}
function initVal(c) {
  return c.initiative === null || c.initiative === undefined ? -Infinity : c.initiative;
}
function sortByInitiative(list) {
  return [...list].sort((a, b) => initVal(b) - initVal(a));
}
const TYPE_ORDER = {
  player: 0,
  npc: 1,
  enemy: 2,
  marker: 3
};
function setupSort(list) {
  return [...list].sort((a, b) => {
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    return a.name.localeCompare(b.name);
  });
}
function insertSorted(list, newC) {
  const arr = [...list];
  let idx = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (initVal(newC) > initVal(arr[i])) {
      idx = i;
      break;
    }
  }
  arr.splice(idx, 0, newC);
  return arr;
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strips a leading color-swatch name (e.g. "Red Skeleton" -> "Skeleton",
// bare "Red" -> ""). Used both when re-picking a color and when deriving a
// duplicate's base name.
function stripLeadingColor(name) {
  const sorted = [...ENEMY_COLORS].sort((a, b) => b.name.length - a.name.length);
  for (const col of sorted) {
    if (name === col.name) return "";
    if (name.startsWith(col.name + " ")) return name.slice(col.name.length + 1);
  }
  return name;
}

// Turns a stored enemy name like "Red Skeleton" or "Skeleton 1" into just
// "Skeleton" for the Duplicate button. Leaves fully custom names untouched.
function deriveDuplicateBaseName(name) {
  let result = stripLeadingColor(name.trim());
  const m = result.match(/^(.*)\s\d+$/);
  if (m) result = m[1];
  return result;
}

// Finds the highest "<name> N" suffix already in use among existingNames,
// so a repeated batch continues counting instead of restarting at 1.
function nextStartNumber(existingNames, baseName) {
  let max = 0;
  const re = new RegExp(`^${escapeRegExp(baseName)} (\\d+)$`);
  existingNames.forEach(n => {
    const m = n.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max;
}
function StatusPill({
  status
}) {
  const map = {
    active: null,
    unconscious: {
      text: "Down",
      cls: "bg-amber-900/40 text-amber-300 border-amber-700"
    },
    stable: {
      text: "Stable",
      cls: "bg-sky-900/40 text-sky-300 border-sky-700"
    },
    dead: {
      text: "Dead",
      cls: "bg-neutral-800 text-neutral-400 border-neutral-600"
    }
  };
  const s = map[status];
  if (!s) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-0.5 rounded-full border ${s.cls} font-medium tracking-wide`
  }, s.text);
}
function DeathSaves({
  combatant,
  onUpdate
}) {
  const {
    deathSaves
  } = combatant;
  const toggle = (kind, idx) => {
    const current = deathSaves[kind];
    const next = idx < current ? idx : idx + 1;
    const updated = {
      ...deathSaves,
      [kind]: clamp(next, 0, 3)
    };
    let status = "unconscious";
    if (updated.success >= 3) status = "stable";else if (updated.fail >= 3) status = "dead";
    onUpdate({
      deathSaves: updated,
      status
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 mt-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-400 font-medium"
  }, "Success"), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => toggle("success", i),
    className: `w-3.5 h-3.5 rounded-full border-2 transition-colors ${i < deathSaves.success ? "bg-emerald-400 border-emerald-400" : "border-emerald-700"}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-rose-400 font-medium"
  }, "Fail"), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => toggle("fail", i),
    className: `w-3.5 h-3.5 rounded-full border-2 transition-colors ${i < deathSaves.fail ? "bg-rose-400 border-rose-400" : "border-rose-700"}`
  }))));
}
function ConditionRow({
  c,
  onAdd,
  onRemove,
  onToggleConcentration
}) {
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const submit = (val, setVal) => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-1.5 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggleConcentration,
    className: `flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium transition-colors ${c.concentration ? "bg-yellow-500/20 text-yellow-300 border-yellow-500" : "bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500"}`
  }, "✨ Concentration"), c.conditions.map(tag => /*#__PURE__*/React.createElement("span", {
    key: tag,
    className: "flex items-center gap-1 text-xs bg-violet-900/40 text-violet-300 border border-violet-700 rounded-full px-2 py-0.5"
  }, tag, /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemove(tag),
    className: "hover:text-white"
  }, "✕"))), /*#__PURE__*/React.createElement("input", {
    value: value1,
    onChange: e => setValue1(e.target.value),
    onKeyDown: e => e.key === "Enter" && submit(value1, setValue1),
    placeholder: "+ condition",
    className: "text-xs bg-transparent border border-dashed border-neutral-700 rounded-full px-2 py-0.5 w-24 focus:w-32 transition-all outline-none focus:border-neutral-500 text-neutral-300 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: value2,
    onChange: e => setValue2(e.target.value),
    onKeyDown: e => e.key === "Enter" && submit(value2, setValue2),
    placeholder: "+ condition",
    className: "text-xs bg-transparent border border-dashed border-neutral-700 rounded-full px-2 py-0.5 w-24 focus:w-32 transition-all outline-none focus:border-neutral-500 text-neutral-300 placeholder:text-neutral-600"
  }));
}
function InitiativeEditor({
  value,
  onChange
}) {
  const display = value === null || value === undefined ? "" : value;
  const handleTyped = raw => {
    if (raw === "") {
      onChange(null);
      return;
    }
    const v = parseFloat(raw);
    onChange(isNaN(v) ? 0 : v);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange((value ?? 0) - 1),
    className: "w-4 h-4 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs"
  }, "−"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: display,
    placeholder: "—",
    onChange: e => handleTyped(e.target.value),
    className: "w-11 text-sm font-mono font-bold text-center bg-transparent text-neutral-200 outline-none border-b border-transparent focus:border-neutral-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange((value ?? 0) + 1),
    className: "w-4 h-4 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs"
  }, "+"));
}
const TYPE_STYLE = {
  player: {
    icon: "🛡️",
    border: "border-sky-800/60",
    bg: "bg-sky-950/10",
    iconBg: "bg-sky-900/40 border-sky-700 text-sky-300"
  },
  npc: {
    icon: "🎭",
    border: "border-stone-600/60",
    bg: "bg-stone-800/10",
    iconBg: "bg-stone-700/40 border-stone-500 text-stone-300"
  },
  enemy: {
    icon: "⚔️",
    border: "border-rose-900/60",
    bg: "bg-rose-950/10",
    iconBg: "bg-rose-900/40 border-rose-700 text-rose-300"
  },
  marker: {
    icon: "🚩",
    border: "border-indigo-800/60",
    bg: "bg-indigo-950/10",
    iconBg: "bg-indigo-900/40 border-indigo-700 text-indigo-300"
  }
};
function AdvancedFieldsEditor({
  value,
  onChange,
  accent
}) {
  const [open, setOpen] = useState(false);
  const update = patch => onChange({
    ...value,
    ...patch
  });
  const updateAbility = (key, val) => onChange({
    ...value,
    abilities: {
      ...value.abilities,
      [key]: val
    }
  });
  const updateListItem = (field, idx, key, val) => {
    const list = value[field].map((item, i) => i === idx ? {
      ...item,
      [key]: val
    } : item);
    onChange({
      ...value,
      [field]: list
    });
  };
  const addListItem = field => onChange({
    ...value,
    [field]: [...value[field], {
      name: "",
      desc: ""
    }]
  });
  const removeListItem = (field, idx) => onChange({
    ...value,
    [field]: value[field].filter((_, i) => i !== idx)
  });
  const inputCls = "text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none placeholder:text-neutral-600";
  return /*#__PURE__*/React.createElement("div", {
    className: "border-t border-neutral-800 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(v => !v),
    className: `w-full flex items-center justify-between text-xs font-semibold ${accent}`
  }, /*#__PURE__*/React.createElement("span", null, "⚙️ Advanced"), /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${open ? "rotate-180" : ""}`
  }, "▾")), open && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "AC",
    value: value.ac,
    onChange: e => update({
      ac: e.target.value
    }),
    inputMode: "numeric",
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Size",
    value: value.size,
    onChange: e => update({
      size: e.target.value
    }),
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Speed",
    value: value.speed,
    onChange: e => update({
      speed: e.target.value
    }),
    inputMode: "numeric",
    className: `w-1/3 ${inputCls}`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Ability score modifiers"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-1"
  }, ["str", "dex", "con", "int", "wis", "cha"].map(k => /*#__PURE__*/React.createElement("input", {
    key: k,
    placeholder: k.toUpperCase(),
    value: value.abilities[k],
    onChange: e => updateAbility(k, e.target.value),
    inputMode: "numeric",
    className: `text-center px-1 ${inputCls}`
  })))), /*#__PURE__*/React.createElement("input", {
    placeholder: "Skills (e.g. Perception +3)",
    value: value.skills,
    onChange: e => update({
      skills: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Senses (e.g. passive Perception 13)",
    value: value.senses,
    onChange: e => update({
      senses: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Immunities",
    value: value.immunities,
    onChange: e => update({
      immunities: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Resistances",
    value: value.resistances,
    onChange: e => update({
      resistances: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Vulnerabilities",
    value: value.vulnerabilities,
    onChange: e => update({
      vulnerabilities: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Traits"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, value.traits.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Name",
    value: t.name,
    onChange: e => updateListItem("traits", i, "name", e.target.value),
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Description",
    value: t.desc,
    onChange: e => updateListItem("traits", i, "desc", e.target.value),
    className: `flex-1 ${inputCls}`
  }), value.traits.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => removeListItem("traits", i),
    className: "text-neutral-600 hover:text-rose-300 px-1"
  }, "✕")))), /*#__PURE__*/React.createElement("button", {
    onClick: () => addListItem("traits"),
    className: "text-xs text-neutral-400 hover:text-neutral-200 mt-1"
  }, "+ Add Trait")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Actions"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, value.actions.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Name",
    value: a.name,
    onChange: e => updateListItem("actions", i, "name", e.target.value),
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Description",
    value: a.desc,
    onChange: e => updateListItem("actions", i, "desc", e.target.value),
    className: `flex-1 ${inputCls}`
  }), value.actions.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => removeListItem("actions", i),
    className: "text-neutral-600 hover:text-rose-300 px-1"
  }, "✕")))), /*#__PURE__*/React.createElement("button", {
    onClick: () => addListItem("actions"),
    className: "text-xs text-neutral-400 hover:text-neutral-200 mt-1"
  }, "+ Add Action"))));
}
function StatBlockPanel({
  advanced: a
}) {
  const abilityRow = Object.values(a.abilities).some(v => v);
  const infoLines = [["Armor Class", a.ac], ["Size", a.size], ["Speed", a.speed], ["Skills", a.skills], ["Senses", a.senses], ["Immunities", a.immunities], ["Resistances", a.resistances], ["Vulnerabilities", a.vulnerabilities]].filter(([, v]) => v);
  const traits = a.traits.filter(t => t.name || t.desc);
  const actions = a.actions.filter(t => t.name || t.desc);
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-2 rounded-lg border border-amber-900/40 bg-amber-950/10 p-3 font-serif"
  }, infoLines.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-neutral-300 space-y-0.5 mb-2"
  }, infoLines.map(([label, val]) => /*#__PURE__*/React.createElement("div", {
    key: label
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-amber-300"
  }, label), " ", val))), abilityRow && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-1 text-center text-xs border-y border-amber-800/40 py-2 mb-2"
  }, ["str", "dex", "con", "int", "wis", "cha"].map(k => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-amber-300"
  }, k.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "text-neutral-300"
  }, a.abilities[k] || "—")))), traits.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 mb-2 border-t border-amber-800/40 pt-2"
  }, traits.map((t, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "text-xs text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "italic font-bold text-amber-200"
  }, t.name, "."), " ", t.desc))), actions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "border-t border-amber-800/40 pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center text-sm font-bold text-amber-300 tracking-wide mb-1"
  }, "Actions"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, actions.map((act, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "text-xs text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "italic font-bold text-amber-200"
  }, act.name, "."), " ", act.desc)))));
}
function CombatantCard({
  c,
  isCurrent,
  inCombat,
  onUpdate,
  onRemove,
  onEndTurn,
  onInitChange,
  cardRef,
  onSetClipboard
}) {
  const [statBlockOpen, setStatBlockOpen] = useState(false);
  const [dmgInput, setDmgInput] = useState("");
  const [healInput, setHealInput] = useState("");
  const style = TYPE_STYLE[c.type];
  const dead = c.status === "dead";
  const isPlayer = c.type === "player";
  const isEnemy = c.type === "enemy";
  const isNpc = c.type === "npc";
  const isMarker = c.type === "marker";
  const pct = isEnemy || isNpc ? clamp(c.currentHp / c.maxHp * 100, 0, 100) : 0;
  const applyHp = delta => {
    const newHp = clamp(c.currentHp + delta, 0, c.maxHp);
    const patch = {
      currentHp: newHp
    };
    if (isEnemy) {
      let status = c.status;
      let revived = false;
      if (newHp === 0) status = "dead";else if (status === "dead") {
        status = "active";
        revived = true;
      }
      patch.status = status;
      if (revived) patch._revive = true;
    } else if (isNpc) {
      let status = c.status;
      let revived = false;
      if (newHp === 0 && c.currentHp > 0) {
        status = "unconscious";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      } else if (newHp > 0 && status !== "active") {
        revived = status === "dead";
        status = "active";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      }
      patch.status = status;
      if (revived) patch._revive = true;
    }
    onUpdate(patch);
  };
  const applyDamage = () => {
    const n = parseInt(dmgInput, 10);
    if (!isNaN(n) && n > 0) applyHp(-n);
    setDmgInput("");
  };
  const applyHeal = () => {
    const n = parseInt(healInput, 10);
    if (!isNaN(n) && n > 0) applyHp(n);
    setHealInput("");
  };
  const setDown = () => onUpdate({
    status: "unconscious",
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  const setAlive = () => onUpdate({
    status: "active",
    deathSaves: {
      success: 0,
      fail: 0
    },
    ...(c.status === "dead" ? {
      _revive: true
    } : {})
  });
  const isDownGroup = c.status === "unconscious" || c.status === "stable" || c.status === "dead";
  const markDead = () => onUpdate({
    currentHp: 0,
    status: "dead",
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: `rounded-xl border p-3 transition-all ${dead ? "opacity-50 border-neutral-800 bg-neutral-900/40" : isCurrent ? "border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-900/20 ring-1 ring-amber-400/40" : `${style.border} ${style.bg}`}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: `flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 relative text-sm ${style.iconBg}`
  }, style.icon, c.color && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-neutral-950",
    style: {
      backgroundColor: c.color
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `font-semibold truncate ${dead ? "line-through text-neutral-500" : "text-neutral-100"}`
  }, c.name), dead && /*#__PURE__*/React.createElement("span", {
    className: "text-neutral-500 shrink-0"
  }, "💀")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-neutral-500"
  }, "Init"), /*#__PURE__*/React.createElement(InitiativeEditor, {
    value: c.initiative,
    onChange: onInitChange
  }), /*#__PURE__*/React.createElement(StatusPill, {
    status: c.status
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0"
  }, (isEnemy || isNpc) && !dead && /*#__PURE__*/React.createElement("button", {
    onClick: markDead,
    title: "Mark dead",
    className: "text-neutral-600 hover:text-rose-400 text-base leading-none"
  }, "💀"), isEnemy && !inCombat && /*#__PURE__*/React.createElement("button", {
    onClick: onSetClipboard,
    title: "Set as Duplicate source",
    className: "text-neutral-600 hover:text-sky-300 text-sm leading-none"
  }, "📋"), /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    disabled: inCombat,
    title: inCombat ? "Can't remove mid-initiative" : "Remove",
    className: `text-neutral-600 text-base leading-none ${inCombat ? "opacity-30 cursor-not-allowed" : "hover:text-neutral-300"}`
  }, "✕"))), isPlayer && /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex rounded-lg border border-neutral-700 overflow-hidden text-xs font-semibold"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: setAlive,
    className: `flex-1 py-1.5 transition-colors ${!isDownGroup ? "bg-emerald-600 text-white" : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"}`
  }, "Alive"), /*#__PURE__*/React.createElement("button", {
    onClick: setDown,
    className: `flex-1 py-1.5 transition-colors ${isDownGroup ? "bg-amber-600 text-neutral-950" : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"}`
  }, "Down")), c.status === "unconscious" && /*#__PURE__*/React.createElement(DeathSaves, {
    combatant: c,
    onUpdate: onUpdate
  })), (isEnemy || isNpc) && /*#__PURE__*/React.createElement("div", {
    className: "mt-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-neutral-500"
  }, "HP"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-neutral-300"
  }, c.currentHp, " / ", c.maxHp)), /*#__PURE__*/React.createElement("div", {
    className: "h-2 rounded-full bg-neutral-800 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: `h-full transition-all ${pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500"}`,
    style: {
      width: `${pct}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => applyHp(-1),
    className: "w-6 h-6 rounded bg-neutral-800 hover:bg-rose-900/50 text-neutral-300 text-sm font-bold"
  }, "−"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applyHp(1),
    className: "w-6 h-6 rounded bg-neutral-800 hover:bg-emerald-900/50 text-neutral-300 text-sm font-bold"
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-1.5 mt-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    value: dmgInput,
    onChange: e => setDmgInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && applyDamage(),
    placeholder: "Damage",
    inputMode: "numeric",
    className: "w-full min-w-0 text-xs bg-neutral-900 border border-rose-900/60 rounded px-2 py-1 outline-none focus:border-rose-500 text-neutral-200 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: applyDamage,
    className: "text-xs px-2 py-1 rounded bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold shrink-0"
  }, "−")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    value: healInput,
    onChange: e => setHealInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && applyHeal(),
    placeholder: "Heal",
    inputMode: "numeric",
    className: "w-full min-w-0 text-xs bg-neutral-900 border border-emerald-900/60 rounded px-2 py-1 outline-none focus:border-emerald-500 text-neutral-200 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: applyHeal,
    className: "text-xs px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold shrink-0"
  }, "+"))), isNpc && c.status === "unconscious" && /*#__PURE__*/React.createElement(DeathSaves, {
    combatant: c,
    onUpdate: onUpdate
  })), !isMarker && /*#__PURE__*/React.createElement(ConditionRow, {
    c: c,
    onAdd: tag => onUpdate({
      conditions: [...c.conditions, tag]
    }),
    onRemove: tag => onUpdate({
      conditions: c.conditions.filter(t => t !== tag)
    }),
    onToggleConcentration: () => onUpdate({
      concentration: !c.concentration
    })
  }), inCombat && isCurrent && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onEndTurn();
      setStatBlockOpen(false);
    },
    className: "mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-lg py-1.5 transition-colors"
  }, "End Turn ▸"), (isEnemy || isNpc) && hasAdvancedInfo(c.advanced) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStatBlockOpen(v => !v),
    className: "mt-1.5 w-full text-center text-xs text-neutral-500 hover:text-neutral-300"
  }, statBlockOpen ? "▲ Collapse stat block" : "▼ Expand stat block"), statBlockOpen && /*#__PURE__*/React.createElement(StatBlockPanel, {
    advanced: c.advanced
  })));
}
function EditorSection({
  title,
  icon,
  accent,
  open,
  onToggle,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-lg border ${accent.border} ${accent.bg}`
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    className: `w-full flex items-center justify-between px-3 py-2 text-sm font-semibold ${accent.text}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, icon, " ", title), /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${open ? "rotate-180" : ""}`
  }, "▾")), open && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pb-3 space-y-1.5"
  }, children));
}
function RoundDivider() {
  return /*#__PURE__*/React.createElement("div", {
    className: "h-px my-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent"
  });
}
function ConfirmModal({
  message,
  onCancel,
  onConfirm
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-sm shrink-0"
  }, "⚔️"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-neutral-200"
  }, "InitLite")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-neutral-300 mb-4"
  }, message), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "flex-1 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg py-2"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: onConfirm,
    className: "flex-1 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2"
  }, "Confirm"))));
}
function EndInitiativeModal({
  onEnd,
  onReroll,
  onCancel
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-sm shrink-0"
  }, "⚔️"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-neutral-200"
  }, "InitLite")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-neutral-300 mb-4"
  }, "End this fight's initiative, or reroll enemies for a new one?"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnd,
    className: "w-full text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg py-2"
  }, "⏹ End Initiative"), /*#__PURE__*/React.createElement("button", {
    onClick: onReroll,
    className: "w-full text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-lg py-2"
  }, "🎲 Re-Roll Initiative"), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "w-full text-sm font-medium bg-transparent hover:bg-neutral-800 text-neutral-400 rounded-lg py-2"
  }, "Cancel")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mt-3"
  }, "Re-Roll keeps player initiatives and rerolls enemies for a fresh round 1.")));
}
function CombatTracker() {
  const savedState = loadJSON(STATE_KEY, null);
  const [combatants, setCombatants] = useState(savedState?.combatants || []);
  const [round, setRound] = useState(savedState?.round || 1);
  const [turnsThisRound, setTurnsThisRound] = useState(savedState?.turnsThisRound || 0);
  const [inCombat, setInCombat] = useState(savedState?.inCombat || false);
  const [savedEncounters, setSavedEncounters] = useState(loadJSON(ENCOUNTERS_KEY, {}));
  const [savedParties, setSavedParties] = useState(loadJSON(PARTIES_KEY, {}));
  const [showEditor, setShowEditor] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [showEnemyForm, setShowEnemyForm] = useState(false);
  const [showEncounterForm, setShowEncounterForm] = useState(false);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [showBackupForm, setShowBackupForm] = useState(false);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [showDifficultyPopover, setShowDifficultyPopover] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: ""
  });
  const [enemyForm, setEnemyForm] = useState({
    name: "",
    qty: "1",
    maxHp: "",
    mod: "",
    cr: "",
    color: null,
    advanced: makeDefaultAdvanced()
  });
  const [enemyClipboard, setEnemyClipboard] = useState(null);
  const [npcForm, setNpcForm] = useState({
    name: "",
    qty: "1",
    maxHp: "",
    mod: "",
    advanced: makeDefaultAdvanced()
  });
  const [savedEnemyTemplates, setSavedEnemyTemplates] = useState(loadJSON(ENEMY_TEMPLATES_KEY, {}));
  const [showEnemyLibrary, setShowEnemyLibrary] = useState(false);
  const [enemyLibrarySaveName, setEnemyLibrarySaveName] = useState("");
  const [savedNpcTemplates, setSavedNpcTemplates] = useState(loadJSON(NPC_TEMPLATES_KEY, {}));
  const [showNpcLibrary, setShowNpcLibrary] = useState(false);
  const [npcLibrarySaveName, setNpcLibrarySaveName] = useState("");
  const [markerForm, setMarkerForm] = useState({
    name: "",
    initiative: "20"
  });
  const [encounterName, setEncounterName] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState("");
  const [partyName, setPartyName] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [partyLevel, setPartyLevel] = useState(savedState?.partyLevel || "");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const requestConfirm = (message, onConfirm) => setConfirmDialog({
    message,
    onConfirm
  });
  const [showEndInitiativeModal, setShowEndInitiativeModal] = useState(false);
  const currentCardRef = useRef(null);
  const importInputRef = useRef(null);
  const [importError, setImportError] = useState("");
  const [currentCardVisible, setCurrentCardVisible] = useState(true);
  const [roundFlash, setRoundFlash] = useState(false);
  const prevRoundRef = useRef(round);
  useEffect(() => {
    if (prevRoundRef.current !== round) {
      setRoundFlash(true);
      prevRoundRef.current = round;
      const t = setTimeout(() => setRoundFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [round]);
  const [turnHistory, setTurnHistory] = useState([]);
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      combatants,
      round,
      turnsThisRound,
      inCombat,
      partyLevel
    }));
  }, [combatants, round, turnsThisRound, inCombat, partyLevel]);
  useEffect(() => {
    localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(savedEncounters));
  }, [savedEncounters]);
  useEffect(() => {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(savedParties));
  }, [savedParties]);
  useEffect(() => {
    localStorage.setItem(ENEMY_TEMPLATES_KEY, JSON.stringify(savedEnemyTemplates));
  }, [savedEnemyTemplates]);
  useEffect(() => {
    localStorage.setItem(NPC_TEMPLATES_KEY, JSON.stringify(savedNpcTemplates));
  }, [savedNpcTemplates]);
  useEffect(() => {
    if (!inCombat || !currentCardRef.current || typeof IntersectionObserver === "undefined") {
      setCurrentCardVisible(true);
      return;
    }
    const el = currentCardRef.current;
    const obs = new IntersectionObserver(([entry]) => setCurrentCardVisible(entry.isIntersecting), {
      threshold: 0.01
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [inCombat, combatants]);
  const makeMarker = (name, initiative) => ({
    id: uid(),
    type: "marker",
    name,
    initiative,
    conditions: [],
    concentration: false
  });
  const makePlayer = name => ({
    id: uid(),
    type: "player",
    name,
    initiative: 10,
    status: "active",
    conditions: [],
    concentration: false,
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  const addPlayer = () => {
    if (!playerForm.name.trim()) return;
    const c = makePlayer(playerForm.name.trim());
    setCombatants(prev => inCombat ? insertSorted(prev, c) : setupSort([...prev, c]));
    setPlayerForm({
      name: ""
    });
  };
  const buildEnemies = (name, qty, hp, mod, color, cr, existingNames, advanced) => {
    const names = existingNames || new Set();
    const list = [];
    const hasCollision = names.has(name) || nextStartNumber(names, name) > 0;
    if (qty === 1 && !hasCollision) {
      const label = name;
      names.add(label);
      list.push({
        id: uid(),
        type: "enemy",
        name: label,
        initiative: inCombat ? roll20() + mod : null,
        autoRolled: inCombat,
        initMod: mod,
        maxHp: hp,
        currentHp: hp,
        status: "active",
        conditions: [],
        concentration: false,
        deathSaves: {
          success: 0,
          fail: 0
        },
        color,
        cr: cr || null,
        advanced: advanced || null
      });
    } else {
      const start = nextStartNumber(names, name) + 1;
      for (let i = 0; i < qty; i++) {
        const label = `${name} ${start + i}`;
        names.add(label);
        list.push({
          id: uid(),
          type: "enemy",
          name: label,
          initiative: inCombat ? roll20() + mod : null,
          autoRolled: inCombat,
          initMod: mod,
          maxHp: hp,
          currentHp: hp,
          status: "active",
          conditions: [],
          concentration: false,
          deathSaves: {
            success: 0,
            fail: 0
          },
          color,
          cr: cr || null,
          advanced: advanced || null
        });
      }
    }
    return list;
  };
  const buildNpcs = (name, qty, hp, mod, advanced) => {
    const list = [];
    for (let i = 0; i < qty; i++) {
      const label = qty > 1 ? `${name} ${i + 1}` : name;
      list.push({
        id: uid(),
        type: "npc",
        name: label,
        initiative: inCombat ? roll20() + mod : null,
        autoRolled: inCombat,
        initMod: mod,
        maxHp: hp,
        currentHp: hp,
        status: "active",
        conditions: [],
        concentration: false,
        deathSaves: {
          success: 0,
          fail: 0
        },
        color: NPC_COLOR,
        advanced: advanced || null
      });
    }
    return list;
  };
  const addToList = newItems => {
    setCombatants(prev => {
      let next = [...prev];
      newItems.forEach(c => {
        next = inCombat ? insertSorted(next, c) : [...next, c];
      });
      return inCombat ? next : setupSort(next);
    });
  };
  const addEnemies = () => {
    const hp = parseInt(enemyForm.maxHp, 10);
    const mod = parseInt(enemyForm.mod, 10) || 0;
    const qty = clamp(parseInt(enemyForm.qty, 10) || 1, 1, 20);
    if (!enemyForm.name.trim() || isNaN(hp)) return;
    const existingNames = new Set(combatants.filter(c => c.type === "enemy").map(c => c.name));
    const newEnemies = buildEnemies(enemyForm.name.trim(), qty, hp, mod, enemyForm.color, enemyForm.cr.trim(), existingNames, enemyForm.advanced);
    addToList(newEnemies);
    setEnemyForm({
      name: "",
      qty: "1",
      maxHp: "",
      mod: "",
      cr: "",
      color: null,
      advanced: makeDefaultAdvanced()
    });
  };

  // Duplicate now works off an explicitly-chosen clipboard (set via the 📋
  // button on an enemy card) rather than auto-tracking the last add.
  const setClipboardFromCard = c => {
    setEnemyClipboard({
      sourceId: c.id,
      name: c.name,
      maxHp: c.maxHp,
      initMod: c.initMod,
      cr: c.cr,
      advanced: c.advanced
    });
  };
  const duplicateEnemy = () => {
    if (!enemyClipboard) return;
    setEnemyForm({
      name: deriveDuplicateBaseName(enemyClipboard.name),
      qty: "1",
      maxHp: String(enemyClipboard.maxHp),
      mod: String(enemyClipboard.initMod || 0),
      cr: enemyClipboard.cr || "",
      color: null,
      advanced: enemyClipboard.advanced || makeDefaultAdvanced()
    });
  };
  const addNpcs = () => {
    const hp = parseInt(npcForm.maxHp, 10);
    const mod = parseInt(npcForm.mod, 10) || 0;
    const qty = clamp(parseInt(npcForm.qty, 10) || 1, 1, 20);
    if (!npcForm.name.trim() || isNaN(hp)) return;
    addToList(buildNpcs(npcForm.name.trim(), qty, hp, mod, npcForm.advanced));
    setNpcForm({
      name: "",
      qty: "1",
      maxHp: "",
      mod: "",
      advanced: makeDefaultAdvanced()
    });
  };
  const addMarker = () => {
    if (!markerForm.name.trim()) return;
    const init = parseInt(markerForm.initiative, 10);
    const c = makeMarker(markerForm.name.trim(), isNaN(init) ? 20 : init);
    setCombatants(prev => inCombat ? insertSorted(prev, c) : setupSort([...prev, c]));
    setMarkerForm({
      name: "",
      initiative: "20"
    });
  };
  const pickColor = col => {
    setEnemyForm(f => {
      const remainder = stripLeadingColor(f.name.trim());
      const newName = remainder ? `${col.name} ${remainder}` : col.name;
      return {
        ...f,
        name: newName,
        color: col.hex
      };
    });
  };
  const updateCombatant = (id, patch) => {
    setCombatants(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const {
        _revive,
        ...cleanPatch
      } = patch;
      const updated = {
        ...prev[idx],
        ...cleanPatch
      };
      if (_revive) {
        const rest = prev.filter(c => c.id !== id);
        return insertSorted(rest, updated);
      }
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };
  const setInitiative = (id, value) => {
    setCombatants(prev => {
      const updated = prev.map(c => c.id === id ? {
        ...c,
        initiative: value
      } : c);
      return inCombat ? sortByInitiative(updated) : updated;
    });
  };
  const removeCombatant = id => setCombatants(prev => prev.filter(c => c.id !== id));
  const clearEnemies = () => {
    requestConfirm("Remove all enemies from the tracker?", () => {
      setCombatants(prev => prev.filter(c => c.type !== "enemy"));
      // enemyClipboard intentionally survives Clear Enemies — it only resets on Reset All.
    });
  };
  const rollInitiative = () => {
    setCombatants(prev => {
      const rolled = prev.map(c => {
        if ((c.type === "enemy" || c.type === "npc") && (c.initiative === null || c.initiative === undefined)) {
          return {
            ...c,
            initiative: roll20() + (c.initMod || 0),
            autoRolled: true
          };
        }
        return c;
      });
      return sortByInitiative(rolled);
    });
    setInCombat(true);
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const endInitiative = () => {
    setCombatants(prev => {
      const reverted = prev.map(c => {
        if ((c.type === "enemy" || c.type === "npc") && c.autoRolled) return {
          ...c,
          initiative: null,
          autoRolled: false
        };
        if (c.type === "player") return {
          ...c,
          initiative: 10
        };
        return c;
      });
      return setupSort(reverted);
    });
    setInCombat(false);
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const reRollInitiative = () => {
    setCombatants(prev => {
      const rerolled = prev.map(c => {
        if (c.type === "enemy" || c.type === "npc") {
          return {
            ...c,
            initiative: roll20() + (c.initMod || 0),
            autoRolled: true
          };
        }
        return c;
      });
      return sortByInitiative(rerolled);
    });
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const endTurn = () => {
    const alive = combatants.filter(c => c.status !== "dead");
    if (alive.length === 0) return;
    const aliveCount = alive.length;
    setTurnHistory(h => [...h, {
      combatants,
      round,
      turnsThisRound
    }].slice(-20));
    setCombatants(prev => {
      const aliveNow = prev.filter(c => c.status !== "dead");
      const deadNow = prev.filter(c => c.status === "dead");
      if (aliveNow.length === 0) return prev;
      const [first, ...rest] = aliveNow;
      return [...rest, first, ...deadNow];
    });
    setTurnsThisRound(t => {
      const next = t + 1;
      if (next >= aliveCount) {
        setRound(r => r + 1);
        return 0;
      }
      return next;
    });
  };
  const undoEndTurn = () => {
    setTurnHistory(h => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setCombatants(last.combatants);
      setRound(last.round);
      setTurnsThisRound(last.turnsThisRound);
      return h.slice(0, -1);
    });
  };
  const resetAll = () => {
    requestConfirm("Reset everything — clear all combatants and end the current fight?", () => {
      setCombatants([]);
      setRound(1);
      setTurnsThisRound(0);
      setInCombat(false);
      setEnemyClipboard(null);
    });
  };
  const saveEncounter = () => {
    const name = encounterName.trim();
    if (!name) return;
    const templates = combatants.filter(c => c.type === "enemy" || c.type === "npc").map(c => ({
      type: c.type,
      name: c.name,
      maxHp: c.maxHp,
      initMod: c.initMod || 0,
      color: c.color || null,
      cr: c.cr || null,
      advanced: c.advanced || null
    }));
    if (templates.length === 0) return;
    setSavedEncounters(prev => ({
      ...prev,
      [name]: templates
    }));
    setEncounterName("");
  };
  const loadEncounter = () => {
    if (!selectedEncounter || !savedEncounters[selectedEncounter]) return;
    const templates = savedEncounters[selectedEncounter];
    const existingNames = new Set(combatants.filter(c => c.type === "enemy").map(c => c.name));
    const items = templates.flatMap(t => t.type === "npc" ? buildNpcs(t.name, 1, t.maxHp, t.initMod, t.advanced) : buildEnemies(t.name, 1, t.maxHp, t.initMod, t.color, t.cr, existingNames, t.advanced));
    addToList(items);
  };
  const saveEnemyTemplate = () => {
    const name = enemyLibrarySaveName.trim();
    if (!name) return;
    setSavedEnemyTemplates(prev => ({
      ...prev,
      [name]: {
        maxHp: enemyForm.maxHp,
        mod: enemyForm.mod,
        cr: enemyForm.cr,
        color: enemyForm.color,
        advanced: enemyForm.advanced
      }
    }));
    setEnemyLibrarySaveName("");
  };
  const loadEnemyTemplate = name => {
    const t = savedEnemyTemplates[name];
    if (!t) return;
    setEnemyForm(f => ({
      ...f,
      name,
      maxHp: t.maxHp,
      mod: t.mod,
      cr: t.cr,
      color: t.color,
      advanced: t.advanced || makeDefaultAdvanced()
    }));
    setShowEnemyLibrary(false);
  };
  const deleteEnemyTemplate = name => {
    requestConfirm(`Delete saved enemy "${name}"? This can't be undone.`, () => {
      setSavedEnemyTemplates(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
    });
  };
  const saveNpcTemplate = () => {
    const name = npcLibrarySaveName.trim();
    if (!name) return;
    setSavedNpcTemplates(prev => ({
      ...prev,
      [name]: {
        maxHp: npcForm.maxHp,
        mod: npcForm.mod,
        advanced: npcForm.advanced
      }
    }));
    setNpcLibrarySaveName("");
  };
  const loadNpcTemplate = name => {
    const t = savedNpcTemplates[name];
    if (!t) return;
    setNpcForm(f => ({
      ...f,
      name,
      maxHp: t.maxHp,
      mod: t.mod,
      advanced: t.advanced || makeDefaultAdvanced()
    }));
    setShowNpcLibrary(false);
  };
  const deleteNpcTemplate = name => {
    requestConfirm(`Delete saved NPC "${name}"? This can't be undone.`, () => {
      setSavedNpcTemplates(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
    });
  };
  const exportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state: {
        combatants,
        round,
        turnsThisRound,
        inCombat,
        partyLevel
      },
      encounters: savedEncounters,
      parties: savedParties,
      enemyTemplates: savedEnemyTemplates,
      npcTemplates: savedNpcTemplates
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `initlite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const triggerImport = () => {
    setImportError("");
    if (importInputRef.current) importInputRef.current.click();
  };
  const handleImportFile = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let payload;
      try {
        payload = JSON.parse(ev.target.result);
      } catch (err) {
        setImportError("That file doesn't look like a valid InitLite backup (not valid JSON).");
        return;
      }
      if (!payload || typeof payload !== "object") {
        setImportError("That file doesn't look like a valid InitLite backup.");
        return;
      }
      requestConfirm("Import will overwrite all data on this device — combatants, saved parties, encounters, and the enemy/NPC library. Continue?", () => {
        if (payload.state) localStorage.setItem(STATE_KEY, JSON.stringify(payload.state));
        if (payload.encounters) localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(payload.encounters));
        if (payload.parties) localStorage.setItem(PARTIES_KEY, JSON.stringify(payload.parties));
        if (payload.enemyTemplates) localStorage.setItem(ENEMY_TEMPLATES_KEY, JSON.stringify(payload.enemyTemplates));
        if (payload.npcTemplates) localStorage.setItem(NPC_TEMPLATES_KEY, JSON.stringify(payload.npcTemplates));
        window.location.reload();
      });
    };
    reader.readAsText(file);
  };
  const deleteEncounter = name => {
    requestConfirm(`Delete saved encounter "${name}"? This can't be undone.`, () => {
      setSavedEncounters(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      if (selectedEncounter === name) setSelectedEncounter("");
    });
  };
  const saveParty = () => {
    const name = partyName.trim();
    if (!name) return;
    const templates = combatants.filter(c => c.type === "player").map(c => ({
      name: c.name
    }));
    if (templates.length === 0) return;
    setSavedParties(prev => ({
      ...prev,
      [name]: templates
    }));
    setPartyName("");
  };
  const loadParty = () => {
    if (!selectedParty || !savedParties[selectedParty]) return;
    const templates = savedParties[selectedParty];
    addToList(templates.map(t => makePlayer(t.name)));
  };
  const deleteParty = name => {
    requestConfirm(`Delete saved party "${name}"? This can't be undone.`, () => {
      setSavedParties(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      if (selectedParty === name) setSelectedParty("");
    });
  };
  const aliveOrder = combatants.filter(c => c.status !== "dead");
  const deadCombatants = combatants.filter(c => c.status === "dead");
  const dividerIndex = inCombat ? clamp(aliveOrder.length - turnsThisRound, 0, aliveOrder.length) : -1;
  const partyCount = combatants.filter(c => c.type === "player").length;
  const parsedLevel = parseInt(partyLevel, 10);
  const difficulty = computeDifficulty(combatants.filter(c => c.type === "enemy"), parsedLevel, partyCount);
  const DIFFICULTY_STYLE = {
    Trivial: "bg-neutral-800 text-neutral-400 border-neutral-600",
    Easy: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    Medium: "bg-amber-900/40 text-amber-300 border-amber-700",
    Hard: "bg-orange-900/40 text-orange-300 border-orange-700",
    Deadly: "bg-rose-900/40 text-rose-300 border-rose-700"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-lg shrink-0"
  }, "⚔️"), /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-bold tracking-tight"
  }, "InitLite")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDifficultyPopover(v => !v),
    title: "Encounter difficulty",
    className: `w-8 h-8 rounded-full border flex items-center justify-center text-sm shrink-0 transition-colors ${showDifficultyPopover ? "bg-amber-500 border-amber-400 text-neutral-950" : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600"}`
  }, "⚖️"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: clearEnemies,
    disabled: inCombat,
    title: inCombat ? "Can't clear mid-initiative" : "Clear all enemies",
    className: `flex items-center gap-1 text-xs border rounded-lg px-2 py-1.5 whitespace-nowrap ${inCombat ? "text-neutral-600 border-neutral-900 opacity-40 cursor-not-allowed" : "text-neutral-400 hover:text-rose-300 border-neutral-800 hover:border-rose-800"}`
  }, "🗑️ Clear"), /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    disabled: inCombat,
    title: inCombat ? "Can't reset mid-initiative" : "Reset everything",
    className: `flex items-center gap-1 text-xs border rounded-lg px-2 py-1.5 whitespace-nowrap ${inCombat ? "text-neutral-600 border-neutral-900 opacity-40 cursor-not-allowed" : "text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-600"}`
  }, "↺ Reset"))), showDifficultyPopover && /*#__PURE__*/React.createElement("div", {
    className: "mb-3 rounded-lg border border-amber-900/50 bg-amber-950/10 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-neutral-400 shrink-0"
  }, "⚖️ Avg Party Level"), /*#__PURE__*/React.createElement("input", {
    value: partyLevel,
    onChange: e => setPartyLevel(e.target.value),
    placeholder: "e.g. 5",
    inputMode: "numeric",
    className: "w-16 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-amber-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mt-1.5"
  }, "Enables approximate encounter difficulty")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-neutral-800 bg-neutral-900/40 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEditor(v => !v),
    className: "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, "🧰 Editor"), /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${showEditor ? "rotate-180" : ""}`
  }, "▾")), showEditor && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pb-3 space-y-2"
  }, /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Player",
    icon: "🛡️",
    accent: {
      border: "border-sky-900/50",
      bg: "bg-sky-950/10",
      text: "text-sky-300"
    },
    open: showPlayerForm,
    onToggle: () => setShowPlayerForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: playerForm.name,
    onChange: e => setPlayerForm({
      name: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addPlayer(),
    placeholder: "Name",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-sky-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Starts at initiative 10 — edit anytime on the card."), /*#__PURE__*/React.createElement("button", {
    onClick: addPlayer,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded py-1.5"
  }, "+ Add Player")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add NPC",
    icon: "🎭",
    accent: {
      border: "border-stone-600/50",
      bg: "bg-stone-800/10",
      text: "text-stone-300"
    },
    open: showNpcForm,
    onToggle: () => setShowNpcForm(v => !v)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowNpcLibrary(v => !v),
    className: "flex items-center gap-1 text-xs text-stone-300 hover:text-stone-200"
  }, "📚 Saved NPCs ", /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${showNpcLibrary ? "rotate-180" : ""}`
  }, "▾")), showNpcLibrary && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: npcLibrarySaveName,
    onChange: e => setNpcLibrarySaveName(e.target.value),
    placeholder: "Save current as…",
    className: "flex-1 min-w-0 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveNpcTemplate,
    className: "text-xs px-2 py-1 rounded bg-stone-600 hover:bg-stone-500 text-white shrink-0"
  }, "💾 Save")), Object.keys(savedNpcTemplates).length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "No saved NPCs yet.") : /*#__PURE__*/React.createElement("div", {
    className: "max-h-40 overflow-y-auto space-y-1"
  }, Object.keys(savedNpcTemplates).sort((a, b) => a.localeCompare(b)).map(name => /*#__PURE__*/React.createElement("div", {
    key: name,
    className: "flex items-center justify-between text-xs bg-neutral-800 rounded px-2 py-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => loadNpcTemplate(name),
    className: "text-left flex-1 text-neutral-200 hover:text-white truncate"
  }, name), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteNpcTemplate(name),
    className: "text-neutral-500 hover:text-rose-300 ml-2 shrink-0"
  }, "✕")))))), /*#__PURE__*/React.createElement("input", {
    value: npcForm.name,
    onChange: e => setNpcForm({
      ...npcForm,
      name: e.target.value
    }),
    placeholder: "Name",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: npcForm.qty,
    onChange: e => setNpcForm({
      ...npcForm,
      qty: e.target.value
    }),
    placeholder: "Qty",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: npcForm.maxHp,
    onChange: e => setNpcForm({
      ...npcForm,
      maxHp: e.target.value
    }),
    placeholder: "HP",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: npcForm.mod,
    onChange: e => setNpcForm({
      ...npcForm,
      mod: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addNpcs(),
    placeholder: "+0",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement(AdvancedFieldsEditor, {
    value: npcForm.advanced,
    onChange: adv => setNpcForm({
      ...npcForm,
      advanced: adv
    }),
    accent: "text-stone-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addNpcs,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-stone-600 hover:bg-stone-500 rounded py-1.5"
  }, "+ Add NPC")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Enemy",
    icon: "⚔️",
    accent: {
      border: "border-rose-900/50",
      bg: "bg-rose-950/10",
      text: "text-rose-300"
    },
    open: showEnemyForm,
    onToggle: () => setShowEnemyForm(v => !v)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEnemyLibrary(v => !v),
    className: "flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
  }, "📚 Saved Enemies ", /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${showEnemyLibrary ? "rotate-180" : ""}`
  }, "▾")), showEnemyLibrary && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: enemyLibrarySaveName,
    onChange: e => setEnemyLibrarySaveName(e.target.value),
    placeholder: "Save current as…",
    className: "flex-1 min-w-0 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveEnemyTemplate,
    className: "text-xs px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white shrink-0"
  }, "💾 Save")), Object.keys(savedEnemyTemplates).length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "No saved enemies yet.") : /*#__PURE__*/React.createElement("div", {
    className: "max-h-40 overflow-y-auto space-y-1"
  }, Object.keys(savedEnemyTemplates).sort((a, b) => a.localeCompare(b)).map(name => /*#__PURE__*/React.createElement("div", {
    key: name,
    className: "flex items-center justify-between text-xs bg-neutral-800 rounded px-2 py-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => loadEnemyTemplate(name),
    className: "text-left flex-1 text-neutral-200 hover:text-white truncate"
  }, name), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteEnemyTemplate(name),
    className: "text-neutral-500 hover:text-rose-300 ml-2 shrink-0"
  }, "✕")))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, ENEMY_COLORS.map(col => /*#__PURE__*/React.createElement("button", {
    key: col.name,
    title: col.name,
    onClick: () => pickColor(col),
    className: `w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${enemyForm.color === col.hex ? "border-amber-400 ring-2 ring-amber-400 scale-110" : "border-neutral-700"}`,
    style: {
      backgroundColor: col.hex
    }
  }))), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.name,
    onChange: e => setEnemyForm({
      ...enemyForm,
      name: e.target.value
    }),
    placeholder: "Name (or pick a color)",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: enemyForm.qty,
    onChange: e => setEnemyForm({
      ...enemyForm,
      qty: e.target.value
    }),
    placeholder: "Qty",
    inputMode: "numeric",
    className: "w-1/2 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.maxHp,
    onChange: e => setEnemyForm({
      ...enemyForm,
      maxHp: e.target.value
    }),
    placeholder: "HP",
    inputMode: "numeric",
    className: "w-1/2 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: enemyForm.mod,
    onChange: e => setEnemyForm({
      ...enemyForm,
      mod: e.target.value
    }),
    placeholder: "+0 (init mod)",
    inputMode: "numeric",
    className: "w-1/2 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.cr,
    onChange: e => setEnemyForm({
      ...enemyForm,
      cr: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addEnemies(),
    placeholder: "CR (optional)",
    inputMode: "decimal",
    className: "w-1/2 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement(AdvancedFieldsEditor, {
    value: enemyForm.advanced,
    onChange: adv => setEnemyForm({
      ...enemyForm,
      advanced: adv
    }),
    accent: "text-rose-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addEnemies,
    className: "flex-1 flex items-center justify-center gap-1 text-sm font-medium bg-rose-600 hover:bg-rose-500 rounded py-1.5"
  }, "+ Add Enemy"), enemyClipboard && /*#__PURE__*/React.createElement("button", {
    onClick: duplicateEnemy,
    title: "Duplicate from clipboard",
    className: "px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-sm shrink-0"
  }, "📋"))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Marker",
    icon: "🚩",
    accent: {
      border: "border-indigo-900/50",
      bg: "bg-indigo-950/10",
      text: "text-indigo-300"
    },
    open: showMarkerForm,
    onToggle: () => setShowMarkerForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: markerForm.name,
    onChange: e => setMarkerForm({
      ...markerForm,
      name: e.target.value
    }),
    placeholder: "e.g. Lair Actions",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-neutral-500 shrink-0"
  }, "Initiative"), /*#__PURE__*/React.createElement("input", {
    value: markerForm.initiative,
    onChange: e => setMarkerForm({
      ...markerForm,
      initiative: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addMarker(),
    inputMode: "numeric",
    className: "w-16 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Defaults to 20 — edit anytime on the card.")), /*#__PURE__*/React.createElement("button", {
    onClick: addMarker,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded py-1.5"
  }, "🚩 Add Marker")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Saved Encounters",
    icon: "📖",
    accent: {
      border: "border-violet-900/50",
      bg: "bg-violet-950/10",
      text: "text-violet-300"
    },
    open: showEncounterForm,
    onToggle: () => setShowEncounterForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: encounterName,
    onChange: e => setEncounterName(e.target.value),
    placeholder: "Name this encounter",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-violet-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveEncounter,
    className: "w-full text-sm font-medium bg-violet-700 hover:bg-violet-600 rounded py-1.5"
  }, "Save current enemies & NPCs"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedEncounter,
    onChange: e => setSelectedEncounter(e.target.value),
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-violet-500 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedEncounters).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name, " (", savedEncounters[name].length, ")"))), /*#__PURE__*/React.createElement("button", {
    onClick: loadEncounter,
    disabled: !selectedEncounter,
    className: "text-sm font-medium bg-violet-700 hover:bg-violet-600 disabled:opacity-40 rounded px-3 py-1.5 shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedEncounter && deleteEncounter(selectedEncounter),
    disabled: !selectedEncounter,
    className: "text-sm text-neutral-400 hover:text-rose-300 disabled:opacity-40 rounded px-2 py-1.5 shrink-0"
  }, "✕"))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Saved Parties",
    icon: "🧑‍🤝‍🧑",
    accent: {
      border: "border-teal-900/50",
      bg: "bg-teal-950/10",
      text: "text-teal-300"
    },
    open: showPartyForm,
    onToggle: () => setShowPartyForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: partyName,
    onChange: e => setPartyName(e.target.value),
    placeholder: "Name this party",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-teal-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveParty,
    className: "w-full text-sm font-medium bg-teal-700 hover:bg-teal-600 rounded py-1.5"
  }, "Save current players"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedParty,
    onChange: e => setSelectedParty(e.target.value),
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-teal-500 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedParties).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name, " (", savedParties[name].length, ")"))), /*#__PURE__*/React.createElement("button", {
    onClick: loadParty,
    disabled: !selectedParty,
    className: "text-sm font-medium bg-teal-700 hover:bg-teal-600 disabled:opacity-40 rounded px-3 py-1.5 shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedParty && deleteParty(selectedParty),
    disabled: !selectedParty,
    className: "text-sm text-neutral-400 hover:text-rose-300 disabled:opacity-40 rounded px-2 py-1.5 shrink-0"
  }, "✕"))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Backup & Restore",
    icon: "💾",
    accent: {
      border: "border-neutral-700/50",
      bg: "bg-neutral-800/20",
      text: "text-neutral-300"
    },
    open: showBackupForm,
    onToggle: () => setShowBackupForm(v => !v)
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Move everything — combatants, saved parties, encounters, and the enemy/NPC library — between your devices as a file."), /*#__PURE__*/React.createElement("button", {
    onClick: exportData,
    className: "w-full text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded py-1.5"
  }, "⬇️ Export Data"), /*#__PURE__*/React.createElement("button", {
    onClick: triggerImport,
    className: "w-full text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded py-1.5"
  }, "⬆️ Import Data"), /*#__PURE__*/React.createElement("input", {
    ref: importInputRef,
    type: "file",
    accept: ".json,application/json",
    onChange: handleImportFile,
    className: "hidden"
  }), importError && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-rose-400"
  }, importError)))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-500 text-center my-3"
  }, inCombat ? /*#__PURE__*/React.createElement(React.Fragment, null, "Round ", /*#__PURE__*/React.createElement("span", {
    className: `font-bold transition-colors duration-700 ${roundFlash ? "text-amber-400" : "text-neutral-500"}`
  }, round), " · ") : "Setting up · ", combatants.length, " combatant", combatants.length !== 1 ? "s" : ""), difficulty && /*#__PURE__*/React.createElement("div", {
    className: `w-full mb-3 flex items-center justify-between text-xs rounded-lg border px-3 py-2 ${DIFFICULTY_STYLE[difficulty.band]}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "⚖️ ", difficulty.band, " encounter"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono opacity-80"
  }, "~", difficulty.adjustedXP, " adj. XP ", difficulty.missingCr > 0 ? `(${difficulty.missingCr} enemy w/o CR)` : "")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: inCombat ? () => setShowEndInitiativeModal(true) : rollInitiative,
    className: `flex-1 flex items-center justify-center gap-1.5 text-sm font-bold rounded-lg py-2.5 transition-colors ${inCombat ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700" : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-neutral-950"}`
  }, inCombat ? "⏹ End Initiative" : "🎲 Roll Initiative"), inCombat && /*#__PURE__*/React.createElement("button", {
    onClick: undoEndTurn,
    disabled: turnHistory.length === 0,
    title: "Undo last End Turn",
    className: `px-4 rounded-lg border text-base transition-colors ${turnHistory.length === 0 ? "opacity-30 cursor-not-allowed border-neutral-800 text-neutral-600" : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"}`
  }, "↩️")), inCombat && !currentCardVisible && aliveOrder[0] && /*#__PURE__*/React.createElement("div", {
    className: "fixed top-0 left-0 right-0 z-20 bg-amber-500 text-neutral-950 px-4 py-2 flex items-center justify-between shadow-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold truncate"
  }, "▸ ", aliveOrder[0].name, "'s turn"), /*#__PURE__*/React.createElement("button", {
    onClick: endTurn,
    className: "text-xs font-bold bg-neutral-950 text-amber-400 rounded px-3 py-1.5 shrink-0 ml-2"
  }, "End Turn")), combatants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-neutral-600 border border-dashed border-neutral-800 rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl mb-2 opacity-50"
  }, "♥"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "Add combatants to begin the encounter.")) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, aliveOrder.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: c.id
  }, i === dividerIndex && /*#__PURE__*/React.createElement(RoundDivider, null), /*#__PURE__*/React.createElement(CombatantCard, {
    c: c,
    isCurrent: i === 0,
    inCombat: inCombat,
    cardRef: i === 0 ? currentCardRef : null,
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val),
    onSetClipboard: () => setClipboardFromCard(c)
  }))), dividerIndex === aliveOrder.length && aliveOrder.length > 0 && /*#__PURE__*/React.createElement(RoundDivider, null), deadCombatants.map(c => /*#__PURE__*/React.createElement(CombatantCard, {
    key: c.id,
    c: c,
    isCurrent: false,
    inCombat: inCombat,
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val),
    onSetClipboard: () => setClipboardFromCard(c)
  })))), confirmDialog && /*#__PURE__*/React.createElement(ConfirmModal, {
    message: confirmDialog.message,
    onCancel: () => setConfirmDialog(null),
    onConfirm: () => {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  }), showEndInitiativeModal && /*#__PURE__*/React.createElement(EndInitiativeModal, {
    onEnd: () => {
      endInitiative();
      setShowEndInitiativeModal(false);
    },
    onReroll: () => {
      reRollInitiative();
      setShowEndInitiativeModal(false);
    },
    onCancel: () => setShowEndInitiativeModal(false)
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(CombatTracker, null));