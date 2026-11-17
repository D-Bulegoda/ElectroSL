import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import './CircuitSimulator.css';

const GRID_SIZE = 28;

const WIRE_STYLES = {
  L: { name: 'Live (Brown) / ජීවී', outer: '#7C2D12', inner: '#EA580C' },
  N: { name: 'Neutral (Blue) / උදාසීන', outer: '#1E3A8A', inner: '#3B82F6' },
  E: { name: 'Earth (Green/Yellow) / පෘථිවි', outer: '#15803D', inner: '#FACC15' },
};

function snapToPeg(val) {
  return Math.max(GRID_SIZE, Math.round(val / GRID_SIZE) * GRID_SIZE);
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildWirePoints(from, to, waypoints = [], wireIndex = 0) {
  if (waypoints && waypoints.length > 0) {
    const nodes = [from, ...waypoints, to];
    const pts = [nodes[0].x, nodes[0].y];

    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      if (Math.abs(curr.x - next.x) > 4 && Math.abs(curr.y - next.y) > 4) {
        pts.push(next.x, curr.y);
      }
      pts.push(next.x, next.y);
    }
    return pts;
  }

  const laneOffset = ((wireIndex % 6) + 1) * 14;
  const dropY = Math.max(from.y, to.y) + 28 + laneOffset;
  return [from.x, from.y, from.x, dropY, to.x, dropY, to.x, to.y];
}

// Preliminary Task Pool (120 seconds each)
const PRELIMINARY_TASKS = [
  {
    id: 'TASK_LIGHT_SINGLE',
    titleEn: 'Single-Way Lighting & Earth Bonding',
    titleSinhala: 'ආලෝකකරණ පරිපථය සහ පෘථිවි සම්බන්ධතාව',
    descEn: 'Click a terminal, click black pegboard dots to route your cable cleanly around components, and click the target terminal.',
    descSinhala: 'ටර්මිනලයක් ක්ලික් කර, කළු තිත් මත ක්ලික් කරමින් කේබලය නිවැරදිව හරවා අදාළ ටර්මිනලයට සම්බන්ධ කරන්න.',
    level: 1,
    timeLimitSeconds: 120,
    requiredLoads: ['BULB_1'],
    requiredWires: [
      { from: 'CU_L', to: 'SW_COM', type: 'L' },
      { from: 'SW_L1', to: 'BULB_L', type: 'L' },
      { from: 'CU_N', to: 'BULB_N', type: 'N' },
      { from: 'CU_E', to: 'BULB_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_SOCKET_13A',
    titleEn: '13A Switched Socket Outlet Polarity Wiring',
    titleSinhala: '13A ස්විච් සොකට් අලෙවිසැල් රැහැන්ගත කිරීම',
    descEn: 'Wire CU directly to the Sri Lankan 13A Switched Socket: Live to L, Neutral to N, and Earth to E using the pegboard dots.',
    descSinhala: 'CU සිට 13A ස්විච් සොකට් එකට කම්බි සම්බන්ධ කරන්න: ජීවී (L), උදාසීන (N), සහ පෘථිවි (E).',
    level: 2,
    timeLimitSeconds: 120,
    requiredLoads: ['SOCKET_13A'],
    requiredWires: [
      { from: 'CU_L', to: 'SOCK_L', type: 'L' },
      { from: 'CU_N', to: 'SOCK_N', type: 'N' },
      { from: 'CU_E', to: 'SOCK_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_TWO_WAY_STAIRCASE',
    titleEn: 'Two-Way Staircase Lighting Control',
    titleSinhala: 'පඩිපෙළ ආලෝක පාලනය (Two-Way Switching)',
    descEn: 'Wire CU Live → SW1 COM. Connect strappers L1↔L1 and L2↔L2, then SW2 COM → Bulb L, plus Neutral and Earth.',
    descSinhala: 'CU ජීවී කම්බිය පළමු ස්විචයේ COM වෙතද, L1 සහ L2 ස්විච් දෙක අතරද, දෙවන ස්විචයේ COM සිට බල්බයටද සවි කරන්න.',
    level: 3,
    timeLimitSeconds: 150,
    requiredLoads: ['BULB_1'],
    requiredWires: [
      { from: 'CU_L', to: 'SW1_COM', type: 'L' },
      { from: 'SW1_L1', to: 'SW2_L1', type: 'L' },
      { from: 'SW1_L2', to: 'SW2_L2', type: 'L' },
      { from: 'SW2_COM', to: 'BULB_L', type: 'L' },
      { from: 'CU_N', to: 'BULB_N', type: 'N' },
      { from: 'CU_E', to: 'BULB_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_DP_ISOLATOR_AC',
    titleEn: '32A Double-Pole (DP) Isolator for Heavy Load',
    titleSinhala: 'වායු සමීකරණ (AC) සඳහා 32A ද්වි-ධ්‍රැව (DP) ස්විචය සවි කිරීම',
    descEn: 'Route both Live and Neutral through the 32A DP Isolator (L_IN/N_IN → L_OUT/N_OUT) to the 1800W AC Load, plus Earth.',
    descSinhala: 'ජීවී සහ උදාසීන කම්බි දෙකම 32A DP ස්විචය හරහා AC ඒකකයට සම්බන්ධ කර පෘථිවි කම්බිය සවි කරන්න.',
    level: 4,
    timeLimitSeconds: 120,
    requiredLoads: ['AC_LOAD'],
    requiredWires: [
      { from: 'CU_L', to: 'DP_L_IN', type: 'L' },
      { from: 'CU_N', to: 'DP_N_IN', type: 'N' },
      { from: 'DP_L_OUT', to: 'AC_L', type: 'L' },
      { from: 'DP_N_OUT', to: 'AC_N', type: 'N' },
      { from: 'CU_E', to: 'AC_E', type: 'E' },
    ],
  },
];

// Final Multi-Load Task (240 seconds / 4 minutes)
const FINAL_MECHSIM_TASK = {
  id: 'TASK_MECHSIM_WORKBENCH',
  titleEn: 'Final Task: Multi-Load Distribution via B16 MCB, L/N Connector Block & 2-Gang Controls',
  titleSinhala: 'අවසාන කාර්යය: L/N Connector Block සහ ස්විච් හරහා විදුලි පංකා සහ බල්බ් රැහැන්ගත කිරීම',
  descEn:
    'Feed CU (L,N) → B16 MCB (Lin,Nin) and (Lout,Nout) → L/N Block. From L-Block feed 1-Way SW (COM) and 2-Gang SW (L). Wire 1-Way L1 → Ceiling Fan (70W), 2-Gang L1 → Bulb (60W), 2-Gang L2 → Table Fan (50W). Return all Neutrals to N-Block & Earth CU_E → Ceiling Fan E.',
  descSinhala:
    'CU (L,N) සිට B16 MCB හරහා L/N Block වෙත විදුලිය දෙන්න. L-Block සිට 1-Way SW (COM) සහ 2-Gang SW (L) වෙත ජීවී කම්බි යොමු කර Ceiling Fan (70W), Bulb (60W), සහ Table Fan (50W) ක්‍රියාත්මක කරන්න.',
  level: 5,
  timeLimitSeconds: 240,
  requiredLoads: ['CEILING_FAN', 'BULB_LOAD', 'TABLE_FAN'],
  requiredWires: [
    { from: 'CU_L', to: 'MCB_LIN', type: 'L' },
    { from: 'CU_N', to: 'MCB_NIN', type: 'N' },
    { from: 'MCB_LOUT', to: 'BLK_L', type: 'L' },
    { from: 'MCB_NOUT', to: 'BLK_N', type: 'N' },
    { from: 'BLK_L', to: 'SW1_COM', type: 'L' },
    { from: 'BLK_L', to: 'G2_COM', type: 'L' },
    { from: 'SW1_L1', to: 'CFAN_L', type: 'L' },
    { from: 'G2_L1', to: 'BULB_L', type: 'L' },
    { from: 'G2_L2', to: 'TFAN_L', type: 'L' },
    { from: 'BLK_N', to: 'CFAN_N', type: 'N' },
    { from: 'BLK_N', to: 'BULB_N', type: 'N' },
    { from: 'BLK_N', to: 'TFAN_N', type: 'N' },
    { from: 'CU_E', to: 'CFAN_E', type: 'E' },
  ],
};

const LEVELS = {
  1: {
    terminals: [
      { id: 'CU_L', label: 'L', x: 140, y: 196, type: 'L' },
      { id: 'CU_N', label: 'N', x: 168, y: 196, type: 'N' },
      { id: 'CU_E', label: 'E', x: 196, y: 196, type: 'E' },
      { id: 'SW_COM', label: 'COM', x: 448, y: 308, type: 'L' },
      { id: 'SW_L1', label: 'L1', x: 504, y: 308, type: 'L' },
      { id: 'BULB_L', label: 'L', x: 728, y: 196, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 756, y: 196, type: 'N' },
      { id: 'BULB_E', label: 'E', x: 784, y: 196, type: 'E' },
    ],
  },
  2: {
    terminals: [
      { id: 'CU_L', label: 'L', x: 140, y: 196, type: 'L' },
      { id: 'CU_N', label: 'N', x: 168, y: 196, type: 'N' },
      { id: 'CU_E', label: 'E', x: 196, y: 196, type: 'E' },
      { id: 'SOCK_E', label: 'E (TOP)', x: 644, y: 168, type: 'E' },
      { id: 'SOCK_N', label: 'N (LEFT)', x: 588, y: 280, type: 'N' },
      { id: 'SOCK_L', label: 'L (RIGHT)', x: 700, y: 280, type: 'L' },
    ],
  },
  3: {
    terminals: [
      { id: 'CU_L', label: 'L', x: 140, y: 196, type: 'L' },
      { id: 'CU_N', label: 'N', x: 168, y: 196, type: 'N' },
      { id: 'CU_E', label: 'E', x: 196, y: 196, type: 'E' },
      { id: 'SW1_COM', label: 'COM', x: 336, y: 308, type: 'L' },
      { id: 'SW1_L1', label: 'L1', x: 364, y: 308, type: 'L' },
      { id: 'SW1_L2', label: 'L2', x: 392, y: 308, type: 'L' },
      { id: 'SW2_L1', label: 'L1', x: 532, y: 308, type: 'L' },
      { id: 'SW2_L2', label: 'L2', x: 560, y: 308, type: 'L' },
      { id: 'SW2_COM', label: 'COM', x: 588, y: 308, type: 'L' },
      { id: 'BULB_L', label: 'L', x: 756, y: 196, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 784, y: 196, type: 'N' },
      { id: 'BULB_E', label: 'E', x: 812, y: 196, type: 'E' },
    ],
  },
  4: {
    terminals: [
      { id: 'CU_L', label: 'L', x: 140, y: 196, type: 'L' },
      { id: 'CU_N', label: 'N', x: 168, y: 196, type: 'N' },
      { id: 'CU_E', label: 'E', x: 196, y: 196, type: 'E' },
      { id: 'DP_L_IN', label: 'L IN', x: 420, y: 196, type: 'L' },
      { id: 'DP_N_IN', label: 'N IN', x: 476, y: 196, type: 'N' },
      { id: 'DP_L_OUT', label: 'L OUT', x: 420, y: 308, type: 'L' },
      { id: 'DP_N_OUT', label: 'N OUT', x: 476, y: 308, type: 'N' },
      { id: 'AC_L', label: 'AC L', x: 728, y: 196, type: 'L' },
      { id: 'AC_N', label: 'AC N', x: 756, y: 196, type: 'N' },
      { id: 'AC_E', label: 'AC E', x: 784, y: 196, type: 'E' },
    ],
  },
  5: {
    terminals: [
      { id: 'CU_L', label: 'L', x: 140, y: 196, type: 'L' },
      { id: 'CU_N', label: 'N', x: 168, y: 196, type: 'N' },
      { id: 'CU_E', label: 'E', x: 196, y: 196, type: 'E' },

      { id: 'MCB_LIN', label: 'Lin', x: 168, y: 252, type: 'L' },
      { id: 'MCB_NIN', label: 'Nin', x: 196, y: 252, type: 'N' },
      { id: 'MCB_LOUT', label: 'Lout', x: 168, y: 364, type: 'L' },
      { id: 'MCB_NOUT', label: 'Nout', x: 196, y: 364, type: 'N' },

      { id: 'BLK_L1', label: 'L', x: 308, y: 392, type: 'L', busGroup: 'BLK_L' },
      { id: 'BLK_L2', label: '1', x: 336, y: 392, type: 'L', busGroup: 'BLK_L' },
      { id: 'BLK_L3', label: '2', x: 364, y: 392, type: 'L', busGroup: 'BLK_L' },
      { id: 'BLK_L4', label: '3', x: 392, y: 392, type: 'L', busGroup: 'BLK_L' },
      { id: 'BLK_N1', label: 'N', x: 308, y: 476, type: 'N', busGroup: 'BLK_N' },
      { id: 'BLK_N2', label: '1', x: 336, y: 476, type: 'N', busGroup: 'BLK_N' },
      { id: 'BLK_N3', label: '2', x: 364, y: 476, type: 'N', busGroup: 'BLK_N' },
      { id: 'BLK_N4', label: '3', x: 392, y: 476, type: 'N', busGroup: 'BLK_N' },

      { id: 'SW1_COM', label: 'COM', x: 532, y: 364, type: 'L' },
      { id: 'SW1_L1', label: 'L1', x: 588, y: 364, type: 'L' },

      { id: 'G2_COM', label: 'L', x: 700, y: 364, type: 'L' },
      { id: 'G2_L1', label: 'L1', x: 728, y: 364, type: 'L' },
      { id: 'G2_L2', label: 'L2', x: 756, y: 364, type: 'L' },

      { id: 'CFAN_L', label: 'L', x: 532, y: 168, type: 'L' },
      { id: 'CFAN_N', label: 'N', x: 560, y: 168, type: 'N' },
      { id: 'CFAN_E', label: 'E', x: 588, y: 168, type: 'E' },

      { id: 'BULB_L', label: 'L', x: 700, y: 168, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 728, y: 168, type: 'N' },

      { id: 'TFAN_L', label: 'L', x: 868, y: 168, type: 'L' },
      { id: 'TFAN_N', label: 'N', x: 896, y: 168, type: 'N' },
    ],
  },
};

export default function CircuitSimulator() {
  const [electricianId] = useState(1);
  const [isVerifiedProfile, setIsVerifiedProfile] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  const [taskQueue, setTaskQueue] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskResults, setTaskResults] = useState([]);
  const [isAssessmentFinished, setIsAssessmentFinished] = useState(false);

  const [assignedTask, setAssignedTask] = useState(PRELIMINARY_TASKS[0]);
  const [level, setLevel] = useState(1);
  const [selectedWireType, setSelectedWireType] = useState('L');
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [draftWaypoints, setDraftWaypoints] = useState([]);
  const [hoverPeg, setHoverPeg] = useState(null);
  const [wires, setWires] = useState([]);

  // Anti-cheat timer & tab-switch states
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);

  // Independent realistic hardware states
  const [cuMainOn, setCuMainOn] = useState(false);
  const [extMcbOn, setExtMcbOn] = useState(true);
  const [sw1On, setSw1On] = useState(true);
  const [sw2Pos, setSw2Pos] = useState(true);
  const [gang1On, setGang1On] = useState(true);
  const [gang2On, setGang2On] = useState(true);

  const [activeLoads, setActiveLoads] = useState({});
  const [wattage, setWattage] = useState(0);
  const [isShortCircuit, setIsShortCircuit] = useState(false);
  const [score, setScore] = useState(null);
  const [evaluationBreakdown, setEvaluationBreakdown] = useState(null);
  const [status, setStatus] = useState({
    type: 'info',
    text: 'Loading MechSimulator workbench...',
  });
  const [fanAngle, setFanAngle] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Esc key cancels active wire drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTerminal(null);
        setDraftWaypoints([]);
        setHoverPeg(null);
        setStatus({ type: 'info', text: 'Wire routing cancelled.' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Anti-cheat: Detect if user leaves tab/window to look up wiring diagrams
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isAssessmentFinished && !checkingVerification) {
        setTabSwitchWarnings((prev) => {
          const updated = prev + 1;
          setStatus({
            type: 'danger',
            text: `⚠️ ANTI-CHEAT WARNING (${updated}): Switching tabs is monitored! -5 pts penalty applied.`,
          });
          return updated;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAssessmentFinished, checkingVerification]);

  // Per-task countdown timer
  useEffect(() => {
    if (checkingVerification || !isVerifiedProfile || isAssessmentFinished || isTimeExpired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeExpired(true);
          setSelectedTerminal(null);
          setDraftWaypoints([]);
          setHoverPeg(null);
          setStatus({
            type: 'danger',
            text: '⏰ TIME UP! Workbench locked for this task. Click "Next Task ➔" to continue.',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkingVerification, isVerifiedProfile, isAssessmentFinished, isTimeExpired, currentTaskIndex]);

  useEffect(() => {
    async function checkVerificationStatus() {
      try {
        const res = await fetch(`http://localhost:5192/api/ElectricianProfile/status/${electricianId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasUploadedCertificates || data.verificationStatus === 'Approved') {
            setIsVerifiedProfile(true);
          }
        } else {
          setIsVerifiedProfile(true);
        }
      } catch {
        setIsVerifiedProfile(true);
      } finally {
        setCheckingVerification(false);
      }
    }

    const randomTwo = [...PRELIMINARY_TASKS].sort(() => Math.random() - 0.5).slice(0, 2);
    const fullQueue = [...randomTwo, FINAL_MECHSIM_TASK];

    setTaskQueue(fullQueue);
    setAssignedTask(fullQueue[0]);
    setLevel(fullQueue[0].level);
    setTimeLeft(fullQueue[0].timeLimitSeconds);
    setStatus({
      type: 'info',
      text: `Task 1 of ${fullQueue.length}: Complete the wiring before the timer runs out!`,
    });

    checkVerificationStatus();
  }, [electricianId]);

  const currentLevel = LEVELS[level];

  useEffect(() => {
    const anyFanRunning = activeLoads.CEILING_FAN || activeLoads.TABLE_FAN || activeLoads.AC_LOAD;
    if (!anyFanRunning) return;
    const timer = setInterval(() => {
      setFanAngle((prev) => (prev + 18) % 360);
    }, 45);
    return () => clearInterval(timer);
  }, [activeLoads]);

  useEffect(() => {
    runPhysicsSimulation();
  }, [wires, cuMainOn, extMcbOn, sw1On, sw2Pos, gang1On, gang2On, level, tabSwitchWarnings]);

  const normalizeNode = (id) => {
    if (id.startsWith('BLK_L')) return 'BLK_L';
    if (id.startsWith('BLK_N')) return 'BLK_N';
    return id;
  };

  const runPhysicsSimulation = () => {
    if (!cuMainOn) {
      setActiveLoads({});
      setWattage(0);
      setIsShortCircuit(false);
      return;
    }

    const adj = {};
    const addEdge = (a, b) => {
      const na = normalizeNode(a);
      const nb = normalizeNode(b);
      if (!adj[na]) adj[na] = [];
      if (!adj[nb]) adj[nb] = [];
      adj[na].push(nb);
      adj[nb].push(na);
    };

    wires.forEach((w) => addEdge(w.from.id, w.to.id));

    if (level === 1 && sw1On) addEdge('SW_COM', 'SW_L1');
    if (level === 2 && sw1On) addEdge('SOCK_L', 'SOCK_LOAD_L');
    if (level === 3) {
      addEdge('SW1_COM', sw1On ? 'SW1_L1' : 'SW1_L2');
      addEdge('SW2_COM', sw2Pos ? 'SW2_L1' : 'SW2_L2');
    }
    if (level === 4 && sw1On) {
      addEdge('DP_L_IN', 'DP_L_OUT');
      addEdge('DP_N_IN', 'DP_N_OUT');
    }
    if (level === 5) {
      if (extMcbOn) {
        addEdge('MCB_LIN', 'MCB_LOUT');
        addEdge('MCB_NIN', 'MCB_NOUT');
      }
      if (sw1On) addEdge('SW1_COM', 'SW1_L1');
      if (gang1On) addEdge('G2_COM', 'G2_L1');
      if (gang2On) addEdge('G2_COM', 'G2_L2');
    }

    const getReachable = (startNode) => {
      const visited = new Set();
      const queue = [startNode];
      while (queue.length > 0) {
        const curr = queue.shift();
        if (!visited.has(curr)) {
          visited.add(curr);
          (adj[curr] || []).forEach((next) => {
            if (!visited.has(next)) queue.push(next);
          });
        }
      }
      return visited;
    };

    const liveNodes = getReachable('CU_L');
    const neutralNodes = getReachable('CU_N');
    const earthNodes = getReachable('CU_E');

    if (liveNodes.has('CU_N') || liveNodes.has('CU_E')) {
      setCuMainOn(false);
      setExtMcbOn(false);
      setIsShortCircuit(true);
      setActiveLoads({});
      setWattage(0);
      setScore(0);
      setStatus({
        type: 'danger',
        text: '💥 MCB / RCD TRIPPED! Direct Short Circuit between Live and Neutral/Earth! Score: 0/100',
      });
      return;
    }

    const powered = {};
    let totalW = 0;

    if (level === 1 || level === 3) {
      if (liveNodes.has('BULB_L') && neutralNodes.has('BULB_N') && earthNodes.has('BULB_E')) {
        powered.BULB_1 = true;
        totalW += 60;
      }
    } else if (level === 2) {
      if (liveNodes.has('SOCK_LOAD_L') && neutralNodes.has('SOCK_N') && earthNodes.has('SOCK_E')) {
        powered.SOCKET_13A = true;
        totalW += 100;
      }
    } else if (level === 4) {
      if (liveNodes.has('AC_L') && neutralNodes.has('AC_N') && earthNodes.has('AC_E')) {
        powered.AC_LOAD = true;
        totalW += 1800;
      }
    } else if (level === 5) {
      if (liveNodes.has('CFAN_L') && neutralNodes.has('CFAN_N') && earthNodes.has('CFAN_E')) {
        powered.CEILING_FAN = true;
        totalW += 70;
      }
      if (liveNodes.has('BULB_L') && neutralNodes.has('BULB_N')) {
        powered.BULB_LOAD = true;
        totalW += 60;
      }
      if (liveNodes.has('TFAN_L') && neutralNodes.has('TFAN_N')) {
        powered.TABLE_FAN = true;
        totalW += 50;
      }
    }

    setActiveLoads(powered);
    setWattage(totalW);

    let matched = 0;
    let colorErrors = 0;

    assignedTask.requiredWires.forEach((req) => {
      const found = wires.find((w) => {
        const a = normalizeNode(w.from.id);
        const b = normalizeNode(w.to.id);
        return (a === req.from && b === req.to) || (a === req.to && b === req.from);
      });
      if (found) {
        if (found.wireType === req.type) matched++;
        else colorErrors++;
      }
    });

    const extraWires = Math.max(0, wires.length - assignedTask.requiredWires.length);
    const tabPenalty = tabSwitchWarnings * 5;
    let rawScore = (matched / assignedTask.requiredWires.length) * 80;
    if (colorErrors === 0 && matched > 0) rawScore += 20;
    rawScore = Math.max(0, Math.round(rawScore - extraWires * 10 - tabPenalty));

    setScore(rawScore);
    setEvaluationBreakdown({
      matched,
      total: assignedTask.requiredWires.length,
      colorErrors,
      extraWires,
      tabPenalty,
      passed: rawScore >= 75,
    });

    setStatus({
      type: rawScore >= 75 ? 'success' : 'info',
      text:
        rawScore >= 75
          ? `✅ CIRCUIT LIVE (${totalW} W | ${(totalW / 230).toFixed(1)} A)! Score: ${rawScore}/100. Click "Next Task ➔" before time expires.`
          : `⚡ Power ON (${totalW} W). Connections: ${matched}/${assignedTask.requiredWires.length} | Current Score: ${rawScore}/100.`,
    });
  };

  const handleTerminalClick = (terminal, e) => {
    if (e) e.cancelBubble = true;
    if (isTimeExpired) {
      setStatus({ type: 'danger', text: '⏰ Time has expired for this task! Click "Next Task ➔".' });
      return;
    }

    if (!selectedTerminal) {
      setSelectedTerminal(terminal);
      setDraftWaypoints([]);
      setStatus({
        type: 'info',
        text: `Started at [${terminal.label}]. Click black pegboard dots to bend cable, then click target terminal.`,
      });
      return;
    }

    if (selectedTerminal.id === terminal.id) {
      setSelectedTerminal(null);
      setDraftWaypoints([]);
      setHoverPeg(null);
      setStatus({ type: 'info', text: 'Terminal deselected.' });
      return;
    }

    const exists = wires.some(
      (w) =>
        (w.from.id === selectedTerminal.id && w.to.id === terminal.id) ||
        (w.from.id === terminal.id && w.to.id === selectedTerminal.id)
    );
    if (exists) {
      setSelectedTerminal(null);
      setDraftWaypoints([]);
      setHoverPeg(null);
      setStatus({ type: 'danger', text: 'Those two terminals are already connected!' });
      return;
    }

    setWires([
      ...wires,
      {
        id: `${selectedTerminal.id}_${terminal.id}`,
        from: selectedTerminal,
        to: terminal,
        waypoints: draftWaypoints,
        wireType: selectedWireType,
      },
    ]);
    setSelectedTerminal(null);
    setDraftWaypoints([]);
    setHoverPeg(null);
  };

  const handleStageMouseMove = (e) => {
    if (!selectedTerminal || isTimeExpired) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setHoverPeg({
      x: snapToPeg(pos.x),
      y: snapToPeg(pos.y),
    });
  };

  const handlePegboardClick = (e) => {
    if (!selectedTerminal || isTimeExpired) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const snapped = {
      x: snapToPeg(pos.x),
      y: snapToPeg(pos.y),
    };

    const lastNode =
      draftWaypoints.length > 0 ? draftWaypoints[draftWaypoints.length - 1] : selectedTerminal;

    const newPoints = [...draftWaypoints];
    if (Math.abs(lastNode.x - snapped.x) > 4 && Math.abs(lastNode.y - snapped.y) > 4) {
      newPoints.push({ x: snapped.x, y: lastNode.y });
    }
    newPoints.push(snapped);

    setDraftWaypoints(newPoints);
  };

  const handleUndoCorner = () => {
    if (isTimeExpired) return;
    if (draftWaypoints.length > 0) {
      setDraftWaypoints(draftWaypoints.slice(0, -1));
    } else {
      setSelectedTerminal(null);
      setHoverPeg(null);
    }
  };

  const handleRemoveWire = (id, e) => {
    if (e) e.cancelBubble = true;
    if (isTimeExpired) return;
    setWires(wires.filter((w) => w.id !== id));
  };

  const handleNextTask = () => {
    const finalTaskScore = score !== null ? score : 0;
    const timeUsed = assignedTask.timeLimitSeconds - timeLeft;

    const updatedResults = [
      ...taskResults,
      {
        taskId: assignedTask.id,
        titleEn: assignedTask.titleEn,
        score: finalTaskScore,
        timeUsedSeconds: timeUsed,
        timedOut: isTimeExpired && score === null,
        passed: finalTaskScore >= 75,
      },
    ];
    setTaskResults(updatedResults);

    const nextIdx = currentTaskIndex + 1;
    if (nextIdx < taskQueue.length) {
      const nextTask = taskQueue[nextIdx];
      setCurrentTaskIndex(nextIdx);
      setAssignedTask(nextTask);
      setLevel(nextTask.level);
      setTimeLeft(nextTask.timeLimitSeconds);
      setIsTimeExpired(false);
      setWires([]);
      setSelectedTerminal(null);
      setDraftWaypoints([]);
      setHoverPeg(null);
      setCuMainOn(false);
      setExtMcbOn(true);
      setSw1On(true);
      setGang1On(true);
      setGang2On(true);
      setActiveLoads({});
      setWattage(0);
      setScore(null);
      setEvaluationBreakdown(null);
      setStatus({
        type: 'info',
        text: `Task ${nextIdx + 1} of ${taskQueue.length}: ${nextTask.titleEn}`,
      });
    } else {
      setIsAssessmentFinished(true);
    }
  };

  const handleSubmitFinalScore = async (finalAverageScore) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5192/api/Simulator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electricianId,
          correctConnections: taskResults.filter((r) => r.passed).length,
          score: finalAverageScore,
          isPassed: finalAverageScore >= 75,
          taskId: taskResults.map((r) => r.taskId).join(','),
          configurationJson: JSON.stringify({
            tabSwitchWarnings,
            tasks: taskResults,
          }),
        }),
      });
      if (response.ok) {
        alert(`🎉 Overall Score (${finalAverageScore}/100) saved to your Electrician Profile!`);
      } else {
        alert('Score calculated, but server returned an error.');
      }
    } catch {
      alert('Network error saving final score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pegboardHoles = [];
  for (let gx = GRID_SIZE; gx < 960; gx += GRID_SIZE) {
    for (let gy = GRID_SIZE; gy < 500; gy += GRID_SIZE) {
      pegboardHoles.push(
        <Circle
          key={`${gx}-${gy}`}
          x={gx}
          y={gy}
          radius={selectedTerminal ? 3.2 : 2.2}
          fill={hoverPeg && hoverPeg.x === gx && hoverPeg.y === gy ? '#FACC15' : '#090D16'}
        />
      );
    }
  }

  let previewPoints = null;
  if (selectedTerminal && hoverPeg && !isTimeExpired) {
    previewPoints = buildWirePoints(selectedTerminal, hoverPeg, draftWaypoints, 0);
  }

  if (checkingVerification) {
    return (
      <div className="sim-page">
        <div className="sim-wrapper">Loading workbench...</div>
      </div>
    );
  }

  if (!isVerifiedProfile) {
    return (
      <div className="sim-page">
        <div className="sim-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>🔒 Certificate & Profile Locked</h2>
          <p>Please upload your electrician certificates before accessing the simulator.</p>
        </div>
      </div>
    );
  }

  if (isAssessmentFinished) {
    const averageScore = Math.round(
      taskResults.reduce((sum, item) => sum + item.score, 0) / taskResults.length
    );

    return (
      <div className="sim-page">
        <div className="sim-wrapper" style={{ maxWidth: '680px', margin: '40px auto', textAlign: 'center' }}>
          <h2>🏆 Practical Assessment Complete / ප්‍රායෝගික පරීක්ෂණය අවසන්</h2>
          <div className="space-y-3 text-left my-6">
            {taskResults.map((res, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-800 rounded-lg flex justify-between items-center border border-slate-700"
              >
                <div>
                  <strong>
                    {idx + 1}. {res.titleEn}
                  </strong>
                  <div className="text-xs text-slate-400 mt-1">
                    Time taken: {formatTimer(res.timeUsedSeconds)} {res.timedOut ? '(⏰ Timed Out)' : ''}
                  </div>
                </div>
                <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {res.score}/100 ({res.passed ? 'PASS' : 'FAIL'})
                </span>
              </div>
            ))}
          </div>
          {tabSwitchWarnings > 0 && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-sm mb-4">
              ⚠️ Anti-Cheat Log: {tabSwitchWarnings} tab switch(es) detected during assessment.
            </div>
          )}
          <div className="p-5 bg-slate-900 rounded-xl border border-amber-500/40 mb-6">
            <h3 className="text-2xl font-bold text-amber-400">Overall Score: {averageScore}/100</h3>
          </div>
          <button
            className="btn-submit-score"
            onClick={() => handleSubmitFinalScore(averageScore)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Final Results...' : '✓ Save Final Score to Profile'}
          </button>
        </div>
      </div>
    );
  }

  const currentAmps = (wattage / 230).toFixed(1);

  return (
    <div className="sim-page">
      <div className="sim-wrapper">
        {/* Header with Live Anti-Cheat Timer */}
        <div className="sim-header">
          <div className="sim-title-group">
            <h1>
              ⚡ ElectroSL Wiring Workbench (Task {currentTaskIndex + 1}/{taskQueue.length})
            </h1>
            <p className="task-title-en">
              <strong>{assignedTask.titleEn}</strong>
            </p>
            <p className="task-title-si text-amber-400">{assignedTask.titleSinhala}</p>
            <p className="task-desc">{assignedTask.descEn}</p>
          </div>
          <div className="sim-header-stats" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Countdown Timer Badge */}
            <div
              style={{
                backgroundColor: timeLeft <= 30 ? '#991B1B' : '#1E293B',
                border: `2px solid ${timeLeft <= 30 ? '#EF4444' : '#F59E0B'}`,
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                minWidth: '125px',
                textAlign: 'center',
              }}
            >
              ⏱️ {formatTimer(timeLeft)}
            </div>

            {score !== null && (
              <div className={`sim-score-pill ${score < 75 ? 'fail' : ''}`}>
                Score: {score}/100
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="sim-toolbar">
          <div className="sim-wire-selector">
            <span className="sim-wire-label">ADD WIRE:</span>
            {Object.entries(WIRE_STYLES).map(([key, style]) => (
              <button
                key={key}
                disabled={isTimeExpired}
                onClick={() => setSelectedWireType(key)}
                className={`wire-btn ${selectedWireType === key ? 'selected' : ''}`}
                style={{ backgroundColor: style.outer, opacity: isTimeExpired ? 0.5 : 1 }}
              >
                <span className="wire-swatch" style={{ backgroundColor: style.inner }} />
                {style.name}
              </button>
            ))}
          </div>
          <div className="sim-actions">
            {selectedTerminal && !isTimeExpired && (
              <button className="btn-clear" onClick={handleUndoCorner}>
                ↩ Undo Corner / Cancel
              </button>
            )}
            <button
              className="btn-clear"
              disabled={isTimeExpired}
              onClick={() => {
                setWires([]);
                setSelectedTerminal(null);
                setDraftWaypoints([]);
              }}
            >
              Clear Wires
            </button>
            <button
              className="btn-test"
              disabled={isTimeExpired}
              onClick={() => setCuMainOn(!cuMainOn)}
            >
              {cuMainOn ? '🔴 Turn MAIN OFF' : '🟢 Turn MAIN ON'}
            </button>
            <button
              className="btn-submit-score"
              style={{
                backgroundColor:
                  isTimeExpired ? '#DC2626' : score !== null && score >= 75 ? '#16A34A' : '#2563EB',
                color: '#FFFFFF',
                fontWeight: 'bold',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={handleNextTask}
            >
              {currentTaskIndex + 1 < taskQueue.length ? 'Next Task ➔' : '✓ Finish & View Results'}
            </button>
          </div>
        </div>

        <div className={`sim-status ${status.type}`}>{status.text}</div>

        {/* MechSimulator Dark Pegboard Canvas */}
        <div
          className="sim-canvas-box"
          onContextMenu={(e) => {
            e.preventDefault();
            setSelectedTerminal(null);
            setDraftWaypoints([]);
            setHoverPeg(null);
          }}
        >
          <Stage
            width={960}
            height={500}
            onMouseMove={handleStageMouseMove}
            onClick={handlePegboardClick}
          >
            <Layer>
              <Rect x={0} y={0} width={960} height={500} fill="#1B2230" cornerRadius={12} />
              {pegboardHoles}

              {/* ================= 1. MECHSIMULATOR CONSUMER UNIT ================= */}
              <Group x={85} y={40}>
                <Rect
                  width={175}
                  height={138}
                  fill="#F1F5F9"
                  stroke="#94A3B8"
                  strokeWidth={3}
                  cornerRadius={8}
                  shadowColor="#000"
                  shadowBlur={12}
                  shadowOpacity={0.4}
                />
                <Rect x={12} y={12} width={151} height={42} fill="#062E1E" stroke="#475569" strokeWidth={2} cornerRadius={4} />
                <Text
                  text={cuMainOn ? `${wattage} W` : '0 W'}
                  x={58}
                  y={16}
                  fill="#4ADE80"
                  fontSize={15}
                  fontStyle="bold"
                />
                <Text
                  text={cuMainOn ? '230 V' : '0 V'}
                  x={18}
                  y={36}
                  fill="#22C55E"
                  fontSize={11}
                  fontStyle="bold"
                />
                <Text
                  text={cuMainOn ? `${currentAmps} A` : '0.0 A'}
                  x={118}
                  y={36}
                  fill="#22C55E"
                  fontSize={11}
                  fontStyle="bold"
                />

                <Group
                  x={14}
                  y={62}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (!isTimeExpired) setCuMainOn(!cuMainOn);
                  }}
                >
                  <Rect width={147} height={62} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={1.5} cornerRadius={4} />
                  <Text text="MAIN       B32        RCD" x={12} y={6} fill="#334155" fontSize={9} fontStyle="bold" />
                  <Rect x={14} y={20} width={22} height={32} fill="#1E293B" cornerRadius={3} />
                  <Rect x={16} y={cuMainOn ? 22 : 36} width={18} height={14} fill={cuMainOn ? '#EF4444' : '#22C55E'} cornerRadius={2} />
                  <Rect x={62} y={20} width={20} height={32} fill="#1E293B" cornerRadius={3} />
                  <Rect x={64} y={cuMainOn ? 22 : 36} width={16} height={14} fill={cuMainOn ? '#EF4444' : '#3B82F6'} cornerRadius={2} />
                  <Rect x={108} y={20} width={24} height={32} fill="#1E293B" cornerRadius={3} />
                  <Rect x={110} y={cuMainOn ? 22 : 36} width={20} height={14} fill={cuMainOn ? '#3B82F6' : '#64748B'} cornerRadius={2} />
                </Group>

                {isShortCircuit && (
                  <Group x={88} y={70}>
                    <Circle radius={32} fill="#EF4444" opacity={0.9} />
                    <Text text="TRIP!" x={-18} y={-6} fill="#FFFFFF" fontSize={13} fontStyle="bold" />
                  </Group>
                )}
              </Group>

              {/* ================= LEVEL 5: MECHSIMULATOR MULTI-LOAD WORKBENCH ================= */}
              {level === 5 && (
                <>
                  <Group
                    x={148}
                    y={260}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (!isTimeExpired) setExtMcbOn(!extMcbOn);
                    }}
                  >
                    <Rect width={68} height={92} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                    <Rect x={34} y={0} width={34} height={92} fill="#DBEAFE" cornerRadius={6} />
                    <Text text="B16" x={8} y={12} fill="#1E293B" fontSize={10} fontStyle="bold" />
                    <Text text="LINK" x={40} y={12} fill="#1E3A8A" fontSize={9} fontStyle="bold" />
                    <Rect x={9} y={30} width={18} height={34} fill="#1E293B" cornerRadius={3} />
                    <Rect x={11} y={extMcbOn ? 32 : 48} width={14} height={14} fill={extMcbOn ? '#EF4444' : '#22C55E'} />
                    <Rect x={42} y={34} width={18} height={26} fill="#2563EB" cornerRadius={3} />
                    <Text text="N" x={47} y={41} fill="#FFFFFF" fontSize={11} fontStyle="bold" />
                  </Group>

                  <Group x={285} y={398}>
                    <Rect width={135} height={70} fill="#1E293B" stroke="#475569" strokeWidth={2} cornerRadius={8} />
                    <Line points={[15, 20, 120, 20]} stroke="#EA580C" strokeWidth={3} />
                    <Text text="L / N BLOCK" x={36} y={29} fill="#CBD5E1" fontSize={10} fontStyle="bold" />
                    <Line points={[15, 50, 120, 50]} stroke="#3B82F6" strokeWidth={3} />
                  </Group>

                  <Group
                    x={522}
                    y={245}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSw1On(!sw1On);
                    }}
                  >
                    <Rect width={76} height={98} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={8} />
                    <Rect
                      x={22}
                      y={20}
                      width={32}
                      height={44}
                      fill={sw1On ? '#E2E8F0' : '#CBD5E1'}
                      stroke="#94A3B8"
                      strokeWidth={1.5}
                      cornerRadius={4}
                    />
                    <Circle x={38} y={42} radius={3.5} fill={sw1On ? '#22C55E' : '#94A3B8'} />
                    <Text text={sw1On ? 'ON' : 'OFF'} x={28} y={72} fill="#334155" fontSize={10} fontStyle="bold" />
                  </Group>

                  <Group x={675} y={245}>
                    <Rect width={115} height={98} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={8} />
                    <Group
                      x={22}
                      y={18}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setGang1On(!gang1On);
                      }}
                    >
                      <Rect
                        width={28}
                        height={46}
                        fill={gang1On ? '#E2E8F0' : '#CBD5E1'}
                        stroke="#94A3B8"
                        strokeWidth={1.5}
                        cornerRadius={4}
                      />
                      <Circle x={14} y={23} radius={3} fill={gang1On ? '#22C55E' : '#94A3B8'} />
                      <Text text="1" x={11} y={50} fill="#475569" fontSize={9} fontStyle="bold" />
                    </Group>
                    <Group
                      x={64}
                      y={18}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setGang2On(!gang2On);
                      }}
                    >
                      <Rect
                        width={28}
                        height={46}
                        fill={gang2On ? '#E2E8F0' : '#CBD5E1'}
                        stroke="#94A3B8"
                        strokeWidth={1.5}
                        cornerRadius={4}
                      />
                      <Circle x={14} y={23} radius={3} fill={gang2On ? '#22C55E' : '#94A3B8'} />
                      <Text text="2" x={11} y={50} fill="#475569" fontSize={9} fontStyle="bold" />
                    </Group>
                    <Text text="2-GANG" x={36} y={80} fill="#334155" fontSize={10} fontStyle="bold" />
                  </Group>

                  <Group x={515} y={32}>
                    <Rect x={10} y={0} width={70} height={28} fill="#0F172A" cornerRadius={6} />
                    <Text text="Ceiling Fan" x={17} y={4} fill="#F8FAFC" fontSize={10} fontStyle="bold" />
                    <Text text="70 W" x={32} y={16} fill="#94A3B8" fontSize={9} />
                    <Circle x={45} y={78} radius={42} fill="#451A03" opacity={0.45} />
                    <Group x={45} y={78} rotation={activeLoads.CEILING_FAN ? fanAngle : 0}>
                      <Rect x={-8} y={-36} width={16} height={26} fill="#B45309" cornerRadius={6} />
                      <Rect x={-34} y={8} width={26} height={14} fill="#B45309" cornerRadius={6} />
                      <Rect x={10} y={8} width={26} height={14} fill="#B45309" cornerRadius={6} />
                    </Group>
                    <Circle x={45} y={78} radius={13} fill="#94A3B8" stroke="#475569" strokeWidth={2} />
                  </Group>

                  <Group x={682} y={32}>
                    <Rect x={5} y={0} width={55} height={28} fill="#0F172A" cornerRadius={6} />
                    <Text text="Bulb" x={21} y={4} fill="#F8FAFC" fontSize={10} fontStyle="bold" />
                    <Text text="60 W" x={20} y={16} fill="#94A3B8" fontSize={9} />
                    {activeLoads.BULB_LOAD && (
                      <Circle x={32} y={72} radius={40} fill="#FEF08A" opacity={0.45} />
                    )}
                    <Circle
                      x={32}
                      y={70}
                      radius={22}
                      fill={activeLoads.BULB_LOAD ? '#FACC15' : '#E2E8F0'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                    />
                    <Rect x={22} y={90} width={20} height={16} fill="#CBD5E1" cornerRadius={3} />
                  </Group>

                  <Group x={840} y={32}>
                    <Rect x={8} y={0} width={68} height={28} fill="#0F172A" cornerRadius={6} />
                    <Text text="Table Fan" x={18} y={4} fill="#F8FAFC" fontSize={10} fontStyle="bold" />
                    <Text text="50 W" x={30} y={16} fill="#94A3B8" fontSize={9} />
                    <Circle x={42} y={70} radius={30} fill="#1E293B" stroke="#94A3B8" strokeWidth={3} />
                    <Group x={42} y={70} rotation={activeLoads.TABLE_FAN ? fanAngle * 1.4 : 0}>
                      <Rect x={-5} y={-24} width={10} height={20} fill="#60A5FA" cornerRadius={4} />
                      <Rect x={-22} y={6} width={18} height={10} fill="#60A5FA" cornerRadius={4} />
                      <Rect x={6} y={6} width={18} height={10} fill="#60A5FA" cornerRadius={4} />
                    </Group>
                    <Circle x={42} y={70} radius={6} fill="#E2E8F0" />
                    <Rect x={5} y={106} width={74} height={8} fill="#B45309" cornerRadius={3} />
                  </Group>
                </>
              )}

              {/* ================= LEVELS 1, 2, 3, 4 HARDWARE ================= */}
              {level === 1 && (
                <Group
                  x={425}
                  y={180}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSw1On(!sw1On);
                  }}
                >
                  <Rect width={100} height={105} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={10} />
                  <Text text="1-WAY SW" x={22} y={12} fill="#334155" fontSize={10} fontStyle="bold" />
                  <Rect x={32} y={32} width={36} height={46} fill={sw1On ? '#E2E8F0' : '#CBD5E1'} stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                  <Circle x={50} y={55} radius={4} fill={sw1On ? '#22C55E' : '#64748B'} />
                  <Text text={sw1On ? 'ON' : 'OFF'} x={39} y={84} fill="#0F294A" fontSize={11} fontStyle="bold" />
                </Group>
              )}

              {level === 3 && (
                <>
                  <Group
                    x={314}
                    y={180}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSw1On(!sw1On);
                    }}
                  >
                    <Rect width={100} height={105} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={10} />
                    <Text text="2-WAY SW 1" x={18} y={12} fill="#334155" fontSize={10} fontStyle="bold" />
                    <Rect x={30} y={35} width={40} height={45} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                    <Text text={sw1On ? 'L1' : 'L2'} x={43} y={52} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  </Group>

                  <Group
                    x={510}
                    y={180}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSw2Pos(!sw2Pos);
                    }}
                  >
                    <Rect width={100} height={105} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={10} />
                    <Text text="2-WAY SW 2" x={18} y={12} fill="#334155" fontSize={10} fontStyle="bold" />
                    <Rect x={30} y={35} width={40} height={45} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                    <Text text={sw2Pos ? 'L1' : 'L2'} x={43} y={52} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  </Group>
                </>
              )}

              {(level === 1 || level === 3) && (
                <Group x={720} y={50}>
                  <Text text="Bulb (60 W)" x={5} y={0} fill="#F8FAFC" fontSize={11} fontStyle="bold" />
                  {activeLoads.BULB_1 && <Circle x={35} y={68} radius={48} fill="#FEF08A" opacity={0.45} />}
                  <Circle x={35} y={68} radius={28} fill={activeLoads.BULB_1 ? '#FACC15' : '#E2E8F0'} stroke="#94A3B8" strokeWidth={2} />
                  <Rect x={23} y={94} width={24} height={20} fill="#CBD5E1" cornerRadius={4} />
                </Group>
              )}

              {level === 2 && (
                <Group x={535} y={110}>
                  <Rect width={210} height={145} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={3} cornerRadius={12} />
                  <Text text="13A SWITCHED SOCKET" x={38} y={14} fill="#0F294A" fontSize={11} fontStyle="bold" />
                  <Group
                    x={150}
                    y={38}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSw1On(!sw1On);
                    }}
                  >
                    <Rect width={36} height={44} fill={sw1On ? '#E2E8F0' : '#CBD5E1'} stroke="#94A3B8" strokeWidth={2} cornerRadius={4} />
                    <Rect x={10} y={6} width={16} height={5} fill={sw1On ? '#EF4444' : '#64748B'} />
                    <Text text={sw1On ? 'ON' : 'OFF'} x={8} y={22} fill="#0F294A" fontSize={10} fontStyle="bold" />
                  </Group>
                  <Rect x={98} y={52} width={10} height={20} fill="#1E293B" />
                  <Rect x={62} y={95} width={20} height={10} fill="#1E293B" />
                  <Rect x={122} y={95} width={20} height={10} fill="#1E293B" />
                  <Circle x={103} y={125} radius={6} fill={activeLoads.SOCKET_13A ? '#22C55E' : '#CBD5E1'} />
                </Group>
              )}

              {level === 4 && (
                <>
                  <Group
                    x={395}
                    y={195}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSw1On(!sw1On);
                    }}
                  >
                    <Rect width={105} height={95} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={10} />
                    <Text text="32A DP SW" x={22} y={10} fill="#DC2626" fontSize={10} fontStyle="bold" />
                    <Rect x={28} y={28} width={48} height={48} fill={sw1On ? '#EF4444' : '#CBD5E1'} cornerRadius={6} />
                    <Text text={sw1On ? 'ON' : 'OFF'} x={40} y={47} fill="#FFFFFF" fontSize={11} fontStyle="bold" />
                  </Group>

                  <Group x={700} y={60}>
                    <Rect width={125} height={115} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={2} cornerRadius={10} />
                    <Text text="AC UNIT (1800W)" x={16} y={10} fill="#0F294A" fontSize={10} fontStyle="bold" />
                    <Circle x={62} y={64} radius={30} fill="#1E293B" />
                    <Group x={62} y={64} rotation={activeLoads.AC_LOAD ? fanAngle : 0}>
                      <Rect x={-5} y={-24} width={10} height={48} fill="#38BDF8" cornerRadius={4} />
                      <Rect x={-24} y={-5} width={48} height={10} fill="#38BDF8" cornerRadius={4} />
                    </Group>
                  </Group>
                </>
              )}

              {/* ================= ROUTED CABLES ================= */}
              {wires.map((wire, idx) => {
                const style = WIRE_STYLES[wire.wireType];
                const pts = buildWirePoints(wire.from, wire.to, wire.waypoints, idx);

                return (
                  <Group
                    key={wire.id}
                    onClick={(e) => handleRemoveWire(wire.id, e)}
                    onMouseEnter={(e) => {
                      e.target.getStage().container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.getStage().container().style.cursor = 'default';
                    }}
                  >
                    <Line
                      points={pts}
                      stroke="#000000"
                      strokeWidth={8}
                      opacity={0.4}
                      lineCap="round"
                      lineJoin="round"
                    />
                    <Line
                      points={pts}
                      stroke={style.outer}
                      strokeWidth={6}
                      lineCap="round"
                      lineJoin="round"
                    />
                    <Line
                      points={pts}
                      stroke={style.inner}
                      strokeWidth={2.5}
                      dash={wire.wireType === 'E' ? [8, 8] : undefined}
                      lineCap="round"
                      lineJoin="round"
                    />
                    {(wire.waypoints || []).map((wp, wIdx) => (
                      <Circle
                        key={wIdx}
                        x={wp.x}
                        y={wp.y}
                        radius={3.5}
                        fill="#0F172A"
                        stroke={style.inner}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Group>
                );
              })}

              {/* ================= LIVE INTERACTIVE DRAFT WIRE PREVIEW ================= */}
              {previewPoints && (
                <Group listening={false}>
                  <Line
                    points={previewPoints}
                    stroke={WIRE_STYLES[selectedWireType].inner}
                    strokeWidth={4}
                    dash={[6, 6]}
                    lineCap="round"
                    lineJoin="round"
                  />
                  {draftWaypoints.map((wp, idx) => (
                    <Circle
                      key={idx}
                      x={wp.x}
                      y={wp.y}
                      radius={4.5}
                      fill="#FACC15"
                      stroke="#0F172A"
                      strokeWidth={1.5}
                    />
                  ))}
                </Group>
              )}

              {/* ================= COLOR-CODED TERMINALS ================= */}
              {currentLevel.terminals.map((term) => {
                const isSelected = selectedTerminal?.id === term.id;
                const ringColor =
                  term.type === 'L' ? '#EA580C' : term.type === 'N' ? '#3B82F6' : '#22C55E';

                return (
                  <Group
                    key={term.id}
                    x={term.x}
                    y={term.y}
                    onClick={(e) => handleTerminalClick(term, e)}
                    onMouseEnter={(e) => {
                      e.target.getStage().container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.getStage().container().style.cursor = 'default';
                    }}
                  >
                    {isSelected && <Circle radius={13} fill="#FACC15" opacity={0.45} />}
                    <Circle
                      radius={7}
                      fill="#1E293B"
                      stroke={isSelected ? '#FACC15' : ringColor}
                      strokeWidth={2.5}
                    />
                    <Circle radius={2.5} fill="#CBD5E1" />
                    <Rect x={-18} y={-22} width={36} height={12} fill="#0F172A" cornerRadius={3} opacity={0.9} />
                    <Text
                      text={term.label}
                      x={-18}
                      y={-20}
                      width={36}
                      align="center"
                      fill="#F8FAFC"
                      fontSize={8}
                      fontStyle="bold"
                    />
                  </Group>
                );
              })}

              {/* Time Expired Lock Overlay */}
              {isTimeExpired && (
                <Group>
                  <Rect x={0} y={0} width={960} height={500} fill="#090D16" opacity={0.75} cornerRadius={12} />
                  <Text
                    text="⏰ TIME EXPIRED FOR THIS TASK"
                    x={280}
                    y={220}
                    fill="#EF4444"
                    fontSize={24}
                    fontStyle="bold"
                  />
                  <Text
                    text='Click "Next Task ➔" in the toolbar above to continue.'
                    x={310}
                    y={260}
                    fill="#F8FAFC"
                    fontSize={15}
                  />
                </Group>
              )}
            </Layer>
          </Stage>
        </div>

        {/* Breakdown Panel */}
        {evaluationBreakdown && (
          <div className="sim-breakdown-box">
            <h3>📋 Real-Time Circuit Diagnostics</h3>
            <p>
              Required Connections:{' '}
              <strong>
                {evaluationBreakdown.matched} / {evaluationBreakdown.total}
              </strong>{' '}
              | Active Load: <strong>{wattage} W ({currentAmps} A)</strong>
            </p>
            <p>
              IEC Color Mismatches: <strong>{evaluationBreakdown.colorErrors}</strong> | Extra Wires:{' '}
              <strong>{evaluationBreakdown.extraWires}</strong> | Tab-Switch Penalty:{' '}
              <strong>-{evaluationBreakdown.tabPenalty} pts</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}