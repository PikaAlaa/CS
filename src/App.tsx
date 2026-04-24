import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Wifi, 
  Cpu, 
  Activity, 
  Search, 
  Flag, 
  Target, 
  Zap, 
  Lock, 
  Bluetooth, 
  Terminal, 
  BarChart3, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askCyberAI } from './services/geminiService';

// --- Types ---
interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  exp: string;
}

// --- Data Constants ---
const STANDARDS = [
  { name: '802.11', freq: '2.4 GHz', modulation: 'DSSS, FHSS', speed: '1-2 Mbps', range: '20-100m' },
  { name: '802.11a', freq: '5 & 3.7 GHz', modulation: 'OFDM', speed: 'Up to 54 Mbps', range: '35-100m' },
  { name: '802.11b', freq: '2.4 GHz', modulation: 'DSSS', speed: '1, 2, 5.5, 11 Mbps', range: '35-140m' },
  { name: '802.11g', freq: '2.4 GHz', modulation: 'OFDM', speed: 'Up to 54 Mbps', range: '38-140m' },
  { name: '802.11i', freq: 'Various', modulation: 'Encryption Focus', speed: 'WPA2 standard', range: 'Improved Security' },
  { name: '802.11n', freq: '2.4 & 5 GHz', modulation: 'MIMO-OFDM', speed: '54-600 Mbps', range: '70-250m' },
];

const ENCRYPTION = [
  { type: 'WEP', algo: 'RC4', iv: '24-bits', key: '40/104-bits', integrity: 'CRC-32', vuln: 'Extremely vulnerable; IV reuse, cleartext IVs' },
  { type: 'WPA', algo: 'RC4, TKIP', iv: '48-bits', key: '128-bits', integrity: 'Michael + CRC-32', vuln: 'Vulnerable to dictionary attacks and packet spoofing' },
  { type: 'WPA2', algo: 'AES-CCMP', iv: '48-bits', key: '128-bits', integrity: 'CBC-MAC', vuln: 'KRACK vulnerabilities; vulnerable to dictionary attacks if weak PSK' },
  { type: 'WPA3', algo: 'AES-GCMP 256', iv: 'Variable', key: '192-bits', integrity: 'BIP-GMAC-256', vuln: 'Dragonblood vulnerabilities; timing-based side-channel attacks' },
];

const ATTACK_TYPES = [
  { 
    title: 'Access Control', 
    icon: <Lock className="w-5 h-5" />, 
    attacks: ['WarDriving', 'Rogue Access Points', 'MAC Spoofing', 'AP Misconfiguration', 'Client Mis-association'],
    desc: 'Attacks aimed at penetrating a network by evading WLAN access control measures like MAC filters.'
  },
  { 
    title: 'Integrity', 
    icon: <Shield className="w-5 h-5" />, 
    attacks: ['Data Frame Injection', 'WEP Injection', 'Bit-Flipping Attacks', 'Extensible AP Replay', 'RADIUS Replay'],
    desc: 'Attackers send forged control, management, or data frames to misdirect the network or perform DoS.'
  },
  { 
    title: 'Confidentiality', 
    icon: <Search className="w-5 h-5" />, 
    attacks: ['Eavesdropping', 'Traffic Analysis', 'Evil Twin AP', 'aLTEr Attack', 'RFID Cloning', 'MITM Attack'],
    desc: 'Attempts to intercept confidential information or clone identifiers like RFID tags and mobile session IDs.'
  },
  { 
    title: 'Availability', 
    icon: <Zap className="w-5 h-5" />, 
    attacks: ['Jamming', 'DoS', 'Beacon Flood', 'GNSS Spoofing', 'Sinkhole / Wormhole'],
    desc: 'Obstructing services or spoofing navigation signals (GNSS) and routing paths.'
  },
];

const BLUETOOTH_ATTACKS = [
  { name: 'Bluesmacking', desc: 'A DoS attack that overflows Bluetooth devices with random packets, causing them to crash.' },
  { name: 'Bluejacking', desc: 'Sending unsolicited messages over Bluetooth to mobile phones and laptops.' },
  { name: 'Bluesnarfing', desc: 'Theft of information from a wireless device through a Bluetooth connection.' },
  { name: 'Bluebugging', desc: 'Remotely accessing a Bluetooth-enabled device and using its features (making calls, etc.).' },
  { name: 'Btlejacking', desc: 'Bypassing security mechanisms in Bluetooth Low Energy (BLE) to steal data.' },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "Which 802.11 standard introduces MIMO-OFDM and can operate on both 2.4 GHz and 5 GHz?",
    opts: ["802.11a", "802.11b", "802.11g", "802.11n"],
    a: 3,
    exp: "802.11n supports Multiple Input Multiple Output (MIMO) and operates on both frequency bands."
  },
  {
    q: "In WEP encryption, what is the size of the Initialization Vector (IV)?",
    opts: ["16-bits", "24-bits", "48-bits", "64-bits"],
    a: 1,
    exp: "WEP uses a 24-bit IV, which is too small and leads to IV reuse and weak encryption."
  },
  {
    q: "A rogue AP that pretends to be a legitimate AP by replicating its network name is known as:",
    opts: ["MAC Spoofing", "Evil Twin", "Bluejacking", "Wormhole Attack"],
    a: 1,
    exp: "An Evil Twin is a malicious AP that mimics a legitimate one to trick users into connecting."
  },
  {
    q: "Which Bluetooth attack involves sending unsolicited messages to a device?",
    opts: ["Bluesnarfing", "Bluebugging", "Bluesmacking", "Bluejacking"],
    a: 3,
    exp: "Bluejacking is the act of sending unwanted messages, unlike Snarfing which is about data theft."
  },
  {
    q: "What is the primary mechanism of the KRACK attack?",
    opts: ["Jamming signals", "Exploiting the 4-way handshake", "Bypassing MAC filtering", "Cracking the SSID"],
    a: 1,
    exp: "KRACK (Key Reinstallation Attack) works by forcing nonce reuse during the WPA2 4-way handshake."
  }
];

// --- Sub-Components ---

const SectionHeader = ({ title, badge }: { title: string, badge: string }) => (
  <div className="mb-12">
    <span className="text-[10px] font-mono tracking-[4px] text-cyan-400 mb-2 block uppercase">{badge}</span>
    <h2 className="text-3xl font-bold text-white font-orbitron tracking-tight">
      {title.split(' ').map((word, i) => i === title.split(' ').length - 1 ? <span key={i} className="text-cyan-400"> {word}</span> : word + ' ')}
    </h2>
  </div>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  color?: "cyan" | "red" | "green" | "orange";
}

const Card: React.FC<CardProps> = ({ children, className = "", color = "cyan" }) => {
  const shadowColor = {
    cyan: "shadow-[0_0_20px_#00e5ff33]",
    red: "shadow-[0_0_20px_#ff3d5733]",
    green: "shadow-[0_0_20px_#00ff8833]",
    orange: "shadow-[0_0_15px_#ff910022]"
  }[color];
  
  const borderClass = {
    cyan: "border-cyan-500/30",
    red: "border-red-500/30",
    green: "border-green-500/30",
    orange: "border-orange-500/30"
  }[color];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-[#0d1825] border ${borderClass} rounded-sm p-6 relative overflow-hidden group transition-all duration-300 ${shadowColor} ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-${color === 'cyan' ? 'cyan' : color === 'orange' ? 'orange' : color === 'red' ? 'red' : 'green'}-500/0 group-hover:bg-${color === 'cyan' ? 'cyan' : color === 'orange' ? 'orange' : color === 'red' ? 'red' : 'green'}-500/100 transition-all duration-300`} />
      {children}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [quizState, setQuizState] = useState<'intro' | 'active' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // Auto-scroll logic for sub-navigation
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(id);
  };

  const handleAiAsk = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiThinking(true);
    setAiResponse('');
    const res = await askCyberAI(aiPrompt);
    setAiResponse(res);
    setIsAiThinking(false);
  };

  const answerQuiz = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setAnswered(a => a + 1);
    if (idx === QUIZ_QUESTIONS[currentQ].a) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQ < QUIZ_QUESTIONS.length - 1) {
        setCurrentQ(q => q + 1);
        setSelectedOpt(null);
      } else {
        setQuizState('result');
      }
    }, 2500);
  };

  return (
    <div className="bg-[#050a0f] min-h-screen text-[#cce3f5] font-sans selection:bg-cyan-500/30 selection:text-cyan-400">
      
      {/* --- Sidebar Navigation --- */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-[#090f18] border-r border-[#1a3a5c] z-50 hidden lg:block overflow-y-auto pt-8">
        <div className="px-6 mb-10">
          <div className="font-orbitron font-bold text-lg text-cyan-400 tracking-widest leading-tight">
            CYBER<span className="text-white">SEC</span><br />
            <span className="text-[10px] font-mono text-cyan-400/50">ECE5303 WIRELESS_</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="px-6 py-2 text-[10px] font-mono text-[#3d6a8a] tracking-[3px] uppercase">Overview</div>
          <button onClick={() => scrollTo('hero')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'hero' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Shield className="w-4 h-4 mr-3" /> Attack Chain
          </button>

          <div className="px-6 py-2 mt-4 text-[10px] font-mono text-[#3d6a8a] tracking-[3px] uppercase">Chapter 1: Basics</div>
          <button onClick={() => scrollTo('standards')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'standards' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Wifi className="w-4 h-4 mr-3" /> 802.11 Standards
          </button>
          <button onClick={() => scrollTo('encryption')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'encryption' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Lock className="w-4 h-4 mr-3" /> Encryption Modes
          </button>

          <div className="px-6 py-2 mt-4 text-[10px] font-mono text-[#3d6a8a] tracking-[3px] uppercase">Chapter 2: Threats</div>
          <button onClick={() => scrollTo('threats')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'threats' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <AlertTriangle className="w-4 h-4 mr-3" /> Wireless Threats
          </button>
          <button onClick={() => scrollTo('methodology')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'methodology' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Target className="w-4 h-4 mr-3" /> Hacking Methodology
          </button>

          <div className="px-6 py-2 mt-4 text-[10px] font-mono text-[#3d6a8a] tracking-[3px] uppercase">Chapter 3: Others</div>
          <button onClick={() => scrollTo('bluetooth')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'bluetooth' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Bluetooth className="w-4 h-4 mr-3" /> Bluetooth Security
          </button>

          <div className="px-6 py-2 mt-4 text-[10px] font-mono text-[#3d6a8a] tracking-[3px] uppercase">Review</div>
          <button onClick={() => scrollTo('ai')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'ai' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <Sparkles className="w-4 h-4 mr-3" /> AI Assistant
          </button>
          <button onClick={() => scrollTo('quiz')} className={`w-full text-left px-6 py-3 text-sm flex items-center transition-all ${activeTab === 'quiz' ? 'bg-cyan-400/5 text-cyan-400 border-l-2 border-cyan-400' : 'hover:text-cyan-400'}`}>
            <BarChart3 className="w-4 h-4 mr-3" /> Knowledge Quiz
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="lg:ml-64 relative">
        
        {/* --- Hero Section --- */}
        <section id="hero" className="min-height-[90vh] flex items-center justify-center relative overflow-hidden py-24 px-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(26,58,92,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(26,58,92,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />
          <div className="max-w-4xl w-full relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono tracking-widest mb-6"
            >
              DR. HESHAM AFIFI // ECE5303
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-white font-orbitron mb-6 leading-tight"
            >
              Wireless <span className="text-cyan-400">Exploitation</span> & Security
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#7ba8cc] max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Explore the intricate world of wireless hacking, from footprinting and traffic analysis to cracking complex handshakes and securing modern 802.11 standards.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <button onClick={() => scrollTo('methodology')} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-orbitron text-xs tracking-widest px-8 py-4 flex items-center transition-all">
                EXPLORE METHODOLOGY <ChevronRight className="ml-2 w-4 h-4" />
              </button>
              <button onClick={() => scrollTo('quiz')} className="border border-[#1a3a5c] hover:border-cyan-400/50 text-[#7ba8cc] hover:text-cyan-400 font-bold font-orbitron text-xs tracking-widest px-8 py-4 transition-all">
                TAKE ASSESSMENT
              </button>
            </motion.div>
          </div>
        </section>

        {/* --- Standards Section --- */}
        <section id="standards" className="py-24 px-6 max-w-6xl mx-auto">
          <SectionHeader badge="Chapter 1: Basics" title="802.11 Wireless Standards" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STANDARDS.map((std, i) => (
              <Card key={i}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-cyan-400/10 p-2 rounded">
                    <Wifi className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/50">AMENDMENT</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron">{std.name}</h3>
                <div className="space-y-2 text-sm text-[#7ba8cc]">
                  <div className="flex justify-between border-b border-[#1a3a5c] pb-1">
                    <span className="opacity-50">Frequency</span>
                    <span className="text-white">{std.freq}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a3a5c] pb-1">
                    <span className="opacity-50">Modulation</span>
                    <span className="text-white">{std.modulation}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a3a5c] pb-1">
                    <span className="opacity-50">Max Speed</span>
                    <span className="text-white">{std.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Range</span>
                    <span className="text-white">{std.range}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* --- Encryption Section --- */}
        <section id="encryption" className="py-24 px-6 bg-[#090f18]/50">
          <div className="max-w-6xl mx-auto">
            <SectionHeader badge="Protocols" title="Wireless Encryption Evolution" />
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1a3a5c]">
                    <th className="py-4 font-mono text-[10px] text-[#3d6a8a] tracking-widest">ENCRYPTION TYPE</th>
                    <th className="py-4 font-mono text-[10px] text-[#3d6a8a] tracking-widest">ALGORITHM</th>
                    <th className="py-4 font-mono text-[10px] text-[#3d6a8a] tracking-widest">IV SIZE</th>
                    <th className="py-4 font-mono text-[10px] text-[#3d6a8a] tracking-widest">INTEGRITY CHECK</th>
                    <th className="py-4 font-mono text-[10px] text-[#3d6a8a] tracking-widest">VULNERABILITIES</th>
                  </tr>
                </thead>
                <tbody>
                  {ENCRYPTION.map((enc, i) => (
                    <tr key={i} className="group hover:bg-cyan-400/5 transition-colors border-b border-[#1a3a5c]/30">
                      <td className="py-6 pr-4">
                        <div className="font-orbitron font-bold text-white">{enc.type}</div>
                        <div className="text-[10px] text-cyan-400 mt-1">{enc.key} Length</div>
                      </td>
                      <td className="py-6 pr-4 text-sm text-[#7ba8cc] font-mono">{enc.algo}</td>
                      <td className="py-6 pr-4 text-sm text-[#7ba8cc] font-mono">{enc.iv}</td>
                      <td className="py-6 pr-4 text-sm text-[#7ba8cc] font-mono">{enc.integrity}</td>
                      <td className="py-6 pr-4 text-xs text-red-400/80 italic leading-relaxed">{enc.vuln}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-sm">
                <h4 className="text-red-400 font-bold mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Legacy Warning
                </h4>
                <p className="text-sm text-red-100/60 leading-relaxed">
                  WEP and original WPA are obsolete. Minimal security standards today require WPA2-AES (CCMP). WPA3 is mandatory for modern 6GHz networks (Wi-Fi 6E/7) to protect against offline dictionary attacks.
                </p>
              </div>
              <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-sm">
                <h4 className="text-green-400 font-bold mb-3 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Best Practices
                </h4>
                <p className="text-sm text-green-100/60 leading-relaxed">
                  Use WPA2 Enterprise (802.1X) for accountability and individual authentication. Enable WPA3 whenever hardware supports it for robust forward secrecy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Threats & Methodology --- */}
        <section id="threats" className="py-24 px-6 max-w-6xl mx-auto">
          <SectionHeader badge="Chapter 2: Threats" title="Wireless Attack Landscape" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ATTACK_TYPES.map((cat, i) => (
              <Card key={i} color={i % 2 === 0 ? "orange" : "red"} className="h-full">
                <div className="flex items-center mb-6">
                  <div className="bg-[#1a3a5c] p-3 rounded mr-4">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-orbitron">{cat.title} Attacks</h3>
                    <p className="text-[10px] text-[#3d6a8a] font-mono mt-1">CVE CLASSIFICATION</p>
                  </div>
                </div>
                <p className="text-sm text-[#7ba8cc] mb-6 leading-relaxed">
                  {cat.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.attacks.map((atk, j) => (
                    <span key={j} className="text-[10px] px-3 py-1 bg-[#050a0f] border border-[#1a3a5c] text-cyan-400/70 rounded-full font-mono">
                      {atk}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div id="methodology" className="mt-24">
            <SectionHeader badge="Hacking Methodology" title="The Wireless Pentest Cycle" />
            <div className="relative">
              {/* Methodology Timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-cyan-400/20" />
              <div className="space-y-12">
                {[
                  { step: '01', title: 'Footprinting / Discovery', content: 'Passive (sniffing SSIDs, BSSIDs) or Active (sending probe requests). Tools: inSSIDer, NetSurveyor, WiGLE.', color: 'cyan' },
                  { step: '02', title: 'Traffic Analysis', content: 'Identifying targets, sniff frames (802.11 monitor mode). Determine encryption (WEP/WPA), identify hidden SSIDs.', color: 'blue' },
                  { step: '03', title: 'Vulnerability Analysis', content: 'Checking for WPS-enabled APs (Reaver), weak PSKs, or legacy firmware. Mapping the target network.', color: 'purple' },
                  { step: '04', title: 'Exploitation', content: 'Launching Evil Twin, MAC Spoofing, KRACK attack, or brute-forcing handshakes via Aircrack-ng.', color: 'red' },
                  { step: '05', title: 'Maintaining Access', content: 'Deploying Rogue APs for backdoor persistence, credential harvesting, or lateral network movement.', color: 'orange' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative pl-12"
                  >
                    <div className="absolute left-[2px] top-1 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-xs ring-4 ring-[#050a0f] z-10 shadow-[0_0_10px_#00e5ff]">
                      {item.step}
                    </div>
                    <Card color={i === 4 ? "red" : "cyan"} className="py-4 px-6 border-none bg-cyan-400/5">
                      <h4 className="text-white font-bold font-orbitron text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-[#7ba8cc]">{item.content}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- Bluetooth Section --- */}
        <section id="bluetooth" className="py-24 px-6 bg-[#090f18]/50">
          <div className="max-w-6xl mx-auto">
            <SectionHeader badge="Chapter 3: Others" title="Bluetooth Hacking & Security" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Card className="mb-8 border-blue-500/30">
                  <div className="flex items-center mb-4">
                    <Bluetooth className="w-8 h-8 text-blue-400 mr-4" />
                    <h3 className="text-xl font-bold font-orbitron">The Bluetooth Stack</h3>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-200">APPLICATION LAYER</div>
                    <div className="p-4 bg-blue-400/5 border border-blue-400/20">
                      <div className="text-blue-300/50 mb-2">MIDDLEWARE PROTOCOL GROUP</div>
                      <div className="flex gap-2">
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">SDP</span>
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">RFCOMM</span>
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">L2CAP</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#0d1825] border border-[#1a3a5c] text-cyan-400/50">HCI (Host Controller Interface)</div>
                    <div className="p-4 bg-blue-900/10 border border-blue-900/30">
                      <div className="text-blue-300/50 mb-2">TRANSPORT PROTOCOL GROUP</div>
                      <div className="flex gap-2">
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">Link Manager</span>
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">Baseband</span>
                        <span className="bg-[#1a3a5c] px-2 py-1 rounded">Radio</span>
                      </div>
                    </div>
                  </div>
                </Card>
                <div className="infobox p-4 bg-cyan-400/5 border-l-4 border-cyan-400 rounded-r">
                   <p className="text-sm italic text-[#7ba8cc]">"Bluetooth is a short-range wireless communication technology (IEEE 802.15.1) designed to replace cables connecting portable devices while maintaining high security levels."</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {BLUETOOTH_ATTACKS.map((atk, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-[#0d1825] border border-[#1a3a5c] hover:border-blue-400/50 transition-all rounded"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-blue-400 font-orbitron text-sm">{atk.name}</h4>
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_#60a5fa]" />
                    </div>
                    <p className="text-xs text-[#7ba8cc] leading-relaxed">{atk.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- AI Explainer --- */}
        <section id="ai" className="py-24 px-6 max-w-4xl mx-auto">
          <SectionHeader badge="Concept Explainer" title="The AI Security Tutor" />
          
          <div className="bg-[#0d1825] border border-cyan-500/20 rounded shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="bg-[#090f18] p-4 border-b border-[#1a3a5c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
                <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">CYBERSEC_AGENT [ONLINE]</span>
              </div>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-green-500/30" />
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 flex flex-wrap gap-2">
                {['Explain 4-way handshake', 'What is KRACK attack?', 'WEP vs WPA2 security', 'Rogue AP detection'].map((chip) => (
                  <button 
                    key={chip}
                    onClick={() => setAiPrompt(chip)}
                    className="text-[10px] px-3 py-1 bg-cyan-400/5 border border-cyan-400/20 hover:border-cyan-400/60 text-cyan-400 transition-all rounded font-mono"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-4">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Query my knowledge core about wireless security topics..."
                  className="flex-1 bg-[#050a0f] border border-[#1a3a5c] p-4 text-sm text-cyan-100 rounded focus:border-cyan-400 outline-none transition-all resize-none min-h-[80px]"
                />
                <button 
                  onClick={handleAiAsk}
                  disabled={isAiThinking}
                  className={`px-6 bg-cyan-500 hover:bg-cyan-400 text-black rounded flex flex-col items-center justify-center transition-all ${isAiThinking ? 'opacity-50' : ''}`}
                >
                  <Send className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold font-orbitron">EXECUTE</span>
                </button>
              </div>
              
              <AnimatePresence>
                {(aiResponse || isAiThinking) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-[#1a3a5c] text-sm text-[#7ba8cc] leading-relaxed font-sans prose prose-invert prose-cyan max-w-none"
                  >
                    {isAiThinking ? (
                      <div className="flex items-center gap-3 italic text-cyan-400/50 font-mono animate-pulse">
                        <Terminal className="w-4 h-4 animate-bounce" /> Processing neural query...
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* --- Quiz Section --- */}
        <section id="quiz" className="py-24 px-6 max-w-4xl mx-auto">
          <SectionHeader badge="Assessment" title="Knowledge Assessment Core" />
          
          <div className="bg-[#0d1825] border border-[#1a3a5c] rounded p-8">
            {quizState === 'intro' && (
              <div className="text-center py-10">
                <Activity className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold font-orbitron text-white mb-4">Are you ready, operative?</h3>
                <p className="text-[#7ba8cc] mb-10">Test your mastery of 802.11, encryption protocols, and attack vectors.</p>
                <button onClick={() => setQuizState('active')} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-orbitron px-10 py-4 transition-all">
                  INITIALIZE ASSESSMENT
                </button>
              </div>
            )}

            {quizState === 'active' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-mono text-[#3d6a8a] tracking-widest uppercase">QUESTION {currentQ + 1} OF {QUIZ_QUESTIONS.length}</span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded">SCORE: {score}/{answered}</span>
                </div>
                
                <div className="w-full bg-[#050a0f] h-1 mb-10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%` }}
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#00e5ff]"
                  />
                </div>

                <h3 className="text-xl font-bold text-white mb-8 leading-relaxed font-orbitron">
                  {QUIZ_QUESTIONS[currentQ].q}
                </h3>

                <div className="grid gap-4">
                  {QUIZ_QUESTIONS[currentQ].opts.map((opt, i) => {
                    let btnClass = "border-[#1a3a5c] text-[#7ba8cc] hover:border-cyan-400 hover:text-cyan-400 bg-[#090f18]";
                    if (selectedOpt !== null) {
                      if (i === QUIZ_QUESTIONS[currentQ].a) {
                        btnClass = "border-green-500 bg-green-500/10 text-green-400";
                      } else if (i === selectedOpt) {
                        btnClass = "border-red-500 bg-red-500/10 text-red-400";
                      } else {
                        btnClass = "border-[#1a3a5c] text-[#7ba8cc] opacity-30";
                      }
                    }

                    return (
                      <button 
                        key={i}
                        disabled={selectedOpt !== null}
                        onClick={() => answerQuiz(i)}
                        className={`w-full text-left p-5 border rounded transition-all flex items-center justify-between group ${btnClass}`}
                      >
                        <span className="flex items-center">
                          <span className="w-6 h-6 rounded-full border border-current font-mono text-[10px] flex items-center justify-center mr-4">
                            {'ABCD'[i]}
                          </span>
                          {opt}
                        </span>
                        {selectedOpt !== null && i === QUIZ_QUESTIONS[currentQ].a && <CheckCircle2 className="w-5 h-5" />}
                        {selectedOpt !== null && i === selectedOpt && i !== QUIZ_QUESTIONS[currentQ].a && <XCircle className="w-5 h-5" />}
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {selectedOpt !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-cyan-400/5 border border-cyan-400/20 rounded"
                    >
                      <div className="text-[10px] font-mono text-cyan-400 tracking-widest mb-2 uppercase flex items-center">
                        <Info className="w-3 h-3 mr-2" /> EXPLANATION_NOTE
                      </div>
                      <p className="text-sm italic leading-relaxed">
                        {QUIZ_QUESTIONS[currentQ].exp}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {quizState === 'result' && (
              <div className="text-center py-10">
                <div className="text-6xl font-black font-orbitron text-cyan-400 mb-4">{Math.round((score / QUIZ_QUESTIONS.length) * 100)}%</div>
                <h3 className="text-2xl font-bold font-orbitron text-white mb-2">ASSESSMENT COMPLETE</h3>
                <p className="text-[#3d6a8a] mb-10 tracking-widest text-xs font-mono">OPERATIVE SCORE: {score} / {QUIZ_QUESTIONS.length}</p>
                
                <div className="max-w-xs mx-auto mb-10">
                  <div className="h-2 w-full bg-[#1a3a5c] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${score >= 4 ? 'bg-green-500 shadow-[0_0_10px_#00ff88]' : 'bg-red-500 shadow-[0_0_10px_#ff3d57]'}`} 
                      style={{ width: `${(score / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setQuizState('intro');
                    setCurrentQ(0);
                    setScore(0);
                    setSelectedOpt(null);
                  }} 
                  className="border border-cyan-400 text-cyan-400 font-bold font-orbitron text-xs tracking-widest px-10 py-4 hover:bg-cyan-400 hover:text-black transition-all flex items-center mx-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-3" /> REINITIALIZE ASSESSMENT
                </button>
              </div>
            )}
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="py-20 border-t border-[#1a3a5c] bg-[#050a0f] text-center">
          <div className="font-orbitron font-bold text-[#3d6a8a] text-sm tracking-[5px] mb-4">ECE5303 // WIRELESS SECURITY</div>
          <div className="text-[#3d6a8a] text-[10px] font-mono mb-8 uppercase tracking-[2px]">Interactive Study Guide | Faculty of Engineering</div>
          <p className="text-xs text-[#3d6a8a] opacity-50 px-6 max-w-md mx-auto leading-relaxed">
            Proprietary study material designed for interactive mastery of wireless penetration testing and defensive engineering.
          </p>
        </footer>

      </main>
    </div>
  );
}
