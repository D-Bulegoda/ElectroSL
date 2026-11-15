import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arc } from 'react-konva';
import './CircuitSimulator.css';

const WIRE_STYLES = {
  L: { name: 'Live (Brown)', color: '#9A3412', highlight: '#EA580C' },
  N: { name: 'Neutral (Blue)', color: '#1D4ED8', highlight: '#60A5FA' },
  E: { name: 'Earth (Green/Yellow)', color: '#15803D', highlight: '#FACC15' },
};

const LEVELS = {
  1: {
    title: 'Level 1: Domestic Switch & Earthing',
    subtitle: 'Route 230V Live through the MCB & Wall Switch, Neutral to the Bulb, and Earth to the metallic housing.',
    terminals: [
      // Main Consumer Unit (MCB)
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },

      // Wall Switch
      { id: 'SW_COM', label: 'COM', x: 430, y: 155, type: 'L' },
      { id: 'SW_L1', label: 'L1', x: 520, y: 155, type: 'L' },

      // Ceiling Light Fixture
      { id: 'BULB_L', label: 'L', x: 765, y: 145, type: 'L' },
      { id: 'BULB_N', label: 'N', x: 765, y: 235, type: 'N' },
      { id: 'BULB_E', label: 'EARTH', x: 765, y: 325, type: 'E' },
    ],
  },
  2: {
    title: 'Level 2: 13A Socket Outlet Ring/Radial',
    subtitle: 'Wire a Sri Lankan 3-pin 13A wall socket safely with proper Live, Neutral, and Earth polarity.',
    terminals: [
      { id: 'MAIN_L', label: 'L IN', x: 145, y: 145, type: 'L' },
      { id: 'MAIN_N', label: 'N BAR', x: 145, y: 235, type: 'N' },
      { id: 'MAIN_E', label: 'E BAR', x: 145, y: 325, type: 'E' },

      // Isolator Switch
      { id: 'SW_COM', label: 'IN', x: 430, y: 155, type: 'L' },
      { id: 'SW_L1', label: 'OUT', x: 520, y: 155, type: 'L' },

      // 13A 3-Pin Socket
      { id: 'SOCK_E', label: 'E (TOP)', x: 810, y: 150, type: 'E' },
      { id: 'SOCK_N', label: 'N (LEFT)', x: 765, y: 245, type: 'N' },
      { id: 'SOCK_L', label: 'L (RIGHT)', x: 855, y: 245, type: 'L' },
    ],
  },
};

export default function CircuitSimulator() {
  const [level, setLevel] = useState(1);
  const [selectedWireType, setSelectedWireType] = useState('L');
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [wires, setWires] = useState([]);
  const [isBreakerOn, setIsBreakerOn] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(true);
  const [isPowered, setIsPowered] = useState(false);
  const [isShortCircuit, setIsShortCircuit] = useState(false);
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState({
    type: 'info',
    text: 'Pick a wire color above, then click two brass terminals to connect them.',
  });
  const [pulseOffset, setPulseOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLevel = LEVELS[level];

  // Animate electricity flow dots when circuit is live
  useEffect(() => {
    if (!isPowered) return;
    const interval = setInterval(() => {
      setPulseOffset((prev) => (prev + 4) % 40);
    }, 50);
    return () => clearInterval(interval);
  }, [isPowered]);

  const handleLevelChange = (lvl) => {
    setLevel(lvl);
    setWires([]);
    setSelectedTerminal(null);
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);
    setScore(null);
    setStatus({
      type: 'info',
      text: `Loaded ${LEVELS[lvl].title}. Connect all terminals accurately.`,
    });
  };

  const handleTerminalClick = (terminal) => {
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);

    if (!selectedTerminal) {
      setSelectedTerminal(terminal);
      setStatus({
        type: 'info',
        text: `Terminal [${terminal.label}] selected. Click destination brass screw terminal.`,
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
      setStatus({ type: 'danger', text: 'These two terminals are already wired together!' });
      setSelectedTerminal(null);
      return;
    }

    const newWire = {
      id: `${selectedTerminal.id}_${terminal.id}`, from: selectedTerminal, to: terminal, wireType: selectedWireType, };  setWires([...wires, newWire]); setSelectedTerminal(null); setStatus({ type: 'info', text: `Connected [${selectedTerminal.label}] → [${terminal.label}] with${WIRE_STYLES[selectedWireType].name}.`,
    });
  };

  const handleRemoveWire = (id) => {
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);
    setWires(wires.filter((w) => w.id !== id));
    setStatus({ type: 'info', text: 'Wire disconnected.' });
  };

  const handleClear = () => {
    setWires([]);
    setSelectedTerminal(null);
    setIsBreakerOn(false);
    setIsPowered(false);
    setIsShortCircuit(false);
    setScore(null);
    setStatus({ type: 'info', text: 'Workbench cleared.' });
  };

  const findWire = (id1, id2) =>
    wires.find(
      (w) => (w.from.id === id1 && w.to.id === id2) || (w.from.id === id2 && w.to.id === id1)
    );

  const evaluateCircuit = (breakerState, switchState) => {
    if (!breakerState) {
      setIsPowered(false);
      setIsShortCircuit(false);
      setStatus({ type: 'info', text: 'Main MCB is OFF. Flip the MCB breaker ON to energize.' });
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
      setStatus({
        type: 'danger',
        text: '⚡ TRIPPED! Direct Short Circuit between Live and Neutral/Earth! Score: 0/100',
      });
      return;
    }

    if (level === 1) {
      const wLiveSw = findWire('MAIN_L', 'SW_COM');
      const wSwBulb = findWire('SW_L1', 'BULB_L');
      const wNeutBulb = findWire('MAIN_N', 'BULB_N');
      const wEarthBulb = findWire('MAIN_E', 'BULB_E');

      if (!wLiveSw || !wSwBulb || !wNeutBulb) {
        setIsPowered(false);
        setScore(30);
        setStatus({
          type: 'danger',
          text: '❌ Open Circuit: Power is not completing the loop through the switch to the bulb. Score: 30/100',
        });
        return;
      }

      if (!switchState) {
        setIsPowered(false);
        setStatus({
          type: 'info',
          text: 'MCB is ON, Wall Switch is OFF. Click the Wall Switch rocker to turn the light ON!',
        });
        return;
      }

      let pts = 60;
      if (wEarthBulb) pts += 20;
      if (
        wLiveSw.wireType === 'L' &&
        wSwBulb.wireType === 'L' &&
        wNeutBulb.wireType === 'N' &&
        (!wEarthBulb || wEarthBulb.wireType === 'E')
      ) {
        pts += 20;
      }

      setIsPowered(true);
      setScore(pts);
      setStatus({
        type: pts === 100 ? 'success' : 'info',
        text:
          pts === 100
            ? '✅ EXCELLENT! 230V Circuit Active, Earth Bonded & IEC Color Codes Verified! Score: 100/100'
            : `⚠️ Circuit Active (${pts}/100) — Check Earth bonding and IEC wire color standards.`,
      });
    } else {
      // Level 2: 13A Socket
      const wLiveSw = findWire('MAIN_L', 'SW_COM');
      const wSwSock = findWire('SW_L1', 'SOCK_L');
      const wNeutSock = findWire('MAIN_N', 'SOCK_N');
      const wEarthSock = findWire('MAIN_E', 'SOCK_E');

      if (!wLiveSw || !wSwSock || !wNeutSock) {
        setIsPowered(false);
        setScore(30);
        setStatus({
          type: 'danger',
          text: '❌ Socket Unpowered: Verify Live (Right) and Neutral (Left) connections. Score: 30/100',
        });
        return;
      }

      if (!switchState) {
        setIsPowered(false);
        setStatus({
          type: 'info',
          text: 'MCB is ON, Socket Switch is OFF. Click the Wall Switch rocker to test socket power!',
        });
        return;
      }

      let pts = 60;
      if (wEarthSock) pts += 20;
      if (
        wLiveSw.wireType === 'L' &&
        wSwSock.wireType === 'L' &&
        wNeutSock.wireType === 'N' &&
        (!wEarthSock || wEarthSock.wireType === 'E')
      ) {
        pts += 20;
      }

      setIsPowered(true);
      setScore(pts);
      setStatus({
        type: pts === 100 ? 'success' : 'info',
        text:
          pts === 100
            ? '✅ PERFECT SOCKET POLARITY! Live Right, Neutral Left, Earth Top Verified! Score: 100/100'
            : `⚠️ Socket Energized (${pts}/100) — Verify Earth pin and wire color coding.`,
      });
    }
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
      const response = await fetch('http://localhost:5192/api/Simulator/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electricianProfileId: 1,
          score,
          levelsCompleted: level,
          passedQualityCheck: score >= 75,
        }),
      });
      if (response.ok) {
        alert(`Score (${score}/100) saved to your Electrician Profile!`);
      } else {
        alert('Could not reach backend API. Ensure ASP.NET Core server is running.');
      }
    } catch {
      alert('Network error submitting score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate pegboard background grid dots
  const gridDots = [];
  for (let gx = 30; gx < 960; gx += 30) {
    for (let gy = 30; gy < 430; gy += 30) {
      gridDots.push(<Circle key={`${gx}-${gy}`} x={gx} y={gy} radius={1.3} fill="#334155" />); } }  return ( <div className="sim-page"> <div className="sim-wrapper"> {/* Top Bar */} <div className="sim-header"> <div className="sim-title-group"> <h1>⚡ ElectroSL 2D Quality Bench</h1> <p>{currentLevel.subtitle}</p> </div>  <div className="sim-header-stats"> <div className="sim-level-tabs"> <button className={`sim-level-btn ${level === 1 ? 'active' : ''}`}
                onClick={() => handleLevelChange(1)}
              >
                Level 1: Lighting
              </button>
              <button
                className={`sim-level-btn ${level === 2 ? 'active' : ''}`} onClick={() => handleLevelChange(2)} > Level 2: 13A Socket </button> </div>  {score !== null && ( <div className={`sim-score-pill ${score < 75 ? 'fail' : ''}`}>
                Score: {score}/100
              </div>
            )}
          </div>
        </div>

        {/* Colorful Wire & Control Toolbar */}
        <div className="sim-toolbar">
          <div className="sim-wire-selector">
            <span className="sim-wire-label">Cable Spool:</span>
            {Object.entries(WIRE_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setSelectedWireType(key)}
                className={`wire-btn ${selectedWireType === key ? 'selected' : ''}`} style={{ backgroundColor: style.color }} > <span className="wire-swatch" style={{ backgroundColor: style.highlight }} /> {style.name} </button> ))} </div>  <div className="sim-actions"> <button className="btn-clear" onClick={handleClear}> Clear Wires </button> <button className="btn-test" onClick={handleToggleBreaker}> {isBreakerOn ? '🔴 Trip MCB OFF' : '⚡ Flip MCB ON'} </button> {score !== null && score >= 75 && ( <button className="btn-submit-score" onClick={handleSubmitScore} disabled={isSubmitting} > {isSubmitting ? 'Saving...' : '✓ Submit Score'} </button> )} </div> </div>  {/* Status Feedback Banner */} <div className={`sim-status ${status.type}`}>{status.text}</div>

        {/* Interactive 2D Konva Workbench */}
        <div className="sim-canvas-box">
          <Stage width={960} height={440}>
            <Layer>
              {/* Dark Blueprint Workbench Background */}
              <Rect x={0} y={0} width={960} height={440} fill="#0F172A" cornerRadius={10} />
              {gridDots}

              {/* DIN Rail Metal Strip */}
              <Rect x={25} y={195} width={910} height={24} fill="#334155" opacity={0.45} />
              <Rect x={25} y={201} width={910} height={12} fill="#475569" opacity={0.45} />

              {/* ================= 1. MAIN CONSUMER UNIT (MCB) ================= */}
              <Group x={35} y={65}>
                {/* Outer Enclosure */}
                <Rect
                  width={150}
                  height={310}
                  fill="#1E293B"
                  stroke="#64748B"
                  strokeWidth={3}
                  cornerRadius={12}
                  shadowColor="#000"
                  shadowBlur={15}
                />
                {/* Header Plate */}
                <Rect x={10} y={10} width={130} height={36} fill="#0F294A" cornerRadius={6} />
                <Text
                  text="230V MCB BOX"
                  x={22}
                  y={21}
                  fill="#FBBF24"
                  fontSize={13}
                  fontStyle="bold"
                />

                {/* Interactive Breaker Toggle Lever */}
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
                  {/* Breaker Switch Housing */}
                  <Rect x={14} y={26} width={28} height={46} fill="#1E293B" cornerRadius={4} />
                  {/* Colored Lever */}
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

                {/* Busbar Color Badges */}
                <Rect x={86} y={70} width={20} height={20} fill="#9A3412" cornerRadius={4} />
                <Rect x={86} y={160} width={20} height={20} fill="#1D4ED8" cornerRadius={4} />
                <Rect x={86} y={250} width={20} height={20} fill="#15803D" cornerRadius={4} />

                {/* Short Circuit Spark Graphic */}
                {isShortCircuit && (
                  <Group x={75} y={140}>
                    <Circle radius={34} fill="#FACC15" opacity={0.85} shadowColor="#EF4444" shadowBlur={25} />
                    <Text text="💥 TRIP!" x={-26} y={-7} fill="#991B1B" fontSize={13} fontStyle="bold" />
                  </Group>
                )}
              </Group>

              {/* ================= 2. 3D ROCKER WALL SWITCH ================= */}
              <Group x={385} y={85}>
                {/* Faceplate */}
                <Rect
                  width={180}
                  height={180}
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth={3}
                  cornerRadius={14}
                  shadowColor="#000"
                  shadowBlur={15}
                />
                {/* Corner Screw Caps */}
                <Circle x={18} y={18} radius={5} fill="#CBD5E1" />
                <Circle x={162} y={18} radius={5} fill="#CBD5E1" />
                <Circle x={18} y={162} radius={5} fill="#CBD5E1" />
                <Circle x={162} y={162} radius={5} fill="#CBD5E1" />

                <Text
                  text="WALL SWITCH"
                  x={42}
                  y={16}
                  fill="#475569"
                  fontSize={12}
                  fontStyle="bold"
                />

                {/* Clickable Rocker Button */}
                <Group x={55} y={96} onClick={handleToggleWallSwitch}>
                  <Rect
                    width={70}
                    height={64}
                    fill={isSwitchOn ? '#E2E8F0' : '#CBD5E1'}
                    stroke="#94A3B8"
                    strokeWidth={2}
                    cornerRadius={8}
                  />
                  {/* Red Neon Indicator Strip */}
                  <Rect
                    x={22}
                    y={8}
                    width={26}
                    height={5}
                    fill={isSwitchOn ? '#EF4444' : '#94A3B8'}
                    cornerRadius={2}
                  />
                  <Text
                    text={isSwitchOn ? 'ON' : 'OFF'}
                    x={22}
                    y={28}
                    fill="#0F294A"
                    fontSize={13}
                    fontStyle="bold"
                  />
                </Group>
              </Group>

              {/* ================= 3. LOAD: GLOWING BULB OR 13A SOCKET ================= */}
              {level === 1 ? (
                <Group x={720} y={65}>
                  {/* Ceiling Rose Housing */}
                  <Rect
                    width={205}
                    height={310}
                    fill="#F8FAFC"
                    stroke="#CBD5E1"
                    strokeWidth={3}
                    cornerRadius={14}
                    shadowColor="#000"
                    shadowBlur={15}
                  />
                  <Text
                    text="230V CEILING FIXTURE"
                    x={28}
                    y={16}
                    fill="#0F294A"
                    fontSize={12}
                    fontStyle="bold"
                  />

                  {/* Warm Light Halo when Powered */}
                  {isPowered && (
                    <Circle
                      x={125}
                      y={185}
                      radius={78}
                      fill="#FEF08A"
                      opacity={0.45}
                      shadowColor="#FACC15"
                      shadowBlur={40}
                    />
                  )}

                  {/* Bulb Screw Base */}
                  <Rect x={107} y={108} width={36} height={24} fill="#94A3B8" cornerRadius={4} />
                  <Rect x={105} y={114} width={40} height={4} fill="#64748B" />
                  <Rect x={105} y={122} width={40} height={4} fill="#64748B" />

                  {/* Glass Bulb */}
                  <Circle
                    x={125}
                    y={178}
                    radius={46}
                    fill={isPowered ? '#FACC15' : '#E2E8F0'}
                    stroke={isPowered ? '#F59E0B' : '#94A3B8'}
                    strokeWidth={3}
                  />

                  {/* Glowing Filament */}
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
                  <Line
                    points={[113, 175, 118, 132]}
                    stroke={isPowered ? '#FFFFFF' : '#64748B'}
                    strokeWidth={2}
                  />
                  <Line
                    points={[137, 175, 132, 132]}
                    stroke={isPowered ? '#FFFFFF' : '#64748B'}
                    strokeWidth={2}
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
              ) : (
                <Group x={705} y={85}>
                  {/* 13A Socket Faceplate */}
                  <Rect
                    width={210}
                    height={230}
                    fill="#F8FAFC"
                    stroke="#CBD5E1"
                    strokeWidth={3}
                    cornerRadius={14}
                    shadowColor="#000"
                    shadowBlur={15}
                  />
                  <Text
                    text="13A 3-PIN SOCKET"
                    x={44}
                    y={16}
                    fill="#0F294A"
                    fontSize={12}
                    fontStyle="bold"
                  />
                  {/* Earth Pin Slot (Top) */}
                  <Rect x={99} y={85} width={12} height={24} fill="#1E293B" cornerRadius={2} />
                  {/* Neutral Pin Slot (Left) */}
                  <Rect x={55} y={132} width={22} height={12} fill="#1E293B" cornerRadius={2} />
                  {/* Live Pin Slot (Right) */}
                  <Rect x={133} y={132} width={22} height={12} fill="#1E293B" cornerRadius={2} />

                  {/* Power Neon Indicator */}
                  <Circle
                    x={105}
                    y={192}
                    radius={8}
                    fill={isPowered ? '#22C55E' : '#CBD5E1'}
                    shadowColor="#22C55E"
                    shadowBlur={isPowered ? 15 : 0}
                  />
                  <Text
                    text={isPowered ? '230V LIVE READY' : 'NO POWER'}
                    x={isPowered ? 58 : 72}
                    y={206}
                    fill={isPowered ? '#15803D' : '#64748B'}
                    fontSize={11}
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
                    {/* Outer Shadow */}
                    <Line
                      points={pts}
                      stroke="#000000"
                      strokeWidth={9}
                      opacity={0.35}
                      tension={0.45}
                      lineCap="round"
                    />
                    {/* Main Colored Insulation */}
                    <Line
                      points={pts}
                      stroke={style.color}
                      strokeWidth={7}
                      tension={0.45}
                      lineCap="round"
                    />
                    {/* Yellow Stripe for Earth Wire */}
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
                    {/* Animated Electricity Pulses when Powered */}
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
                    {/* Selection Glow Ring */}
                    {isSelected && (
                      <Circle radius={17} fill="#F59E0B" opacity={0.4} />
                    )}
                    {/* Brass Screw Head */}
                    <Circle
                      radius={11}
                      fill={isSelected ? '#FBBF24' : '#EAB308'}
                      stroke="#713F12"
                      strokeWidth={2.5}
                    />
                    {/* Phillips Cross Slot */}
                    <Line points={[-5, 0, 5, 0]} stroke="#713F12" strokeWidth={2} />
                    <Line points={[0, -5, 0, 5]} stroke="#713F12" strokeWidth={2} />

                    {/* Terminal Label Pill */}
                    <Rect
                      x={-24}
                      y={-30}
                      width={48}
                      height={16}
                      fill="#0F294A"
                      cornerRadius={4}
                    />
                    <Text
                      text={term.label}
                      x={-24}
                      y={-27}
                      width={48}
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

        <p className="sim-hint">
          💡 Tip: Click any cable to remove it • Click the MCB breaker or Wall Switch rocker directly on the board to toggle power!
        </p>
      </div>
    </div>
  );
}