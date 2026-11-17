import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arc } from 'react-konva';
import './CircuitSimulator.css';

const WIRE_STYLES = {
  L: { name: 'Live (Brown) / ජීවී', color: '#9A3412', highlight: '#EA580C' },
  N: { name: 'Neutral (Blue) / උදාසීන', color: '#1D4ED8', highlight: '#60A5FA' },
  E: { name: 'Earth (Green/Yellow) / පෘථිවි', color: '#15803D', highlight: '#FACC15' },
};

const TASK_BANK = [
  {
    id: 'TASK_LIGHT_SINGLE',
    titleEn: 'Task 1: Single-Way Lighting & Earth Bonding',
    titleSinhala: 'කාර්යය 1: ආලෝකකරණ පරිපථය සහ පෘථිවි සම්බන්ධතාව',
    descEn: 'Connect Live through MCB and Wall Switch (COM → L1) to Bulb L. Connect Neutral and Earth securely.',
    descSinhala: 'MCB සහ බිත්ති ස්විචය (COM → L1) හරහා බල්බ් L වෙත ජීවී කම්බිය සම්බන්ධ කරන්න. උදාසීන සහ පෘථිවි කම්බි නිවැරදිව සවි කරන්න.',
    level: 1,
    requiredWires: [
      { from: 'MAIN_L', to: 'SW_COM', type: 'L' },
      { from: 'SW_L1', to: 'BULB_L', type: 'L' },
      { from: 'MAIN_N', to: 'BULB_N', type: 'N' },
      { from: 'MAIN_E', to: 'BULB_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_SOCKET_13A',
    titleEn: 'Task 2: 13A Switched Socket Outlet Polarity Wiring',
    titleSinhala: 'කාර්යය 2: 13A ස්විච් සොකට් අලෙවිසැල් රැහැන්ගත කිරීම',
    descEn: 'Wire directly from MCB to the 13A Switched Socket: Live to L (Right), Neutral to N (Left), Earth to E (Top).',
    descSinhala: 'MCB සිට 13A සොකට් එකට කෙලින්ම කම්බි සම්බන්ධ කරන්න: දකුණට ජීවී (L), වමට උදාසීන (N), ඉහළට පෘථිවි (E).',
    level: 2,
    requiredWires: [
      { from: 'MAIN_L', to: 'SOCK_L', type: 'L' },
      { from: 'MAIN_N', to: 'SOCK_N', type: 'N' },
      { from: 'MAIN_E', to: 'SOCK_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_TWO_WAY_STAIRCASE',
    titleEn: 'Task 3: Two-Way Staircase Lighting Control',
    titleSinhala: 'කාර්යය 3: පඩිපෙළ ආලෝක පාලනය (Two-Way Switching)',
    descEn: 'Connect MCB Live to Switch 1 COM. Bridge L1-to-L1 and L2-to-L2 strappers between switches, then Switch 2 COM to Bulb L.',
    descSinhala: 'MCB ජීවී කම්බිය පළමු ස්විචයේ COM වෙත ද, L1 සහ L2 ස්විච් දෙක අතර ද සම්බන්ධ කර දෙවන ස්විචයේ COM සිට බල්බයට සම්බන්ධ කරන්න.',
    level: 3,
    requiredWires: [
      { from: 'MAIN_L', to: 'SW1_COM', type: 'L' },
      { from: 'SW1_L1', to: 'SW2_L1', type: 'L' },
      { from: 'SW1_L2', to: 'SW2_L2', type: 'L' },
      { from: 'SW2_COM', to: 'BULB_L', type: 'L' },
      { from: 'MAIN_N', to: 'BULB_N', type: 'N' },
      { from: 'MAIN_E', to: 'BULB_E', type: 'E' },
    ],
  },
  {
    id: 'TASK_DP_ISOLATOR_AC',
    titleEn: 'Task 4: Double-Pole (DP) Isolator for Heavy AC Load',
    titleSinhala: 'කාර්යය 4: වායු සමීකරණ (AC) සඳහා ද්වි-ධ්‍රැව (DP) ස්විචය සවි කිරීම',
    descEn: 'Route both Live and Neutral through the 32A Double-Pole Isolator before feeding the AC Unit, plus direct Earth bonding.',
    descSinhala: 'AC ඒකකයට විදුලිය දීමට පෙර ජීවී සහ උදාසීන කම්බි දෙකම 32A DP ස්විචය හරහා සම්බන්ධ කර පෘථිවි කම්බිය සවි කරන්න.',
    level: 4,
    requiredWires: [
      { from: 'MAIN_L', to: 'DP_L_IN', type: 'L' },
      { from: 'MAIN_N', to: 'DP_N_IN', type: 'N' },
      { from: 'DP_L_OUT', to: 'AC_L', type: 'L' },
      { from: 'DP_N_OUT', to: 'AC_N', type: 'N' },
      { from: 'MAIN_E', to: 'AC_E', type: 'E' },
    ],
  },
];

const LEVELS = {
  1: {
    title: 'Level 1: Domestic Wall Switch & Lighting',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },
      { id: 'SW_COM', label: 'COM', x: 430, y: 155, type: 'L' },
      { id: 'SW_L1', label: 'L1', x: 520, y: 155, type: 'L' },
      { id: 'BULB_L', label: 'L', x: 765, y: 145, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 765, y: 235, type: 'N' },
      { id: 'BULB_E', label: 'EARTH', x: 765, y: 325, type: 'E' },
    ],
  },
  2: {
    title: 'Level 2: Sri Lankan 13A Switched Socket Outlet',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },
      // Direct terminals on the 13A Switched Socket (No separate wall switch)
      { id: 'SOCK_E', label: 'E (TOP)', x: 650, y: 145, type: 'E' },
      { id: 'SOCK_N', label: 'N (LEFT)', x: 590, y: 245, type: 'N' },
      { id: 'SOCK_L', label: 'L (RIGHT)', x: 710, y: 245, type: 'L' },
    ],
  },
  3: {
    title: 'Level 3: Two-Way Staircase Switching',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },
      { id: 'SW1_COM', label: 'S1 COM', x: 310, y: 155, type: 'L' },
      { id: 'SW1_L1', label: 'S1 L1', x: 375, y: 130, type: 'L' },
      { id: 'SW1_L2', label: 'S1 L2', x: 375, y: 185, type: 'L' },
      { id: 'SW2_L1', label: 'S2 L1', x: 515, y: 130, type: 'L' },
      { id: 'SW2_L2', label: 'S2 L2', x: 515, y: 185, type: 'L' },
      { id: 'SW2_COM', label: 'S2 COM', x: 580, y: 155, type: 'L' },
      { id: 'BULB_L', label: 'L', x: 765, y: 145, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 765, y: 235, type: 'N' },
      { id: 'BULB_E', label: 'EARTH', x: 765, y: 325, type: 'E' },
    ],
  },
  4: {
    title: 'Level 4: 32A Double-Pole (DP) Isolator',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },
      { id: 'DP_L_IN', label: 'L IN', x: 420, y: 145, type: 'L' },
      { id: 'DP_N_IN', label: 'N IN', x: 420, y: 235, type: 'N' },
      { id: 'DP_L_OUT', label: 'L OUT', x: 530, y: 145, type: 'L' },
      { id: 'DP_N_OUT', label: 'N OUT', x: 530, y: 235, type: 'N' },
      { id: 'AC_L', label: 'AC L', x: 765, y: 145, type: 'L' },
      { id: 'AC_N', label: 'AC N', x: 765, y: 235, type: 'N' },
      { id: 'AC_E', label: 'AC E', x: 765, y: 325, type: 'E' },
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

  const [assignedTask, setAssignedTask] = useState(TASK_BANK[0]);
  const [level, setLevel] = useState(1);
  const [selectedWireType, setSelectedWireType] = useState('L');
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [wires, setWires] = useState([]);
  const [isBreakerOn, setIsBreakerOn] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(true);
  const [isPowered, setIsPowered] = useState(false);
  const [isShortCircuit, setIsShortCircuit] = useState(false);
  const [score, setScore] = useState(null);
  const [evaluationBreakdown, setEvaluationBreakdown] = useState(null);
  const [status, setStatus] = useState({
    type: 'info',
    text: 'Loading assigned randomized tasks...',
  });
  const [pulseOffset, setPulseOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const shuffled = [...TASK_BANK].sort(() => Math.random() - 0.5).slice(0, 3);
    setTaskQueue(shuffled);
    setAssignedTask(shuffled[0]);
    setLevel(shuffled[0].level);
    setStatus({
      type: 'info',
      text: `Task 1 of ${shuffled.length}: ${shuffled[0].titleEn} / ${shuffled[0].titleSinhala}`,
    });

    checkVerificationStatus();
  }, [electricianId]);

  const currentLevel = LEVELS[level];

  useEffect(() => {
    if (!isPowered) return;
    const interval = setInterval(() => {
      setPulseOffset((prev) => (prev + 4) % 40);
    }, 50);
    return () => clearInterval(interval);
  }, [isPowered]);

  const handleTerminalClick = (terminal) => {
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);

    if (!selectedTerminal) {
      setSelectedTerminal(terminal);
      setStatus({
        type: 'info',
        text: `Terminal [${terminal.label}] selected. Click target screw terminal.`,
      });
      return;
    }

    if (selectedTerminal.id === terminal.id) {
      setSelectedTerminal(null);
      setStatus({ type: 'info', text: 'Terminal deselected.' });
      return;
    }

    const alreadyConnected = wires.some(
      (w) =>
        (w.from.id === selectedTerminal.id && w.to.id === terminal.id) ||
        (w.from.id === terminal.id && w.to.id === selectedTerminal.id)
    );

    if (alreadyConnected) {
      setStatus({ type: 'danger', text: 'Terminals already connected!' });
      setSelectedTerminal(null);
      return;
    }

    const newWire = {
      id: `${selectedTerminal.id}_${terminal.id}`,
      from: selectedTerminal,
      to: terminal,
      wireType: selectedWireType,
    };
    setWires([...wires, newWire]);
    setSelectedTerminal(null);
    setStatus({
      type: 'info',
      text: `Connected [${selectedTerminal.label}] → [${terminal.label}] with ${WIRE_STYLES[selectedWireType].name}.`,
    });
  };

  const handleRemoveWire = (id) => {
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);
    setWires(wires.filter((w) => w.id !== id));
    setStatus({ type: 'info', text: 'Wire removed.' });
  };

  const findWire = (id1, id2) =>
    wires.find(
      (w) => (w.from.id === id1 && w.to.id === id2) || (w.from.id === id2 && w.to.id === id1)
    );

  const evaluateCircuit = (breakerState, switchState) => {
    if (!breakerState) {
      setIsPowered(false);
      setIsShortCircuit(false);
      setStatus({ type: 'info', text: 'MCB is OFF. Flip MCB ON to test circuit.' });
      return;
    }

    if (
      findWire('MAIN_L', 'MAIN_N') ||
      findWire('MAIN_L', 'MAIN_E') ||
      findWire('SW_L1', 'MAIN_N') ||
      findWire('DP_L_OUT', 'DP_N_OUT') ||
      findWire('SOCK_L', 'SOCK_N')
    ) {
      setIsBreakerOn(false);
      setIsPowered(false);
      setIsShortCircuit(true);
      setScore(0);
      setEvaluationBreakdown({
        shortCircuit: true,
        matched: 0,
        colorErrors: 0,
        passed: false,
      });
      setStatus({
        type: 'danger',
        text: '⚡ TRIPPED! Short Circuit! Score: 0/100 (උපද්‍රවයි: කෙටි පරිපථයකි!)',
      });
      return;
    }

    if (!switchState) {
      setIsPowered(false);
      setStatus({ type: 'info', text: 'MCB is ON, Switch is OFF. Click the switch ON to test.' });
      return;
    }

    let matchedWiresCount = 0;
    let colorErrors = 0;

    assignedTask.requiredWires.forEach((req) => {
      const activeWire = findWire(req.from, req.to);
      if (activeWire) {
        if (activeWire.wireType === req.type) {
          matchedWiresCount++;
        } else {
          colorErrors++;
        }
      }
    });

    // Penalize extra unintended jumper wires
    const extraWires = Math.max(0, wires.length - assignedTask.requiredWires.length);
    let calculatedScore = (matchedWiresCount / assignedTask.requiredWires.length) * 80;
    if (colorErrors === 0 && matchedWiresCount > 0) calculatedScore += 20;
    calculatedScore = Math.max(0, calculatedScore - extraWires * 15);

    const roundedScore = Math.round(calculatedScore);
    setIsPowered(matchedWiresCount === assignedTask.requiredWires.length && extraWires === 0);
    setScore(roundedScore);
    setEvaluationBreakdown({
      matched: matchedWiresCount,
      total: assignedTask.requiredWires.length,
      colorErrors,
      extraWires,
      passed: roundedScore >= 75,
    });

    setStatus({
      type: roundedScore >= 75 ? 'success' : 'danger',
      text:
        roundedScore >= 75
          ? `✅ TASK VERIFIED! Score: ${roundedScore}/100. Click "Next Task ➔" to continue.`
          : `❌ INCOMPLETE / EXTRA WIRES! Score: ${roundedScore}/100. Fix wiring or click "Next Task ➔".`,
    });
  };

  const handleToggleBreaker = () => {
    const nextState = !isBreakerOn;
    setIsBreakerOn(nextState);
    evaluateCircuit(nextState, isSwitchOn);
  };

  const handleToggleWallSwitch = () => {
    const nextSwitch = !isSwitchOn;
    setIsSwitchOn(nextSwitch);
    if (isBreakerOn) {
      evaluateCircuit(isBreakerOn, nextSwitch);
    }
  };

  const handleNextTask = () => {
    const finalTaskScore = score !== null ? score : 0;
    const updatedResults = [
      ...taskResults,
      {
        taskId: assignedTask.id,
        titleEn: assignedTask.titleEn,
        score: finalTaskScore,
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
      setWires([]);
      setSelectedTerminal(null);
      setIsBreakerOn(false);
      setIsSwitchOn(true);
      setIsPowered(false);
      setIsShortCircuit(false);
      setScore(null);
      setEvaluationBreakdown(null);
      setStatus({
        type: 'info',
        text: `Task ${nextIdx + 1} of ${taskQueue.length}: ${nextTask.titleEn} / ${nextTask.titleSinhala}`,
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
          electricianId: electricianId,
          correctConnections: taskResults.filter((r) => r.passed).length,
          score: finalAverageScore,
          isPassed: finalAverageScore >= 75,
          taskId: taskResults.map((r) => r.taskId).join(','),
          configurationJson: JSON.stringify(taskResults),
        }),
      });
      if (response.ok) {
        alert(`🎉 Success! Overall Score (${finalAverageScore}/100) recorded in your Electrician Profile.`);
      } else {
        alert('Score calculated, but backend server returned an error.');
      }
    } catch {
      alert('Network error submitting final score to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gridDots = [];
  for (let gx = 30; gx < 960; gx += 30) {
    for (let gy = 30; gy < 430; gy += 30) {
      gridDots.push(<Circle key={`${gx}-${gy}`} x={gx} y={gy} radius={1.3} fill="#334155" />);
    }
  }

  if (checkingVerification) {
    return (
      <div className="sim-page">
        <div className="sim-wrapper">Loading assessment profile...</div>
      </div>
    );
  }

  if (!isVerifiedProfile) {
    return (
      <div className="sim-page">
        <div className="sim-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>🔒 Certificate & Profile Locked</h2>
          <p>
            Please complete your Electrician profile forum and upload your professional certificates / NIC documents before accessing the live 2D Simulator workbench.
          </p>
          <p className="sinhala-hint">
            කරුණාකර සිමියුලේටරය වෙත පිවිසීමට පෙර ඔබගේ පැතිකඩ (Profile) සහ සහතික පත් (Certificates) උඩුගත කරන්න.
          </p>
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
          <p className="text-slate-300 mb-6">Here is your complete breakdown across all assigned tasks:</p>

          <div className="space-y-3 text-left mb-6">
            {taskResults.map((res, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-800 rounded-lg flex justify-between items-center border border-slate-700"
              >
                <span>
                  <strong>
                    {idx + 1}. {res.titleEn}
                  </strong>
                </span>
                <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {res.score}/100 ({res.passed ? 'PASS' : 'FAIL'})
                </span>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-900 rounded-xl border border-amber-500/40 mb-6">
            <h3 className="text-2xl font-bold text-amber-400">Overall Score: {averageScore}/100</h3>
            <p className="text-sm text-slate-300 mt-1">
              {averageScore >= 75
                ? '✅ Qualified! You are eligible to accept customer jobs on ElectroSL.'
                : '❌ Below 75% pass mark. Please review IEC wiring standards and retry.'}
            </p>
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

  return (
    <div className="sim-page">
      <div className="sim-wrapper">
        {/* Top Header & Bilingual Task Briefing */}
        <div className="sim-header">
          <div className="sim-title-group">
            <h1>
              ⚡ ElectroSL Practical Skill Assessment (Task {currentTaskIndex + 1}/{taskQueue.length})
            </h1>
            <p className="task-title-en">
              <strong>{assignedTask.titleEn}</strong>
            </p>
            <p className="task-title-si text-amber-400">{assignedTask.titleSinhala}</p>
            <p className="task-desc">
              {assignedTask.descEn} / {assignedTask.descSinhala}
            </p>
          </div>
          <div className="sim-header-stats">
            {score !== null && (
              <div className={`sim-score-pill ${score < 75 ? 'fail' : ''}`}>
                Task Score: {score}/100
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="sim-toolbar">
          <div className="sim-wire-selector">
            <span className="sim-wire-label">Cable Spool / කේබල් වර්ගය:</span>
            {Object.entries(WIRE_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setSelectedWireType(key)}
                className={`wire-btn ${selectedWireType === key ? 'selected' : ''}`}
                style={{ backgroundColor: style.color }}
              >
                <span className="wire-swatch" style={{ backgroundColor: style.highlight }} />
                {style.name}
              </button>
            ))}
          </div>
          <div className="sim-actions">
            <button className="btn-clear" onClick={() => setWires([])}>
              Clear Wires
            </button>
            <button className="btn-test" onClick={handleToggleBreaker}>
              {isBreakerOn ? '🔴 Trip MCB OFF' : '⚡ Flip MCB ON'}
            </button>
            {/* Always visible Next Task button so user can advance or skip anytime */}
            <button
              className="btn-submit-score"
              style={{
                backgroundColor: score !== null ? '#16A34A' : '#2563EB',
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

        {/* Status Message */}
        <div className={`sim-status ${status.type}`}>{status.text}</div>

        {/* Interactive Konva Workbench */}
        <div className="sim-canvas-box">
          <Stage width={960} height={440}>
            <Layer>
              <Rect x={0} y={0} width={960} height={440} fill="#0F172A" cornerRadius={10} />
              {gridDots}

              <Rect x={25} y={195} width={910} height={24} fill="#334155" opacity={0.45} />
              <Rect x={25} y={201} width={910} height={12} fill="#475569" opacity={0.45} />

              {/* ================= 1. MAIN CONSUMER UNIT (MCB) ================= */}
              <Group x={35} y={65}>
                <Rect
                  width={150}
                  height={310}
                  fill="#1E293B"
                  stroke="#64748B"
                  strokeWidth={3}
                  cornerRadius={12}
                />
                <Rect x={10} y={10} width={130} height={36} fill="#0F294A" cornerRadius={6} />
                <Text text="230V MCB BOX" x={22} y={21} fill="#FBBF24" fontSize={13} fontStyle="bold" />

                <Group x={22} y={62} onClick={handleToggleBreaker}>
                  <Rect
                    width={56}
                    height={95}
                    fill="#E2E8F0"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    cornerRadius={6}
                  />
                  <Text text="C16" x={16} y={8} fill="#0F294A" fontSize={11} fontStyle="bold" />
                  <Rect x={14} y={26} width={28} height={46} fill="#1E293B" cornerRadius={4} />
                  <Rect
                    x={16}
                    y={isBreakerOn ? 28 : 48}
                    width={24}
                    height={22}
                    fill={isBreakerOn ? '#EF4444' : '#22C55E'}
                    cornerRadius={3}
                  />
                  <Text
                    text={isBreakerOn ? 'I - ON' : 'O - OFF'}
                    x={10}
                    y={78}
                    fill={isBreakerOn ? '#DC2626' : '#16A34A'}
                    fontSize={10}
                    fontStyle="bold"
                  />
                </Group>

                <Rect x={86} y={70} width={20} height={20} fill="#9A3412" cornerRadius={4} />
                <Rect x={86} y={160} width={20} height={20} fill="#1D4ED8" cornerRadius={4} />
                <Rect x={86} y={250} width={20} height={20} fill="#15803D" cornerRadius={4} />

                {isShortCircuit && (
                  <Group x={75} y={140}>
                    <Circle radius={34} fill="#FACC15" opacity={0.85} shadowColor="#EF4444" shadowBlur={25} />
                    <Text text="💥 TRIP!" x={-26} y={-7} fill="#991B1B" fontSize={13} fontStyle="bold" />
                  </Group>
                )}
              </Group>

              {/* ================= 2. MIDDLE SWITCH HARDWARE (Levels 1, 3, 4 ONLY) ================= */}
              {level === 1 && (
                /* Standard Single Wall Switch for Ceiling Light */
                <Group x={385} y={85}>
                  <Rect width={180} height={180} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="WALL SWITCH" x={42} y={16} fill="#475569" fontSize={12} fontStyle="bold" />
                  <Group x={55} y={96} onClick={handleToggleWallSwitch}>
                    <Rect
                      width={70}
                      height={64}
                      fill={isSwitchOn ? '#E2E8F0' : '#CBD5E1'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      cornerRadius={8}
                    />
                    <Text text={isSwitchOn ? 'ON' : 'OFF'} x={22} y={28} fill="#0F294A" fontSize={13} fontStyle="bold" />
                  </Group>
                </Group>
              )}

              {level === 3 && (
                <>
                  {/* Switch 1 (Bottom of Stairs) */}
                  <Group x={275} y={95}>
                    <Rect width={130} height={130} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={12} />
                    <Text text="SWITCH 1 (2-WAY)" x={14} y={12} fill="#475569" fontSize={10} fontStyle="bold" />
                    <Group x={35} y={55} onClick={handleToggleWallSwitch}>
                      <Rect
                        width={60}
                        height={50}
                        fill={isSwitchOn ? '#E2E8F0' : '#CBD5E1'}
                        stroke="#94A3B8"
                        strokeWidth={2}
                        cornerRadius={6}
                      />
                      <Text text={isSwitchOn ? 'POS A' : 'POS B'} x={12} y={20} fill="#0F294A" fontSize={11} fontStyle="bold" />
                    </Group>
                  </Group>

                  {/* Switch 2 (Top of Stairs) */}
                  <Group x={480} y={95}>
                    <Rect width={130} height={130} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={12} />
                    <Text text="SWITCH 2 (2-WAY)" x={14} y={12} fill="#475569" fontSize={10} fontStyle="bold" />
                    <Rect x={35} y={55} width={60} height={50} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                    <Text text="2-WAY" x={12} y={20} fill="#0F294A" fontSize={11} fontStyle="bold" />
                  </Group>
                </>
              )}

              {level === 4 && (
                /* 32A Double-Pole Isolator Switch */
                <Group x={385} y={85}>
                  <Rect width={180} height={200} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="32A DP ISOLATOR" x={32} y={16} fill="#DC2626" fontSize={12} fontStyle="bold" />
                  <Group x={55} y={85} onClick={handleToggleWallSwitch}>
                    <Rect
                      width={70}
                      height={75}
                      fill={isSwitchOn ? '#EF4444' : '#CBD5E1'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      cornerRadius={8}
                    />
                    <Text
                      text={isSwitchOn ? 'DP ON' : 'DP OFF'}
                      x={14}
                      y={30}
                      fill={isSwitchOn ? '#FFFFFF' : '#0F294A'}
                      fontSize={12}
                      fontStyle="bold"
                    />
                  </Group>
                </Group>
              )}

              {/* ================= 3. RIGHT LOAD HARDWARE ================= */}
              {(level === 1 || level === 3) && (
                /* Ceiling Light Fixture */
                <Group x={720} y={65}>
                  <Rect width={205} height={310} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="LIGHT FIXTURE" x={40} y={16} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  {isPowered && <Circle x={125} y={185} radius={78} fill="#FEF08A" opacity={0.45} shadowBlur={40} />}
                  <Rect x={107} y={108} width={36} height={24} fill="#94A3B8" cornerRadius={4} />
                  <Circle
                    x={125}
                    y={178}
                    radius={46}
                    fill={isPowered ? '#FACC15' : '#E2E8F0'}
                    stroke={isPowered ? '#F59E0B' : '#94A3B8'}
                    strokeWidth={3}
                  />
                  <Arc
                    x={125}
                    y={175}
                    innerRadius={12}
                    outerRadius={15}
                    angle={180}
                    rotation={180}
                    stroke={isPowered ? '#FFFFFF' : '#64748B'}
                    strokeWidth={3}
                  />
                  <Text
                    text={isPowered ? '💡 ILLUMINATED' : 'OFF'}
                    x={isPowered ? 74 : 112}
                    y={242}
                    fill={isPowered ? '#B45309' : '#64748B'}
                    fontSize={12}
                    fontStyle="bold"
                  />
                </Group>
              )}

              {level === 2 && (
                /* Sri Lankan BS 1363 13A Switched Socket Outlet (Built-in Rocker Switch on Faceplate) */
                <Group x={520} y={70}>
                  <Rect width={280} height={260} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={16} />
                  <Text text="13A SWITCHED SOCKET (SL)" x={48} y={16} fill="#0F294A" fontSize={12} fontStyle="bold" />

                  {/* Built-in Rocker Switch directly on Socket Outlet */}
                  <Group x={200} y={48} onClick={handleToggleWallSwitch}>
                    <Rect
                      width={48}
                      height={54}
                      fill={isSwitchOn ? '#E2E8F0' : '#CBD5E1'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      cornerRadius={6}
                    />
                    <Rect x={16} y={6} width={16} height={5} fill={isSwitchOn ? '#EF4444' : '#94A3B8'} cornerRadius={2} />
                    <Text text={isSwitchOn ? 'ON' : 'OFF'} x={12} y={24} fill="#0F294A" fontSize={11} fontStyle="bold" />
                  </Group>

                  {/* 3-Pin BS 1363 Rectangular Slots */}
                  <Rect x={124} y={102} width={12} height={24} fill="#1E293B" cornerRadius={2} />
                  <Rect x={78} y={155} width={24} height={12} fill="#1E293B" cornerRadius={2} />
                  <Rect x={158} y={155} width={24} height={12} fill="#1E293B" cornerRadius={2} />

                  {/* Power Status Indicator */}
                  <Circle x={130} y={212} radius={8} fill={isPowered ? '#22C55E' : '#CBD5E1'} />
                  <Text
                    text={isPowered ? '230V SOCKET LIVE' : 'SOCKET OFF / UNPOWERED'}
                    x={isPowered ? 74 : 52}
                    y={228}
                    fill={isPowered ? '#15803D' : '#64748B'}
                    fontSize={11}
                    fontStyle="bold"
                  />
                </Group>
              )}

              {level === 4 && (
                /* Heavy AC Outdoor/Indoor Unit Terminal Box */
                <Group x={715} y={65}>
                  <Rect width={210} height={310} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="240V AC UNIT LOAD" x={36} y={16} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  <Rect x={75} y={110} width={105} height={110} fill="#1E293B" cornerRadius={10} />
                  <Circle x={127} y={165} radius={36} stroke={isPowered ? '#38BDF8' : '#64748B'} strokeWidth={4} />
                  <Text
                    text={isPowered ? '❄️ COOLING ON' : 'STANDBY'}
                    x={82}
                    y={242}
                    fill={isPowered ? '#0284C7' : '#64748B'}
                    fontSize={12}
                    fontStyle="bold"
                  />
                </Group>
              )}

              {/* ================= 4. INSULATED CABLES & LIVE FLOW ================= */}
              {wires.map((wire) => {
                const style = WIRE_STYLES[wire.wireType];
                const midX = (wire.from.x + wire.to.x) / 2;
                const midY = Math.max(wire.from.y, wire.to.y) + 42;
                const pts = [wire.from.x, wire.from.y, midX, midY, wire.to.x, wire.to.y];

                return (
                  <Group
                    key={wire.id}
                    onClick={() => handleRemoveWire(wire.id)}
                    onMouseEnter={(e) => {
                      e.target.getStage().container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.getStage().container().style.cursor = 'default';
                    }}
                  >
                    <Line points={pts} stroke="#000000" strokeWidth={9} opacity={0.35} tension={0.45} lineCap="round" />
                    <Line points={pts} stroke={style.color} strokeWidth={7} tension={0.45} lineCap="round" />
                    {wire.wireType === 'E' && (
                      <Line
                        points={pts}
                        stroke="#FACC15"
                        strokeWidth={3}
                        dash={[10, 10]}
                        tension={0.45}
                        lineCap="round"
                      />
                    )}
                    {isPowered && wire.wireType !== 'E' && (
                      <Line
                        points={pts}
                        stroke="#FEF08A"
                        strokeWidth={3}
                        dash={[6, 34]}
                        dashOffset={-pulseOffset}
                        tension={0.45}
                        lineCap="round"
                      />
                    )}
                  </Group>
                );
              })}

              {/* ================= 5. BRASS SCREW TERMINALS ================= */}
              {currentLevel.terminals.map((term) => {
                const isSelected = selectedTerminal?.id === term.id;
                return (
                  <Group
                    key={term.id}
                    x={term.x}
                    y={term.y}
                    onClick={() => handleTerminalClick(term)}
                    onMouseEnter={(e) => {
                      e.target.getStage().container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.getStage().container().style.cursor = 'default';
                    }}
                  >
                    {isSelected && <Circle radius={17} fill="#F59E0B" opacity={0.4} />}
                    <Circle
                      radius={11}
                      fill={isSelected ? '#FBBF24' : '#EAB308'}
                      stroke="#713F12"
                      strokeWidth={2.5}
                    />
                    <Line points={[-5, 0, 5, 0]} stroke="#713F12" strokeWidth={2} />
                    <Line points={[0, -5, 0, 5]} stroke="#713F12" strokeWidth={2} />
                    <Rect x={-26} y={-30} width={52} height={16} fill="#0F294A" cornerRadius={4} />
                    <Text
                      text={term.label}
                      x={-26}
                      y={-27}
                      width={52}
                      align="center"
                      fill="#FFFFFF"
                      fontSize={9}
                      fontStyle="bold"
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        {/* Task Evaluation Breakdown */}
        {evaluationBreakdown && (
          <div className="sim-breakdown-box">
            <h3>📋 Task {currentTaskIndex + 1} Verification Report</h3>
            <p>
              Correct Connections:{' '}
              <strong>
                {evaluationBreakdown.matched} / {assignedTask.requiredWires.length}
              </strong>
            </p>
            <p>
              IEC Color Compliance Errors: <strong>{evaluationBreakdown.colorErrors}</strong>
            </p>
            {evaluationBreakdown.extraWires > 0 && (
              <p className="text-red-400">
                Extra/Unintended Wires: <strong>{evaluationBreakdown.extraWires}</strong> (Click any wire on canvas to remove)
              </p>
            )}
            <p>
              Status:{' '}
              <strong>{evaluationBreakdown.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}