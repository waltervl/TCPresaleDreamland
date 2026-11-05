'use strict';

// Built-in demo data. No AI and no network access needed.

const n = (name, desc, ...items) => ({ name, desc, items });

const ITEM_CATALOG = {
  Automotive: [
    ['Turbocharger', 'Boosts engine power via forced induction'],
    ['Brake caliper', 'Clamps pads against the brake disc'],
    ['Fuel injector', 'Sprays metered fuel into the cylinder'],
    ['Alternator', 'Charges battery while engine runs'],
    ['Catalytic converter', 'Reduces toxic exhaust gas emissions'],
    ['Oxygen sensor', 'Measures oxygen content in exhaust'],
    ['Water pump', 'Circulates coolant through the engine'],
    ['Clutch assembly', 'Couples engine to the transmission'],
    ['Shock absorber', 'Damps suspension movement and vibration'],
    ['Steering rack', 'Converts steering wheel rotation to wheel angle'],
    ['Starter motor', 'Cranks the engine to start it'],
    ['Timing belt', 'Synchronises crankshaft and camshaft rotation'],
  ],
  Aerospace: [
    ['Turbofan engine', 'Provides thrust using bypass air'],
    ['Flight control computer', 'Calculates control surface commands'],
    ['Landing gear actuator', 'Extends and retracts the landing gear'],
    ['Pitot tube', 'Measures airspeed from dynamic pressure'],
    ['Inertial navigation unit', 'Tracks position using gyros and accelerometers'],
    ['Wing flap', 'Increases lift at low speeds'],
    ['Cabin pressure controller', 'Regulates cabin pressure during flight'],
    ['Fuel boost pump', 'Delivers fuel to the engines'],
    ['Weather radar', 'Detects precipitation ahead of the aircraft'],
    ['Hydraulic accumulator', 'Stores hydraulic energy for control systems'],
    ['Transponder', 'Replies to air traffic control interrogations'],
    ['Ram air turbine', 'Provides emergency power in flight'],
  ],
  Electronics: [
    ['Microcontroller', 'Runs embedded control firmware'],
    ['Voltage regulator', 'Maintains a stable supply voltage'],
    ['Printed circuit board', 'Connects components with copper traces'],
    ['MOSFET', 'Switches current with a gate voltage'],
    ['Crystal oscillator', 'Generates a precise clock frequency'],
    ['Lithium-ion cell', 'Stores rechargeable electrical energy'],
    ['Capacitor', 'Stores charge and filters supply noise'],
    ['Temperature sensor', 'Measures ambient or component temperature'],
    ['Bluetooth module', 'Provides short-range wireless connectivity'],
    ['OLED display', 'Shows self-lit pixel graphics'],
    ['USB-C connector', 'Carries power and data between devices'],
    ['Flash memory chip', 'Stores firmware and data non-volatilely'],
  ],
  Medical: [
    ['Infusion pump', 'Delivers fluids at a controlled rate'],
    ['Pulse oximeter', 'Measures blood oxygen saturation'],
    ['Defibrillator', 'Delivers shock to restore heart rhythm'],
    ['Ventilator', 'Assists or replaces patient breathing'],
    ['ECG monitor', 'Records electrical activity of the heart'],
    ['Surgical stapler', 'Closes tissue using metal staples'],
    ['Syringe driver', 'Dispenses medication from a syringe'],
    ['Ultrasound transducer', 'Emits and receives imaging sound waves'],
    ['Blood pressure cuff', 'Measures arterial pressure non-invasively'],
    ['Endoscope', 'Allows visual inspection inside the body'],
    ['Dialysis filter', 'Removes waste from the blood'],
    ['Hospital bed actuator', 'Adjusts bed height and position'],
  ],
  Industrial: [
    ['Servo motor', 'Provides precise position and speed control'],
    ['Programmable logic controller', 'Executes automation control logic'],
    ['Pneumatic cylinder', 'Produces linear motion from compressed air'],
    ['Gearbox', 'Reduces speed and increases torque'],
    ['Proximity sensor', 'Detects nearby objects without contact'],
    ['Industrial robot arm', 'Performs repeatable handling and welding tasks'],
    ['Conveyor belt', 'Transports products along a line'],
    ['Hydraulic pump', 'Converts mechanical power to fluid power'],
    ['Variable frequency drive', 'Controls AC motor speed'],
    ['Linear guide rail', 'Guides smooth linear movement of loads'],
    ['Safety light curtain', 'Stops machines when beams are broken'],
    ['Torque wrench', 'Tightens fasteners to a set torque'],
  ],
  Energy: [
    ['Wind turbine blade', 'Captures wind energy as rotation'],
    ['Solar panel', 'Converts sunlight into electricity'],
    ['Power inverter', 'Converts DC power to grid AC'],
    ['Transformer', 'Changes AC voltage levels'],
    ['Battery storage rack', 'Stores energy for later use'],
    ['Circuit breaker', 'Interrupts current during fault conditions'],
    ['Smart meter', 'Records electricity usage remotely'],
    ['Heat exchanger', 'Transfers heat between two fluids'],
    ['Steam turbine', 'Converts steam energy into rotation'],
    ['Generator rotor', 'Creates the rotating magnetic field'],
    ['Charge controller', 'Regulates battery charging from solar'],
    ['Busbar', 'Distributes high current within switchgear'],
  ],
};

const BOM_CATALOG = {
  Turbocharger: n('Turbocharger', 'Boosts engine power via forced induction',
    n('Compressor section', 'Draws and compresses intake air',
      n('Compressor wheel', 'Rotating aluminium impeller'),
      n('Compressor housing', 'Cast shell guiding airflow'),
      n('Diffuser', 'Converts air velocity into pressure')),
    n('Turbine section', 'Uses exhaust gas energy',
      n('Turbine wheel', 'High-temp nickel alloy rotor'),
      n('Turbine housing', 'Ducts exhaust to wheel'),
      n('Wastegate', 'Bypasses exhaust to limit boost')),
    n('Bearing housing', 'Supports the rotating shaft',
      n('Shaft', 'Connects turbine and compressor wheels'),
      n('Journal bearing', 'Floating oil-film radial bearing'),
      n('Thrust bearing', 'Limits axial shaft movement'),
      n('Oil seal', 'Prevents oil leaking into airflow'))),
  Bicycle: n('Bicycle', 'Human-powered two-wheeled vehicle',
    n('Frame assembly', 'Main structural body of the bike',
      n('Frame', 'Welded aluminium main triangle'),
      n('Fork', 'Holds the front wheel'),
      n('Headset', 'Bearings allowing the fork to turn')),
    n('Drivetrain', 'Transfers pedalling power to the wheel',
      n('Crankset', 'Pedal arms and chainrings'),
      n('Chain', 'Links crankset to cassette'),
      n('Cassette', 'Set of rear sprockets'),
      n('Rear derailleur', 'Shifts chain between sprockets')),
    n('Wheel set', 'Front and rear wheels',
      n('Rim', 'Outer ring holding the tyre'),
      n('Hub', 'Central part rotating on the axle'),
      n('Spoke set', 'Tensioned wires connecting hub and rim'),
      n('Tyre', 'Rubber tyre providing grip')),
    n('Braking system', 'Slows and stops the bike',
      n('Brake lever', 'Handlebar-mounted control'),
      n('Brake caliper', 'Presses pads on the rotor'),
      n('Brake rotor', 'Steel disc on the wheel hub'))),
  Drone: n('Quadcopter Drone', 'Four-rotor unmanned aerial vehicle',
    n('Airframe', 'Structure carrying all components',
      n('Centre plate', 'Carbon fibre mounting plate'),
      n('Arm', 'Carbon tube holding a motor'),
      n('Landing skid', 'Protects the drone on landing')),
    n('Propulsion', 'Generates lift and thrust',
      n('Brushless motor', 'Outrunner motor driving a propeller'),
      n('Propeller', 'Two-blade composite rotor'),
      n('Electronic speed controller', 'Drives the motor phases')),
    n('Avionics', 'Flight control and navigation',
      n('Flight controller', 'Stabilises attitude using IMU data'),
      n('GPS module', 'Provides position and velocity'),
      n('Radio receiver', 'Receives pilot control commands')),
    n('Power system', 'Supplies electrical energy',
      n('LiPo battery', 'Rechargeable four-cell flight battery'),
      n('Power distribution board', 'Routes battery power to units'))),
  'Electric Motor': n('Electric Motor', 'Converts electrical energy to rotation',
    n('Stator', 'Stationary part carrying the windings',
      n('Stator core', 'Laminated steel magnetic path'),
      n('Winding', 'Copper coils creating the field'),
      n('Slot insulation', 'Isolates windings from the core')),
    n('Rotor', 'Rotating part of the motor',
      n('Rotor core', 'Laminated steel rotor stack'),
      n('Permanent magnet', 'Neodymium magnet creating rotor field'),
      n('Shaft', 'Transmits torque to the load')),
    n('Housing', 'Encloses and supports the motor',
      n('Motor casing', 'Aluminium cooling-finned shell'),
      n('End shield', 'Holds the bearings'),
      n('Bearing', 'Deep groove ball bearing')),
    n('Sensor package', 'Provides feedback to the controller',
      n('Encoder', 'Measures rotor position'),
      n('Thermistor', 'Monitors winding temperature'))),
  'Washing Machine': n('Washing Machine', 'Household clothes washing appliance',
    n('Drum assembly', 'Holds and rotates the laundry',
      n('Inner drum', 'Perforated stainless steel drum'),
      n('Outer tub', 'Holds water around the drum'),
      n('Drum bearing', 'Supports drum rotation')),
    n('Drive system', 'Spins the drum',
      n('Drive motor', 'Inverter-controlled brushless motor'),
      n('Drive belt', 'Transfers motor torque to drum')),
    n('Water system', 'Fills and drains water',
      n('Inlet valve', 'Controls water entering the machine'),
      n('Drain pump', 'Removes water after washing'),
      n('Heating element', 'Heats the wash water')),
    n('Control system', 'Manages wash programs',
      n('Control board', 'Runs the wash program logic'),
      n('User interface panel', 'Dial, buttons and display'),
      n('Door lock', 'Locks the door during the cycle'))),
};

const REQ_CATEGORIES = [
  ['Functional requirements', 'What the product must do', [
    ['Primary function', 'The {p} shall perform its intended primary function'],
    ['Operating modes', 'The {p} shall support normal and standby modes'],
    ['Fault indication', 'The {p} shall indicate detected faults to the user'],
  ]],
  ['Performance requirements', 'How well the product must perform', [
    ['Efficiency', 'The {p} shall achieve at least 90 percent efficiency'],
    ['Response time', 'The {p} shall respond to commands within 100 ms'],
    ['Capacity', 'The {p} shall meet the specified rated capacity'],
  ]],
  ['Environmental requirements', 'Conditions the product must tolerate', [
    ['Operating temperature', 'The {p} shall operate from -20 to 60 degrees Celsius'],
    ['Humidity', 'The {p} shall tolerate 95 percent non-condensing humidity'],
    ['Vibration', 'The {p} shall withstand vibration per IEC 60068-2-6'],
  ]],
  ['Safety requirements', 'Protection of people and equipment', [
    ['Overload protection', 'The {p} shall protect itself against overload'],
    ['Safe failure', 'The {p} shall fail to a safe state'],
    ['Hazard labelling', 'The {p} shall carry clear hazard warnings'],
  ]],
  ['Reliability and maintenance', 'Lifetime and serviceability', [
    ['Service life', 'The {p} shall have a service life of 10 years'],
    ['Mean time between failures', 'The {p} shall reach an MTBF of 20000 hours'],
    ['Serviceability', 'The {p} shall allow key parts to be replaced in 30 minutes'],
  ]],
];

const pick = (arr, k) => [...arr].sort(() => Math.random() - 0.5).slice(0, k);
const norm = (s) => String(s || '').trim().toLowerCase();

function findKey(obj, name) {
  const q = norm(name);
  if (!q) return null;
  return Object.keys(obj).find((k) => norm(k) === q) || Object.keys(obj).find((k) => norm(k).includes(q) || q.includes(norm(k))) || null;
}

const wrapItem = (i) => ({ name: i[0], desc: i[1], type: 'Item', enabled: true });

function demoItems(domainName, count) {
  const key = findKey(ITEM_CATALOG, domainName);
  const pool = key ? ITEM_CATALOG[key] : Object.values(ITEM_CATALOG).flat();
  const k = Math.max(1, Math.min(Number(count) || 5, pool.length));
  return (key ? pool.slice(0, k) : pick(pool, k)).map(wrapItem);
}

const copyNode = (node, depth, maxDepth) => ({
  name: node.name,
  desc: node.desc,
  type: 'Item',
  enabled: true,
  items: depth >= maxDepth ? [] : (node.items || []).map((c) => copyNode(c, depth + 1, maxDepth)),
});

/** `depth` = number of BOM levels below the root (1–3). */
function demoBom(productName, depth) {
  const key = findKey(BOM_CATALOG, productName);
  const template = BOM_CATALOG[key || pick(Object.keys(BOM_CATALOG), 1)[0]];
  const tree = copyNode(template, 0, Math.max(1, Math.min(Number(depth) || 2, 3)));
  if (!key && productName) tree.name = productName.trim();
  return [tree];
}

/** `count` = number of requirement categories (1–5). */
function demoReqSpec(productName, count) {
  const p = (productName || 'product').trim();
  const k = Math.max(1, Math.min(Number(count) || 3, REQ_CATEGORIES.length));
  return [
    {
      name: `${p} Requirements Specification`,
      desc: `Requirements for the ${p}`,
      type: 'Item',
      enabled: true,
      items: REQ_CATEGORIES.slice(0, k).map(([name, desc, reqs]) => ({
        name,
        desc,
        type: 'Item',
        enabled: true,
        items: reqs.map(([rn, rd]) => ({ name: rn, desc: rd.replace('{p}', p), type: 'Item', enabled: true, items: [] })),
      })),
    },
  ];
}

const knownDomains = () => Object.keys(ITEM_CATALOG);
const knownProducts = () => Object.keys(BOM_CATALOG);

module.exports = { demoItems, demoBom, demoReqSpec, knownDomains, knownProducts };
