import { useState, useMemo, createContext, useContext } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import ConnectWallet from './components/ConnectWallet';
import Topbar       from './components/Topbar';
import Sidebar      from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import { useCycle } from './hooks/useCycle';

// ─── Language context ─────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    connectBtn:      'Connect MetaMask',
    connectingBtn:   'Connecting…',
    switchToLight:   'Light Mode',
    switchToDark:    'Dark Mode',
    switchToThai:    'ภาษาไทย',
    switchToEn:      'English',
    dashboard:       'Dashboard',
    systemDesign:    'System Design',
    cycleStatus:     'Cycle Status',
    priceFeed:       'Price Feed',
    liquidityPool:   'Liquidity Pool',
    openPosition:    'Open Position',
    myHoldings:      'My Holdings',
    masterDataTable: 'Master Data Declaration Table',
    selectSide:      'Select Side',
    collateralLabel: 'Collateral (ETH)',
    timePremierTier: 'Time Premium Tier',
    orderSummary:    'Order Summary',
    broadcasting:    'Broadcasting Tx…',
    noPositions:     'No open positions this cycle.',
    inTheMoney:      'ITM',
    outOfMoney:      'OTM',
    netReturned:     'Pool dependent',
    poolDependent:   'Capital return',
    hTotal:          'Total',
    hPosition:       'Position',
    hEntryTarget:    'Entry / Target',
    hCollateral:     'Collateral',
    hPosnStatus:     'Status',
    hEstPayout:      'Est. Payout',
    hOpened:         'Opened',
    p2pNote:         'P2P settlement — payouts funded by opposing pool',
    settledAtCycle:  'Settled at cycle end',
    rowCollateral:   'Collateral',
    rowTargetPrice:  'Target Price',
    rowEntryPrice:   'Entry Price',
    rowBasePremium:  'Base Premium',
    rowSkewFactor:   'Skew Factor',
    rowSkewPremium:  'Skew Premium',
    rowTimePremium:  'Time Premium',
    rowDeltaP:       'Price Delta',
    rowPriceSurcharge: 'Price Surcharge',
    rowTotalPremium: 'Total Premium',
    rowNetPosition:  'Net Position',
    rowEstPayout:    'Est. Payout',
    rowITMThreshold: 'ITM Threshold',
    rowPnL:          'Est. P&L',
    descCollateral:  'Initial ETH deposited by the trader',
    descTargetPrice: 'Oracle price at cycle start (P_final of previous cycle)',
    descEntryPrice:  'The Oracle price at the time of transaction',
    descBasePremium: 'Flat protocol fee: 0.10% of collateral',
    descSkewFactor:  'Multiplier based on pool imbalance (0.5× / 1× / 2×)',
    descSkewPremium: 'R_base × S_factor — dynamic supply/demand cost',
    descTimePremium: 'Phase-based urgency fee (0% stable / 2% warning / 5–10% critical)',
    descDeltaP:      '|P_entry − P_target| / P_target — relative move from strike',
    descPriceSurcharge: 'Risk adjustment based on price advantage (Capped at 70% of ΔP)',
    descTotalPremium: 'Total risk fees (R_skew + R_time + R_dist)',
    descNetPosition: 'Effective trading capital after premium deduction (N = C − C × Π)',
    descEstPayout:   'If ITM: N × (1 + ΔP) · If OTM: N (capital returned)',
    descITMThreshold: 'Long ITM if P_final > P_target; Short ITM if P_final < P_target',
    descPnL:         'Net gain/loss vs original collateral',
    costFees:        'Cost & Fees',
    priceProfit:     'Price & Profit',
    ifITM:           'If ITM',
    ifOTM:           'If OTM',
  },
  th: {
    connectBtn:      'เชื่อมต่อ MetaMask',
    connectingBtn:   'กำลังเชื่อมต่อ…',
    switchToLight:   'โหมดสว่าง',
    switchToDark:    'โหมดมืด',
    switchToThai:    'ภาษาไทย',
    switchToEn:      'English',
    dashboard:       'แดชบอร์ด',
    systemDesign:    'ออกแบบระบบ',
    cycleStatus:     'สถานะรอบ',
    priceFeed:       'ราคาตลาด',
    liquidityPool:   'กองทุนสภาพคล่อง',
    openPosition:    'เปิดสถานะ',
    myHoldings:      'สถานะของฉัน',
    masterDataTable: 'ตารางข้อมูลหลัก',
    selectSide:      'เลือกทิศทาง',
    collateralLabel: 'หลักประกัน (ETH)',
    timePremierTier: 'ระดับเบี้ยเวลา',
    orderSummary:    'สรุปคำสั่ง',
    broadcasting:    'กำลังส่งธุรกรรม…',
    noPositions:     'ยังไม่มีสถานะในรอบนี้',
    inTheMoney:      'กำไร (ITM)',
    outOfMoney:      'ขาดทุน (OTM)',
    netReturned:     'ขึ้นกับกอง',
    poolDependent:   'คืนทุน',
    hTotal:          'รวม',
    hPosition:       'สถานะ',
    hEntryTarget:    'ราคาเปิด/เป้า',
    hCollateral:     'หลักประกัน',
    hPosnStatus:     'สถานะ',
    hEstPayout:      'ผลตอบแทนคาด',
    hOpened:         'เปิดเมื่อ',
    p2pNote:         'P2P — ผลตอบแทนมาจากฝั่งตรงข้าม',
    settledAtCycle:  'ชำระเมื่อสิ้นรอบ',
    rowCollateral:   'หลักประกัน',
    rowTargetPrice:  'ราคาเป้าหมาย',
    rowEntryPrice:   'ราคาเปิด',
    rowBasePremium:  'เบี้ยฐาน',
    rowSkewFactor:   'ค่าเอียง',
    rowSkewPremium:  'เบี้ยเอียง',
    rowTimePremium:  'เบี้ยเวลา',
    rowDeltaP:       'ส่วนต่างราคา',
    rowPriceSurcharge: 'ค่าระยะห่างราคา',
    rowTotalPremium: 'เบี้ยรวม',
    rowNetPosition:  'สถานะสุทธิ',
    rowEstPayout:    'ผลตอบแทนคาด',
    rowITMThreshold: 'เกณฑ์ ITM',
    rowPnL:          'กำไร/ขาดทุนคาด',
    descCollateral:  'ETH ที่ฝากเป็นหลักประกัน',
    descTargetPrice: 'ราคาจาก Oracle เมื่อเริ่มรอบ',
    descEntryPrice:  'ราคา Oracle ณ เวลาที่เปิดสถานะ',
    descBasePremium: 'ค่าธรรมเนียมโปรโตคอล 0.10%',
    descSkewFactor:  'ตัวคูณตามความไม่สมดุลของกอง (0.5× / 1× / 2×)',
    descSkewPremium: 'R_base × S_factor — ค่าสมดุลอุปสงค์-อุปทาน',
    descTimePremium: 'เบี้ยตามช่วงเวลา (0% / 2% / 5–10%)',
    descDeltaP:      '|P_เปิด − P_เป้า| / P_เป้า',
    descPriceSurcharge: 'ค่าชดเชยความได้เปรียบราคา (สูงสุด 70% ของ ΔP)',
    descTotalPremium: 'เบี้ยรวมทั้งหมด (R_skew + R_time + R_dist)',
    descNetPosition: 'ทุนสุทธิหลังหักเบี้ย (N = C − C × Π)',
    descEstPayout:   'ITM: N × (1 + ΔP) · OTM: N (คืนทุน)',
    descITMThreshold: 'Long ITM เมื่อ P_final > P_target; Short ITM เมื่อ P_final < P_target',
    descPnL:         'กำไร/ขาดทุนสุทธิเทียบกับหลักประกัน',
    costFees:        'ค่าใช้จ่าย',
    priceProfit:     'ราคา & กำไร',
    ifITM:           'ถ้า ITM',
    ifOTM:           'ถ้า OTM',
  },
};

export const LangContext = createContext({ lang: 'en', t: TRANSLATIONS.en });
export const useLang = () => useContext(LangContext);

// ─── Inner app (uses wallet context) ────────────────────────────────────────

function AppInner({ lang, onToggleLang, darkMode, onToggleTheme }) {
  const { isConnected }            = useWallet();
  const { cycle }                  = useCycle();
  const [activePage, setActivePage] = useState('dashboard');

  const t = TRANSLATIONS[lang];

  if (!isConnected) {
    return (
      <div className="h-screen flex flex-col">
        <Topbar t={t} lang={lang} onToggleLang={onToggleLang} darkMode={darkMode} onToggleTheme={onToggleTheme} />
        <ConnectWallet t={t} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar t={t} lang={lang} onToggleLang={onToggleLang} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar t={t} activePage={activePage} onNavigate={setActivePage} cycle={cycle} />
        <main className="flex-1 overflow-hidden">
          {activePage === 'dashboard'
            ? <Dashboard t={t} />
            : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                System Design view coming soon
              </div>
            )
          }
        </main>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [lang,     setLang]     = useState('en');
  const [darkMode, setDarkMode] = useState(true);

  const toggleLang  = () => setLang(l => l === 'en' ? 'th' : 'en');
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.style.setProperty('--bg', next ? '#070b12' : '#f0f4f8');
    document.body.style.background = next ? '#070b12' : '#f0f4f8';
    document.body.style.color      = next ? '#e2e8f0' : '#0f172a';
  };

  const langCtx = useMemo(() => ({ lang, t: TRANSLATIONS[lang] }), [lang]);

  return (
    <LangContext.Provider value={langCtx}>
      <WalletProvider>
        <AppInner
          lang={lang}
          onToggleLang={toggleLang}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />
      </WalletProvider>
    </LangContext.Provider>
  );
}
