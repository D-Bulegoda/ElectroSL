import React, { useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';

// Circuit Components and their Terminals (Nodes)
const INITIAL_TERMINALS = [
  // Main Supply Box (Left)
  { id: 'MAIN_L', label: 'L (230V)', x: 140, y: 130, type: 'L', group: 'Main Supply' },
  { id: 'MAIN_N', label: 'N', x: 140, y: 210, type: 'N', group: 'Main Supply' },
  { id: 'MAIN_E', label: 'E', x: 140, y: 290, type: 'E', group: 'Main Supply' },

  // Wall Switch (Middle)
  { id: 'SW_IN', label: 'COM', x: 380, y: 130, type: 'L', group: '1-Way Switch' },
  { id: 'SW_OUT', label: 'L1', x: 460, y: 130, type: 'L', group: '1-Way Switch' },

  // Light Fixture / Load (Right)
  { id: 'BULB_L', label: 'L_IN', x: 680, y: 130, type: 'L', group: 'Ceiling Light' },
  { id: 'BULB_N', label: 'N_IN', x: 680, y: 210, type: 'N', group: 'Ceiling Light' },
  { id: 'BULB_E', label: 'BODY_E', x: 680, y: 290, type: 'E', group: 'Ceiling Light' },
];

const WIRE_COLORS = {
  L: { name: 'Live (Brown)', hex: '#8B4513' },
  N: { name: 'Neutral (Blue)', hex: '#0055FF' },
  E: { name: 'Earth (Green)', hex: '#00AA44' },
};

export default function CircuitSimulator() {
  const [selectedColor, setSelectedColor] = useState('L');
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [wires, setWires] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Select a wire color and click two terminals to connect them.');
  const [isBulbOn, setIsBulbOn] = useState(false);
  const [score, setScore] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle clicking on a terminal circle
  const handleTerminalClick = (terminal) => {
    setIsBulbOn(false); // Turn off power while editing wires

    if (!selectedTerminal) {
      // First terminal selected
      setSelectedTerminal(terminal);
      setStatusMessage(`Selected ${terminal.group} (${terminal.label}). Now click the destination terminal.`);
    } else {
      // Prevent connecting a terminal to itself
      if (selectedTerminal.id === terminal.id) {
        setSelectedTerminal(null);
        setStatusMessage('Selection cancelled.');
        return;
      }

      // Check if wire already exists between these two terminals
      const exists = wires.some(
        (w) =>
          (w.from.id === selectedTerminal.id && w.to.id === terminal.id) ||
          (w.from.id === terminal.id && w.to.id === selectedTerminal.id)
      );

      if (!exists) {
        const newWire = {
          id: `${selectedTerminal.id}-${terminal.id}`,
          from: selectedTerminal,
          to: terminal,
          wireType: selectedColor,
          colorHex: WIRE_COLORS[selectedColor].hex,
        };
        setWires([...wires, newWire]);
        setStatusMessage(`Connected ${selectedTerminal.label} to ${terminal.label} using ${WIRE_COLORS[selectedColor].name}.`);
      } else {
        setStatusMessage('These two terminals are already connected!');
      }

      setSelectedTerminal(null);
    }
  };

  // Remove a wire when clicked
  const handleRemoveWire = (wireId) => {
    setIsBulbOn(false);
    setWires(wires.filter((w) => w.id !== wireId));
    setStatusMessage('Wire removed.');
  };

  // Reset entire board
  const handleReset = () => {
    setWires([]);
    setSelectedTerminal(null);
    setIsBulbOn(false);
    setScore(null);
    setStatusMessage('Board cleared. Start wiring again.');
  };

  // Helper to check if two specific terminals are directly connected
  const isConnected = (id1, id2) => {
    return wires.find(
      (w) => (w.from.id === id1 && w.to.id === id2) || (w.from.id === id2 && w.to.id === id1)
    );
  };

  // Quality Check & Circuit Simulation Engine
  const handleTestCircuit = () => {
    // 1. Short Circuit Check (Direct connection between Live and Neutral/Earth)
    if (isConnected('MAIN_L', 'MAIN_N') || isConnected('MAIN_L', 'MAIN_E') || isConnected('SW_OUT', 'MAIN_N')) {
      setIsBulbOn(false);
      setScore(0);
      setStatusMessage('⚠️ DANGER: SHORT CIRCUIT DETECTED! Main MCB Tripped! Score: 0/100');
      return;
    }

    // 2. Check Required Connections
    const liveToSwitch = isConnected('MAIN_L', 'SW_IN');
    const switchToBulb = isConnected('SW_OUT', 'BULB_L');
    const neutralToBulb = isConnected('MAIN_N', 'BULB_N');
    const earthToBulb = isConnected('MAIN_E', 'BULB_E');

    if (!liveToSwitch || !switchToBulb || !neutralToBulb) {
      setIsBulbOn(false);
      setScore(30);
      setStatusMessage('❌ INCOMPLETE CIRCUIT: Power is not reaching the light properly through the switch. Score: 30/100');
      return;
    }

    // 3. Calculate Quality Score (Color coding + Earth safety)
    let calculatedScore = 60; // Base score for working circuit

    // Check Earth continuity (+20 points)
    if (earthToBulb) {
      calculatedScore += 20;
    }

    // Check Sri Lankan / IEC Color Code Compliance (+20 points)
    const properColors =
      liveToSwitch.wireType === 'L' &&
      switchToBulb.wireType === 'L' &&
      neutralToBulb.wireType === 'N' &&
      (!earthToBulb || earthToBulb.wireType === 'E');

    if (properColors) {
      calculatedScore += 20;
    }

    setIsBulbOn(true);
    setScore(calculatedScore);

    if (calculatedScore === 100) {
      setStatusMessage('✅ PERFECT! Circuit active, Earth bonded, and IEC color codes verified. Score: 100/100');
    } else if (!earthToBulb) {
      setStatusMessage(`⚠️ WORKING WITH WARNING: Bulb is ON, but Earth wire is missing! Score: ${calculatedScore}/100`);
    } else {
      setStatusMessage(`⚠️ WORKING WITH WARNING: Bulb is ON, but wrong wire colors were used! Score: ${calculatedScore}/100`);
    }
  };

  // Submit Score to ASP.NET Core 8 Backend
  const handleSubmitScore = async () => {
    if (score === null) return;
    setIsSubmitting(true);

    try {
      // Replace profileId with actual logged-in electrician's ID from AuthContext
      const response = await fetch('http://localhost:5192/api/Simulator/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electricianProfileId: 1,
          score: score,
          levelsCompleted: 1,
          passedQualityCheck: score >= 75,
        }),
      });

      if (response.ok) {
        alert('Simulator score successfully saved to your profile!');
      } else {
        alert('Failed to save score. Make sure backend is running.');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Network error while connecting to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ElectroSL 2D Circuit Quality Simulator</h1>
          <p className="text-sm text-slate-600">Level 1: Domestic Single-Phase Switch & Earthing Verification</p>
        </div>
        {score !== null && (
          <div className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold">
            Quality Score: {score} / 100
          </div>
        )}
      </div>

      {/* Toolbar: Wire Colors & Actions */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 items-center justify-between">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-semibold text-slate-700 mr-2">Select Wire:</span>
          {Object.entries(WIRE_COLORS).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedColor(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white transition ${
                selectedColor === key ? 'ring-4 ring-slate-300 scale-105' : 'opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: info.hex }}
            >
              {info.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold"
          >
            Clear Board
          </button>
          <button
            onClick={handleTestCircuit}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow"
          >
            ⚡ Flip Breaker (Test)
          </button>
          {score !== null && score >= 75 && (
            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow"
            >
              {isSubmitting ? 'Saving...' : 'Submit Verification Score'}
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium">
        {statusMessage}
      </div>

      {/* Konva 2D Canvas Stage */}
      <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex justify-center">
        <Stage width={850} height={420}>
          <Layer>
            {/* Background Grid Board */}
            <Rect x={0} y={0} width={850} height={420} fill="#f8fafc" />

            {/* Component 1: Main Supply Box */}
            <Group x={40} y={70}>
              <Rect width={120} height={260} fill="#1e293b" cornerRadius={8} shadowBlur={5} />
              <Text text="MAIN SUPPLY" x={15} y={15} fill="#ffffff" fontStyle="bold" fontSize={13} />
              <Text text="230V AC 50Hz" x={15} y={32} fill="#94a3b8" fontSize={11} />
            </Group>

            {/* Component 2: 1-Way Switch */}
            <Group x={350} y={80}>
              <Rect width={140} height={100} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2} cornerRadius={8} />
              <Text text="1-WAY SWITCH" x={22} y={15} fill="#334155" fontStyle="bold" fontSize={12} />
            </Group>

            {/* Component 3: Ceiling Light Fixture */}
            <Group x={660} y={70}>
              <Rect width={150} height={260} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2} cornerRadius={8} />
              <Text text="LIGHT FIXTURE" x={25} y={15} fill="#334155" fontStyle="bold" fontSize={12} />
              {/* Bulb Visual Indicator */}
              <Circle
                x={75}
                y={195}
                radius={28}
                fill={isBulbOn ? '#facc15' : '#cbd5e1'}
                stroke="#64748b"
                strokeWidth={2}
                shadowColor="#facc15"
                shadowBlur={isBulbOn ? 25 : 0}
              />
              <Text
                text={isBulbOn ? 'ON' : 'OFF'}
                x={63}
                y={189}
                fill={isBulbOn ? '#713f12' : '#475569'}
                fontStyle="bold"
                fontSize={12}
              />
            </Group>

            {/* Render Drawn Wires (Click a wire to delete it) */}
            {wires.map((wire) => (
              <Line
                key={wire.id}
                points={[
                  wire.from.x,
                  wire.from.y,
                  (wire.from.x + wire.to.x) / 2,
                  wire.from.y + 35, // Slight curve droop like a real wire
                  wire.to.x,
                  wire.to.y,
                ]}
                stroke={wire.colorHex}
                strokeWidth={5}
                tension={0.4}
                lineCap="round"
                onClick={() => handleRemoveWire(wire.id)}
                onMouseEnter={(e) => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'default';
                }}
              />
            ))}

            {/* Render Clickable Terminals */}
            {INITIAL_TERMINALS.map((term) => {
              const isSelected = selectedTerminal?.id === term.id;
              return (
                <Group
                  key={term.id}
                  x={term.x}
                  y={term.y}
                  onClick={() => handleTerminalClick(term)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'default';
                  }}
                >
                  <Circle
                    radius={10}
                    fill={isSelected ? '#f59e0b' : '#ffffff'}
                    stroke={isSelected ? '#b45309' : '#0f172a'}
                    strokeWidth={3}
                  />
                  <Text
                    text={term.label}
                    x={-20}
                    y={-24}
                    fill="#334155"
                    fontSize={11}
                    fontStyle="bold"
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Tip: Click any drawn wire directly on the board to disconnect/remove it.
      </p>
    </div>
  );
}