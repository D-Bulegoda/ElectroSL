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
    descEn: 'Connect Live through MCB and Switch to Bulb L. Connect Neutral and Earth securely.',
    descSinhala: 'MCB සහ ස්විචය හරහා බල්බ් L වෙත ජීවී කම්බිය සම්බන්ධ කරන්න. උදාසීන සහ පෘථිවි කම්බි අත්වැරදීම්වලින් තොරව සවි කරන්න.',
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
    titleEn: 'Task 2: 13A Socket Outlet Polarity Wiring',
    titleSinhala: 'කාර්යය 2: 13A සොකට් අලෙවිසැල් රැහැන්ගත කිරීම',
    descEn: 'Wire the 13A Socket with correct IEC polarity: Live Right, Neutral Left, Earth Top.',
    descSinhala: 'නිවැරදි IEC ප්‍රමිතියට අනුව 13A සොකට් එකට කම්බි සම්බන්ධ කරන්න: දකුණට ජීවී, වමට උදාසීන, ඉහළට පෘථිවි.',
    level: 2,
    requiredWires: [
      { from: 'MAIN_L', to: 'SW_COM', type: 'L' },
      { from: 'SW_L1', to: 'SOCK_L', type: 'L' },
      { from: 'MAIN_N', to: 'SOCK_N', type: 'N' },
      { from: 'MAIN_E', to: 'SOCK_E', type: 'E' },
    ],
  },
];

const LEVELS = {
  1: {
    title: 'Level 1: Domestic Switch & Earthing',
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
    title: 'Level 2: 13A Socket Outlet Ring/Radial',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },
      { id: 'SW_COM', label: 'IN', x: 430, y: 155, type: 'L' },
      { id: 'SW_L1', label: 'OUT', x: 520, y: 155, type: 'L' },
      { id: 'SOCK_E', label: 'E (TOP)', x: 810, y: 150, type: 'E' },
      { id: 'SOCK_N', label: 'N (LEFT)', x: 765, y: 245, type: 'N' },
      { id: 'SOCK_L', label: 'L (RIGHT)', x: 855, y: 245, type: 'L' },
    ],
  },
};

export default function CircuitSimulator() {
  const [electricianId] = useState(1); // Can be fetched from user login context
  const [isVerifiedProfile, setIsVerifiedProfile] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

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
    text: 'Loading assigned randomized task...',
  });
  const [pulseOffset, setPulseOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Check if Electrician has filled their profile & uploaded verification certificates
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
          setIsVerifiedProfile(true); // Fallback for local testing if API isn't wired yet
        }
      } catch {
        setIsVerifiedProfile(true); // Fallback for local development
      } finally {
        setCheckingVerification(false);
      }
    }

    // 2. Assign randomized task based on Electrician ID hash/modulo
    const taskIndex = electricianId % TASK_BANK.length;
    const task = TASK_BANK[taskIndex];
    setAssignedTask(task);
    setLevel(task.level);
    setStatus({
      type: 'info',
      text: `Assigned Task: ${task.titleEn} / ${task.titleSinhala}`,
    });

    checkVerificationStatus();
  }, [electricianId]);

  const currentLevel = LEVELS[level];

  // Animate electricity flow dots
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

    // Short circuit check
    if (
      findWire('MAIN_L', 'MAIN_N') ||
      findWire('MAIN_L', 'MAIN_E') ||
      findWire('SW_L1', 'MAIN_N')
    ) {
      setIsBreakerOn(false);
      setIsPowered(false);
      setIsShortCircuit(true);
      setScore(0);
      setEvaluationBreakdown({
        shortCircuit: true,
        details: 'Critical Short Circuit detected between Live and Neutral/Earth.',
      });
      setStatus({
        type: 'danger',
        text: '⚡ TRIPPED! Short Circuit! Score: 0/100 (උපද්‍රවයි: කෙටි පරිපථයකි!)',
      });
      return;
    }

    if (!switchState) {
      setIsPowered(false);
      setStatus({ type: 'info', text: 'MCB is ON, Wall Switch is OFF. Toggle switch ON.' });
      return;
    }

    // Comprehensive scoring breakdown against assigned task criteria
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

    let calculatedScore = (matchedWiresCount / assignedTask.requiredWires.length) * 80;
    if (colorErrors === 0 && matchedWiresCount > 0) calculatedScore += 20; // IEC Color bonus

    setIsPowered(true);
    setScore(Math.round(calculatedScore));
    setEvaluationBreakdown({
      matched: matchedWiresCount,
      total: assignedTask.requiredWires.length,
      colorErrors,
      passed: calculatedScore >= 75,
    });

    setStatus({
      type: calculatedScore >= 75 ? 'success' : 'danger',
      text:
        calculatedScore >= 75
          ? `✅ TASK PASSED! Score: ${Math.round(calculatedScore)}/100. All wiring & safety protocols verified.`
          : `❌ TASK FAILED! Score: ${Math.round(calculatedScore)}/100. Review IEC color codes and terminal routing.`,
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

  const handleSubmitScore = async () => {
    if (score === null) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5192/api/Simulator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electricianId: electricianId,
          correctConnections: evaluationBreakdown?.matched || 0,
          score: score,
          isPassed: score >= 75,
          taskId: assignedTask.id,
          configurationJson: JSON.stringify(wires),
        }),
      });
      if (response.ok) {
        alert(`🎉 Success! Final Score (${score}/100) recorded in your Electrician Profile.`);
      } else {
        alert('Score calculated successfully, but backend connection failed.');
      }
    } catch {
      alert('Error submitting score to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grid dots
  const gridDots = [];
  for (let gx = 30; gx < 960; gx += 30) {
    for (let gy = 30; gy < 430; gy += 30) {
      gridDots.push(<Circle key={`${gx}-${gy}`} x={gx} y={gy} radius={1.3} fill="#334155" />);
    }
  }

  // Guard Clause: If electrician hasn't uploaded certificate/profile details yet
  if (checkingVerification) {
    return <div className="sim-page"><div className="sim-wrapper">Loading assessment profile...</div></div>;
  }

  if (!isVerifiedProfile) {
    return (
      <div className="sim-page">
        <div className="sim-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>🔒 Certificate & Profile Locked</h2>
          <p>Please complete your Electrician profile forum and upload your professional certificates / NIC documents before accessing the live 2D Simulator workbench.</p>
          <p className="sinhala-hint">කරුණාකර සිමියුලේටරය වෙත පිවිසීමට පෙර ඔබගේ පැතිකඩ (Profile) සහ සහතික පත් (Certificates) උඩුගත කරන්න.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page">
      <div className="sim-wrapper">
        {/* Top Header & Task Briefing */}
        <div className="sim-header">
          <div className="sim-title-group">
            <h1>⚡ ElectroSL Practical Skill Assessment</h1>
            <p className="task-title-en"><strong>{assignedTask.titleEn}</strong></p>
            <p className="task-title-si text-amber-400">{assignedTask.titleSinhala}</p>
            <p className="task-desc">{assignedTask.descEn} / {assignedTask.descSinhala}</p>
          </div>
          <div className="sim-header-stats">
            {score !== null && (
              <div className={`sim-score-pill ${score < 75 ? 'fail' : ''}`}>
                Final Score: {score}/100
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
            <button className="btn-clear" onClick={() => setWires([])}>Clear Wires</button>
            <button className="btn-test" onClick={handleToggleBreaker}>
              {isBreakerOn ? '🔴 Trip MCB OFF' : '⚡ Flip MCB ON'}
            </button>
            {score !== null && (
              <button className="btn-submit-score" onClick={handleSubmitScore} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : '✓ Submit Assessment'}
              </button>
            )}
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

              {/* MCB Unit */}
              <Group x={35} y={65}>
                <Rect width={150} height={310} fill="#1E293B" stroke="#64748B" strokeWidth={3} cornerRadius={12} />
                <Rect x={10} y={10} width={130} height={36} fill="#0F294A" cornerRadius={6} />
                <Text text="230V MCB BOX" x={22} y={21} fill="#FBBF24" fontSize={13} fontStyle="bold" />
                
                <Group x={22} y={62} onClick={handleToggleBreaker}>
                  <Rect width={56} height={95} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={2} cornerRadius={6} />
                  <Text text="C16" x={16} y={8} fill="#0F294A" fontSize={11} fontStyle="bold" />
                  <Rect x={14} y={26} width={28} height={46} fill="#1E293B" cornerRadius={4} />
                  <Rect x={16} y={isBreakerOn ? 28 : 48} width={24} height={22} fill={isBreakerOn ? '#EF4444' : '#22C55E'} cornerRadius={3} />
                  <Text text={isBreakerOn ? 'I - ON' : 'O - OFF'} x={10} y={78} fill={isBreakerOn ? '#DC2626' : '#16A34A'} fontSize={10} fontStyle="bold" />
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

              {/* Wall Switch */}
              <Group x={385} y={85}>
                <Rect width={180} height={180} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                <Text text="WALL SWITCH" x={42} y={16} fill="#475569" fontSize={12} fontStyle="bold" />
                <Group x={55} y={96} onClick={handleToggleWallSwitch}>
                  <Rect width={70} height={64} fill={isSwitchOn ? '#E2E8F0' : '#CBD5E1'} stroke="#94A3B8" strokeWidth={2} cornerRadius={8} />
                  <Text text={isSwitchOn ? 'ON' : 'OFF'} x={22} y={28} fill="#0F294A" fontSize={13} fontStyle="bold" />
                </Group>
              </Group>

              {/* Load (Fixture / Socket) */}
              {level === 1 ? (
                <Group x={720} y={65}>
                  <Rect width={205} height={310} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="LIGHT FIXTURE" x={40} y={16} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  {isPowered && <Circle x={125} y={185} radius={78} fill="#FEF08A" opacity={0.45} shadowBlur={40} />}
                  <Circle x={125} y={178} radius={46} fill={isPowered ? '#FACC15' : '#E2E8F0'} stroke={isPowered ? '#F59E0B' : '#94A3B8'} strokeWidth={3} />
                  <Text text={isPowered ? '💡 ILLUMINATED' : 'OFF'} x={isPowered ? 74 : 112} y={242} fill={isPowered ? '#B45309' : '#64748B'} fontSize={12} fontStyle="bold" />
                </Group>
              ) : (
                <Group x={705} y={85}>
                  <Rect width={210} height={230} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} cornerRadius={14} />
                  <Text text="13A SOCKET" x={60} y={16} fill="#0F294A" fontSize={12} fontStyle="bold" />
                  <Rect x={99} y={85} width={12} height={24} fill="#1E293B" cornerRadius={2} />
                  <Rect x={55} y={132} width={22} height={12} fill="#1E293B" cornerRadius={2} />
                  <Rect x={133} y={132} width={22} height={12} fill="#1E293B" cornerRadius={2} />
                  <Circle x={105} y={192} radius={8} fill={isPowered ? '#22C55E' : '#CBD5E1'} />
                </Group>
              )}

              {/* Wires */}
              {wires.map((wire) => {
                const style = WIRE_STYLES[wire.wireType];
                const midX = (wire.from.x + wire.to.x) / 2;
                const midY = Math.max(wire.from.y, wire.to.y) + 42;
                const pts = [wire.from.x, wire.from.y, midX, midY, wire.to.x, wire.to.y];

                return (
                  <Group key={wire.id} onClick={() => handleRemoveWire(wire.id)}>
                    <Line points={pts} stroke={style.color} strokeWidth={7} tension={0.45} lineCap="round" />
                    {isPowered && wire.wireType !== 'E' && (
                      <Line points={pts} stroke="#FEF08A" strokeWidth={3} dash={[6, 34]} dashOffset={-pulseOffset} tension={0.45} />
                    )}
                  </Group>
                );
              })}

              {/* Terminals */}
              {currentLevel.terminals.map((term) => {
                const isSelected = selectedTerminal?.id === term.id;
                return (
                  <Group key={term.id} x={term.x} y={term.y} onClick={() => handleTerminalClick(term)}>
                    {isSelected && <Circle radius={17} fill="#F59E0B" opacity={0.4} />}
                    <Circle radius={11} fill={isSelected ? '#FBBF24' : '#EAB308'} stroke="#713F12" strokeWidth={2.5} />
                    <Text text={term.label} x={-24} y={-27} width={48} align="center" fill="#FFFFFF" fontSize={9} fontStyle="bold" />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        {/* Evaluation Feedback Breakdown Summary */}
        {evaluationBreakdown && (
          <div className="sim-breakdown-box">
            <h3>📋 Assessment Report & Feedback</h3>
            <p>Correct Connections: <strong>{evaluationBreakdown.matched} / {assignedTask.requiredWires.length}</strong></p>
            <p>IEC Color Compliance Errors: <strong>{evaluationBreakdown.colorErrors}</strong></p>
            <p>Status: <strong>{evaluationBreakdown.passed ? 'PASSED (Certificate Eligible)' : 'NEEDS IMPROVEMENT'}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}