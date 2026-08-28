const {
  useState,
  useEffect
} = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const roll20 = () => Math.floor(Math.random() * 20) + 1;
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Ordered by hue around the color wheel (Brown grouped with Orange as its
// dark/desaturated cousin, Black as the achromatic outlier at the end).
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
}];
const NPC_COLOR = "#a1a1aa";
const STATE_KEY = "dndTracker.state.v3";
const ENCOUNTERS_KEY = "dndTracker.encounters.v3";
const PARTIES_KEY = "dndTracker.parties.v3";
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
  enemy: 2
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
  const [value, setValue] = useState("");
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
    value: value,
    onChange: e => setValue(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && value.trim()) {
        onAdd(value.trim());
        setValue("");
      }
    },
    placeholder: "+ condition",
    className: "text-xs bg-transparent border border-dashed border-neutral-700 rounded-full px-2 py-0.5 w-24 focus:w-32 transition-all outline-none focus:border-neutral-500 text-neutral-300 placeholder:text-neutral-600"
  }));
}
function InitiativeEditor({
  value,
  onChange
}) {
  const display = value === null || value === undefined ? "" : value;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange((value ?? 0) - 1),
    className: "w-4 h-4 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs"
  }, "−"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: display,
    placeholder: "—",
    onChange: e => onChange(e.target.value === "" ? null : parseInt(e.target.value, 10) || 0),
    className: "w-9 text-sm font-mono font-bold text-center bg-transparent text-neutral-200 outline-none border-b border-transparent focus:border-neutral-500 placeholder:text-neutral-600"
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
  }
};
function CombatantCard({
  c,
  isCurrent,
  inCombat,
  onUpdate,
  onRemove,
  onEndTurn,
  onInitChange
}) {
  const [dmgInput, setDmgInput] = useState("");
  const [healInput, setHealInput] = useState("");
  const style = TYPE_STYLE[c.type];
  const dead = c.status === "dead";
  const isPlayer = c.type === "player";
  const isEnemy = c.type === "enemy";
  const isNpc = c.type === "npc";
  const pct = !isPlayer ? clamp(c.currentHp / c.maxHp * 100, 0, 100) : 0;
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
      if (newHp === 0 && c.currentHp > 0) {
        status = "unconscious";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      } else if (newHp > 0 && status !== "active") {
        status = "active";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      }
      patch.status = status;
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
    }
  });
  const isDownGroup = c.status === "unconscious" || c.status === "stable" || c.status === "dead";
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-xl border p-3 transition-all ${dead && isEnemy ? "opacity-50 border-neutral-800 bg-neutral-900/40" : isCurrent ? "border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-900/20 ring-1 ring-amber-400/40" : `${style.border} ${style.bg}`}`
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
    className: `font-semibold truncate ${dead && isEnemy ? "line-through text-neutral-500" : "text-neutral-100"}`
  }, c.name), dead && isEnemy && /*#__PURE__*/React.createElement("span", {
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
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    className: "text-neutral-600 hover:text-neutral-300 shrink-0"
  }, "✕")), isPlayer && /*#__PURE__*/React.createElement("div", {
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
  })), /*#__PURE__*/React.createElement(ConditionRow, {
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
    onClick: onEndTurn,
    className: "mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-lg py-1.5 transition-colors"
  }, "End Turn ▸"));
}
function SectionHeader({
  icon,
  title,
  accentText
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `text-sm font-semibold flex items-center gap-1.5 mb-2 ${accentText}`
  }, icon, " ", title);
}
function RoundDivider() {
  return /*#__PURE__*/React.createElement("div", {
    className: "h-px my-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent"
  });
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
  const [playerForm, setPlayerForm] = useState({
    name: ""
  });
  const [enemyForm, setEnemyForm] = useState({
    name: "",
    qty: "1",
    maxHp: "",
    mod: "",
    color: null
  });
  const [npcForm, setNpcForm] = useState({
    name: "",
    qty: "1",
    maxHp: "",
    mod: ""
  });
  const [encounterName, setEncounterName] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState("");
  const [partyName, setPartyName] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      combatants,
      round,
      turnsThisRound,
      inCombat
    }));
  }, [combatants, round, turnsThisRound, inCombat]);
  useEffect(() => {
    localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(savedEncounters));
  }, [savedEncounters]);
  useEffect(() => {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(savedParties));
  }, [savedParties]);
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
  const buildEnemies = (name, qty, hp, mod, color) => {
    const list = [];
    for (let i = 0; i < qty; i++) {
      const label = qty > 1 ? `${name} ${i + 1}` : name;
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
        color
      });
    }
    return list;
  };
  const buildNpcs = (name, qty, hp, mod) => {
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
        color: NPC_COLOR
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
    addToList(buildEnemies(enemyForm.name.trim(), qty, hp, mod, enemyForm.color));
    setEnemyForm({
      name: "",
      qty: "1",
      maxHp: "",
      mod: "",
      color: null
    });
  };
  const addNpcs = () => {
    const hp = parseInt(npcForm.maxHp, 10);
    const mod = parseInt(npcForm.mod, 10) || 0;
    const qty = clamp(parseInt(npcForm.qty, 10) || 1, 1, 20);
    if (!npcForm.name.trim() || isNaN(hp)) return;
    addToList(buildNpcs(npcForm.name.trim(), qty, hp, mod));
    setNpcForm({
      name: "",
      qty: "1",
      maxHp: "",
      mod: ""
    });
  };
  const pickColor = col => setEnemyForm(f => ({
    ...f,
    name: col.name,
    color: col.hex
  }));
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
  const clearEnemies = () => setCombatants(prev => prev.filter(c => c.type !== "enemy"));
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
  };
  const endTurn = () => {
    const alive = combatants.filter(c => !(c.type === "enemy" && c.status === "dead"));
    const aliveCount = alive.length;
    setCombatants(prev => {
      const aliveNow = prev.filter(c => !(c.type === "enemy" && c.status === "dead"));
      const deadNow = prev.filter(c => c.type === "enemy" && c.status === "dead");
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
  const resetAll = () => {
    setCombatants([]);
    setRound(1);
    setTurnsThisRound(0);
    setInCombat(false);
  };
  const saveEncounter = () => {
    const name = encounterName.trim();
    if (!name) return;
    const templates = combatants.filter(c => c.type === "enemy").map(c => ({
      name: c.name,
      maxHp: c.maxHp,
      initMod: c.initMod || 0,
      color: c.color || null
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
    addToList(templates.flatMap(t => buildEnemies(t.name, 1, t.maxHp, t.initMod, t.color)));
  };
  const deleteEncounter = name => {
    if (!window.confirm(`Delete saved encounter "${name}"? This can't be undone.`)) return;
    setSavedEncounters(prev => {
      const next = {
        ...prev
      };
      delete next[name];
      return next;
    });
    if (selectedEncounter === name) setSelectedEncounter("");
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
    if (!window.confirm(`Delete saved party "${name}"? This can't be undone.`)) return;
    setSavedParties(prev => {
      const next = {
        ...prev
      };
      delete next[name];
      return next;
    });
    if (selectedParty === name) setSelectedParty("");
  };
  const aliveOrder = combatants.filter(c => !(c.type === "enemy" && c.status === "dead"));
  const deadEnemies = combatants.filter(c => c.type === "enemy" && c.status === "dead");
  const dividerIndex = inCombat ? clamp(aliveOrder.length - turnsThisRound, 0, aliveOrder.length) : -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-lg"
  }, "⚔️"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-bold tracking-tight"
  }, "Encounter Tracker"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-500"
  }, inCombat ? `Round ${round} · ` : "Setting up · ", combatants.length, " combatant", combatants.length !== 1 ? "s" : ""))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: clearEnemies,
    className: "flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-300 border border-neutral-800 hover:border-rose-800 rounded-lg px-2.5 py-1.5"
  }, "🗑️ Clear Enemies"), /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    className: "flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-600 rounded-lg px-2.5 py-1.5"
  }, "↺ Reset All"))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-neutral-800 bg-neutral-900/40 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEditor(v => !v),
    className: "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, "🧰 Editor"), /*#__PURE__*/React.createElement("span", {
    className: `transition-transform inline-block ${showEditor ? "rotate-180" : ""}`
  }, "▾")), showEditor && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pb-3 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-sky-900/50 bg-sky-950/10 p-3"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    icon: "🛡️",
    title: "Add Player",
    accentText: "text-sky-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
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
  }, "+ Add Player"))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-stone-600/50 bg-stone-800/10 p-3"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    icon: "🎭",
    title: "Add NPC",
    accentText: "text-stone-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, /*#__PURE__*/React.createElement("input", {
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
  })), /*#__PURE__*/React.createElement("button", {
    onClick: addNpcs,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-stone-600 hover:bg-stone-500 rounded py-1.5"
  }, inCombat ? "🎲 Roll & Add" : "+ Add NPC"))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-rose-900/50 bg-rose-950/10 p-3 sm:col-span-2"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    icon: "⚔️",
    title: "Add Enemy",
    accentText: "text-rose-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, ENEMY_COLORS.map(col => /*#__PURE__*/React.createElement("button", {
    key: col.name,
    title: col.name,
    onClick: () => pickColor(col),
    className: `w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${enemyForm.color === col.hex ? "border-white scale-110" : "border-neutral-700"}`,
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
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.maxHp,
    onChange: e => setEnemyForm({
      ...enemyForm,
      maxHp: e.target.value
    }),
    placeholder: "HP",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.mod,
    onChange: e => setEnemyForm({
      ...enemyForm,
      mod: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addEnemies(),
    placeholder: "+0",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: addEnemies,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-rose-600 hover:bg-rose-500 rounded py-1.5"
  }, inCombat ? "🎲 Roll & Add" : "+ Add Enemy")))), /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-violet-900/50 bg-violet-950/10 p-3"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    icon: "📖",
    title: "Saved Encounters",
    accentText: "text-violet-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: encounterName,
    onChange: e => setEncounterName(e.target.value),
    placeholder: "Name this encounter",
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-violet-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: saveEncounter,
    className: "w-full text-sm font-medium bg-violet-700 hover:bg-violet-600 rounded py-1.5"
  }, "Save current enemies"), /*#__PURE__*/React.createElement("div", {
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
  }, "✕")))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-teal-900/50 bg-teal-950/10 p-3"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    icon: "🧑‍🤝‍🧑",
    title: "Saved Parties",
    accentText: "text-teal-300"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: partyName,
    onChange: e => setPartyName(e.target.value),
    placeholder: "Name this party",
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-teal-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("button", {
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
  }, "✕"))))))), /*#__PURE__*/React.createElement("button", {
    onClick: inCombat ? endInitiative : rollInitiative,
    className: `w-full mb-5 flex items-center justify-center gap-1.5 text-sm font-bold rounded-lg py-2.5 transition-colors ${inCombat ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700" : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-neutral-950"}`
  }, inCombat ? "⏹ End Initiative" : "🎲 Roll Initiative"), combatants.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val)
  }))), dividerIndex === aliveOrder.length && aliveOrder.length > 0 && /*#__PURE__*/React.createElement(RoundDivider, null), deadEnemies.map(c => /*#__PURE__*/React.createElement(CombatantCard, {
    key: c.id,
    c: c,
    isCurrent: false,
    inCombat: inCombat,
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val)
  })))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(CombatTracker, null));