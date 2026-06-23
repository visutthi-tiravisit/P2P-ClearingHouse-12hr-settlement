import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Navigation tree ──────────────────────────────────────────────────────────

const NAV = [
  {
    section: 'ภาพรวม',
    items: [
      { id: 'overview',   label: 'ภาพรวมโครงการ' },
      { id: 'actors',     label: 'ผู้มีส่วนร่วม (Actors)' },
      { id: 'happyflow',  label: 'เส้นทางหลัก (Happy Flow)' },
    ],
  },
  {
    section: 'เริ่มต้นใช้งาน',
    items: [
      { id: 'uc01', label: 'UC-01 · เชื่อมต่อกระเป๋า' },
      { id: 'uc02', label: 'UC-02 · ยกเลิกการเชื่อมต่อ' },
    ],
  },
  {
    section: 'การทำรายการ',
    items: [
      { id: 'uc-long', label: 'UC · เปิด Long Order' },
    ],
  },
];

// ─── Page content ─────────────────────────────────────────────────────────────

const PAGES = {
  overview: {
    title: 'P2P ClearingHouse',
    badge: 'ภาพรวมโครงการ',
    sections: [
      {
        heading: 'P2P ClearingHouse คืออะไร?',
        body: 'P2P ClearingHouse คือโปรโตคอลการชำระเงินแบบกระจายศูนย์บน Ethereum Sepolia testnet ผู้เล่นเปิดสถานะ Long หรือ Short บนทิศทางราคา ETH/USD ภายในรอบการซื้อขายที่กำหนดไว้ล่วงหน้า 12 ชั่วโมง ผลตอบแทนมาจากฝั่งตรงข้ามโดยตรง — ไม่มี market maker หรือ liquidity provider',
      },
      {
        heading: 'ที่มาและความเป็นมา',
        body: 'ตลาดอนุพันธ์ระดับสากลอย่าง Binance หรือ Deribit แม้จะให้บริการออปชัน (Options) แต่สัญญาที่สั้นที่สุดมักเริ่มต้นที่ 1 วัน (Daily Options) ซึ่งนานเกินไปสำหรับการป้องกันความเสี่ยงในระหว่างวัน (Intraday Hedging) นอกจากนี้ ระบบสมุดคำสั่ง (Order Book) ยังกระจายสภาพคล่องตามราคาใช้สิทธิ (Strike Price) ที่หลากหลาย ทำให้ผู้ใช้รายย่อยประสบปัญหาไม่มีคู่สัญญา (Lack of Counterparty) หรือมี Spread สูงจนบริหารความเสี่ยงไม่ได้\n\nยิ่งกว่านั้น สัญญาออปชันแบบดั้งเดิม (Vanilla Options) มีลักษณะ All-or-Nothing — หากราคาไม่ถึงราคาใช้สิทธิภายในเวลาที่กำหนด ผู้ซื้อสูญเสียเบี้ยประกัน 100% แม้ราคาจะขยับถูกทิศทางแต่ยังไม่ถึงเป้าก็ตาม',
      },
      {
        heading: 'แนวทางการแก้ปัญหา',
        body: '1. Pooling แทน Order Book — รวมสภาพคล่องในกองกลาง ผู้ใช้เปิดสถานะได้ทันทีโดยไม่ต้องรอคู่สัญญา\n2. Linear Settlement — ชำระตามระยะเคลื่อนที่จริงของราคา ไม่ใช่ All-or-Nothing ผู้ใช้ยังได้ทุนสุทธิคืนแม้ OTM\n3. Mandatory Settlement — smart contract บังคับใช้สัญญาอัตโนมัติเมื่อครบเวลา ทุกการเคลื่อนไหวมีมูลค่า\n4. Risk-Neutral Infrastructure — ตัวกลางไม่แบกความเสี่ยง ทำหน้าที่เพียง escrow และคำนวณส่วนต่างราคา',
      },
      {
        heading: 'รอบการชำระเงินทำงานอย่างไร?',
        body: 'แต่ละรอบมีราคาเป้าหมาย (P_target) ซึ่งคือราคา Chainlink ณ เวลาเริ่มรอบ และบันทึกราคาเปิดสถานะของผู้เล่นแต่ละคน (P_entry) ณ เวลาที่ธุรกรรมถูกยืนยัน เมื่อสิ้นรอบ ราคาสุดท้ายของ oracle จะกำหนดว่าฝั่งใด In-the-Money (ITM) ฝั่ง ITM รับส่วนแบ่งจาก pool ฝั่งตรงข้าม ฝั่ง OTM ได้รับเงินทุนสุทธิคืน',
      },
      {
        heading: 'ระบบเบี้ยประกัน',
        body: 'ทุกสถานะต้องจ่ายเบี้ยรวมที่หักจากหลักประกันก่อนเข้า pool:\n• เบี้ยฐาน (Base Premium) 0.10% คงที่\n• เบี้ยเอียง (Skew Premium) ตัวคูณ 0.5× / 1× / 2× ตามความไม่สมดุลของ pool\n• เบี้ยเวลา (Time Premium) 0% ช่วง Stable / 2% Warning / 5–10% Critical\n• ค่าระยะห่างราคา (Price Surcharge) สูงสุด 70% ของ ΔP เมื่อราคาเคลื่อนไปในทิศที่คุณได้เปรียบแล้ว',
      },
      {
        heading: 'กลไกรักษาเสถียรภาพและความปลอดภัย',
        body: '• Critical Period Lock-up — 90 นาทีสุดท้ายไม่อนุญาตให้ถอนหลักประกัน เพื่อให้มีสินทรัพย์เพียงพอชำระบัญชี\n• Dynamic Premium — ฝั่งที่คนมาก Premium สูง ฝั่งที่คนน้อย Premium ต่ำ เพื่อดึงดูดสภาพคล่อง\n• Next-Tick Settlement — บันทึกราคา oracle ณ block ถัดไป ป้องกัน Latency Arbitrage\n• Re-entrancy Protection — ทุกฟังก์ชันที่โอน ETH มีการป้องกัน re-entrancy',
      },
      {
        heading: 'เทคโนโลยีที่ใช้',
        body: 'Solidity smart contracts · Ethereum Sepolia · Chainlink ETH/USD price feed · React 18 + Vite · Ethers.js v6 · Tailwind CSS v3',
      },
      {
        heading: 'เกี่ยวกับ Wiki นี้',
        body: 'เอกสารนี้ครอบคลุม 17 use case (UC-01 – UC-17) สำหรับการส่งงานวิชา CI7103 แต่ละหน้าอธิบาย preconditions ขั้นตอนการใช้งาน และ postconditions ของแต่ละ interaction',
      },
    ],
  },

  actors: {
    title: 'ผู้มีส่วนร่วม (Actors)',
    badge: 'ภาพรวม',
    sections: [
      {
        heading: 'Vault — สัญญาอัจฉริยะ',
        body: 'Vault คือ smart contract หลักที่ถือ ETH ทั้งหมดในระบบ บริหารรอบการชำระเงิน และกระจายผลตอบแทนให้ผู้เล่น\n\nที่อยู่สัญญา (Sepolia):\n0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb\n\nความรับผิดชอบ:\n• รับ collateral จากผู้เล่นเมื่อเปิดสถานะ\n• บันทึก P_target และ P_entry ของแต่ละสถานะ\n• คำนวณและหักเบี้ยประกัน\n• จำแนก ITM/OTM และกระจาย ETH เมื่อสิ้นรอบ',
      },
      {
        heading: 'Treasury — ผู้ดูแลระบบ',
        body: 'Treasury คือกระเป๋า admin ที่เป็นเจ้าของสัญญา มีสิทธิ์เริ่มรอบใหม่และบังคับ settle รอบได้\n\nที่อยู่ (Sepolia):\n0x00B75a4087b59D763918394F0eF34BE1Ff03B759\n\nความรับผิดชอบ:\n• เรียก startCycle() เพื่อเปิดรอบใหม่\n• เรียก settle() เมื่อครบ 12 ชั่วโมง หรือ force-settle ผ่าน Sandbox Panel\n• กระเป๋านี้ถูกซ่อน TradePanel — ไม่สามารถเปิดสถานะซื้อขายได้',
      },
      {
        heading: 'ผู้เล่น (Traders)',
        body: 'ผู้เล่นคือกระเป๋า MetaMask ใดก็ได้ที่ไม่ใช่ Treasury เชื่อมต่อกับแอปและเปิดสถานะ Long หรือ Short ได้\n\nเงื่อนไข:\n• มี Sepolia ETH อย่างน้อย 0.001 ETH (ขั้นต่ำ) บวกค่าธรรมเนียม gas\n• ต้องอยู่บน Sepolia network (Chain ID: 11155111)\n• เปิดสถานะได้เฉพาะเมื่อมีรอบที่ active อยู่\n\nผู้เล่นทุกคนมองเห็น pool ฝั่งเดียวกันและฝั่งตรงข้ามแบบ real-time ผ่าน Pool Meter',
      },
    ],
  },

  happyflow: {
    title: 'เส้นทางหลัก (Happy Flow)',
    badge: 'ภาพรวม',
    sections: [
      {
        heading: 'ภาพรวมเส้นทาง',
        body: 'Happy Flow คือลำดับการใช้งานปกติตั้งแต่ต้นจนจบครบ 1 รอบการชำระเงิน ครอบคลุมทุก actor ตั้งแต่ Treasury เริ่มรอบ จนถึงผู้เล่นได้รับผลตอบแทน',
      },
      {
        heading: '1. Treasury เริ่มรอบใหม่',
        body: 'Treasury เชื่อมต่อ MetaMask ด้วย address 0x00B75... และเรียก startCycle() ผ่าน Sandbox Panel\nสัญญาบันทึก P_target = ราคา Chainlink ETH/USD ณ ขณะนั้น และนาฬิกาเริ่มนับ 12 ชั่วโมง',
      },
      {
        heading: '2. ผู้เล่นเชื่อมต่อกระเป๋า',
        body: 'ผู้เล่นเปิดแอปและคลิก "Connect MetaMask"\nหากอยู่ผิด network MetaMask จะแจ้งให้สลับไป Sepolia\nเมื่อเชื่อมต่อสำเร็จ Dashboard จะปรากฏ',
      },
      {
        heading: '3. ผู้เล่นดูข้อมูลตลาด',
        body: '• Cycle Status — ดู Cycle ID, เวลาที่เหลือ, และ phase ปัจจุบัน (Stable / Warning / Critical)\n• Price Feed — ดูราคา ETH/USD live จาก Chainlink พร้อม P_target เป็นเส้นอ้างอิง\n• Pool Meter — ดูสมดุลของ Long pool vs Short pool และ skew factor ที่จะส่งผลต่อเบี้ย',
      },
      {
        heading: '4. ผู้เล่นเปิดสถานะ',
        body: '• เลือก Long (คาดว่าราคาขึ้น) หรือ Short (คาดว่าราคาลง) ใน TradePanel\n• ใส่จำนวน collateral (ETH) ขั้นต่ำ 0.001 ETH\n• ตรวจสอบ Order Summary — เบี้ยรวม, Net Position, และ Possible Profit\n• คลิกปุ่มเปิดสถานะและยืนยันธุรกรรมใน MetaMask',
      },
      {
        heading: '5. สัญญารับสถานะ',
        body: 'Vault บันทึก P_entry = ราคา oracle ณ เวลาที่ block ถูก mine\nหักเบี้ยประกันและเพิ่ม net position เข้า pool ฝั่งที่เลือก\nสถานะปรากฏใน Holdings table ทันที',
      },
      {
        heading: '6. ผู้เล่นติดตามสถานะ',
        body: 'ตลอด 12 ชั่วโมง ผู้เล่นสามารถดูใน Holdings ว่าสถานะของตัวเองอยู่ในสถานะ ITM หรือ OTM ตามราคา live ปัจจุบัน\nสถานะ ITM = กำไรหากรอบจบตอนนี้ / OTM = ได้ทุนคืน',
      },
      {
        heading: '7. รอบสิ้นสุด — Treasury settle',
        body: 'เมื่อครบ 12 ชั่วโมง Treasury เรียก settle() ผ่าน Sandbox Panel\nสัญญาบันทึก P_final = ราคา Chainlink ณ ขณะนั้น\nจำแนกทุกสถานะเป็น ITM หรือ OTM ตาม P_final vs P_target ของแต่ละสถานะ',
      },
      {
        heading: '8. กระจาย ETH',
        body: 'Net position ของฝั่ง OTM ถูกรวมเป็น payout pool\nแต่ละสถานะ ITM ได้รับ: (net ของตัวเอง / net ITM รวม) × payout pool\nค่าที่แน่นอนจาก on-chain ปรากฏใน Holdings ทันทีหลัง settle',
      },
      {
        heading: '9. ผู้เล่นรับผลตอบแทน',
        body: 'Holdings แสดงจำนวน ETH จริงที่ claim ได้สำหรับแต่ละสถานะที่ settle แล้ว\nรอบใหม่เริ่มต้นได้ทันทีที่ Treasury เรียก startCycle() อีกครั้ง',
      },
    ],
  },

  uc01: {
    title: 'UC-01: เชื่อมต่อกระเป๋า',
    badge: 'เริ่มต้นใช้งาน',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้เชื่อมต่อกระเป๋า MetaMask เพื่อเข้าถึงแดชบอร์ดการซื้อขาย',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• ติดตั้ง MetaMask browser extension และปลดล็อกแล้ว\n• มีบัญชีที่มี Sepolia testnet ETH\n• เปิดแอปใน browser ที่รองรับ (Chrome / Brave / Firefox)',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เปิด URL ของแอป\n2. คลิกปุ่ม "Connect MetaMask" บนหน้าหลัก\n3. อนุมัติการเชื่อมต่อใน popup ของ MetaMask\n4. หาก network ไม่ใช่ Sepolia MetaMask จะแจ้งให้สลับ — ยืนยันการสลับ',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ที่อยู่กระเป๋า (ย่อ) และยอด ETH ปรากฏที่มุมขวาบนของ Topbar Dashboard พร้อมใช้งาน',
      },
    ],
  },

  uc02: {
    title: 'UC-02: ยกเลิกการเชื่อมต่อ',
    badge: 'เริ่มต้นใช้งาน',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้ยกเลิกการเชื่อมต่อกระเป๋า MetaMask และกลับสู่หน้าหลัก',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'มีกระเป๋าที่เชื่อมต่ออยู่แล้ว',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. หาไอคอน disconnect (ลูกศรออก) ในส่วนกระเป๋าที่มุมขวาบนของ Topbar\n2. คลิกปุ่ม\n3. session ถูกล้าง และหน้า ConnectWallet ปรากฏขึ้น',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ไม่แสดงที่อยู่กระเป๋า ข้อมูลทั้งหมดที่ต้องใช้กระเป๋าถูกซ่อน ผู้ใช้สามารถเชื่อมต่อใหม่ได้ทุกเมื่อ',
      },
    ],
  },

  'uc-long': {
    title: 'เปิด Long Order',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้เปิดสถานะ Long เพื่อเดิมพันว่าราคา ETH/USD ณ สิ้นรอบจะสูงกว่าราคาเป้าหมาย (P_target) ที่ถูกกำหนดไว้ตั้งแต่เริ่มรอบ',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• กระเป๋า MetaMask เชื่อมต่อและอยู่บน Sepolia network\n• มี Sepolia ETH เพียงพอ (ขั้นต่ำ 0.001 ETH บวกค่า gas)\n• มีรอบการซื้อขายที่ active อยู่ในขณะนั้น\n• กระเป๋าต้องไม่ใช่ Treasury address (Treasury ไม่สามารถเปิดสถานะได้)',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. บน Dashboard เลื่อนไปที่ TradePanel\n2. เลือกฝั่ง "Long" — ปุ่มจะ highlight สีน้ำเงิน\n3. ใส่จำนวน collateral (ETH) ในช่อง Collateral\n4. ตรวจสอบ Order Summary ที่อัปเดต real-time:\n   • เบี้ยรวม (Total Premium %)\n   • Net Position หลังหักเบี้ย\n   • Possible Profit หากราคาขยับตามคาด\n5. คลิกปุ่ม "Open Long"\n6. MetaMask popup ปรากฏ — ตรวจสอบจำนวน ETH และกด Confirm\n7. รอธุรกรรมถูก mine (ปุ่มจะแสดง "Broadcasting Tx…" ระหว่างรอ)',
      },
      {
        heading: 'สิ่งที่เกิดขึ้นใน Smart Contract',
        body: 'เมื่อธุรกรรมถูก mine:\n• สัญญาบันทึก P_entry = ราคา Chainlink ณ เวลาที่ block ถูก confirm\n• หักเบี้ยประกันรวมออกจาก collateral → ได้ Net Position (N)\n• เพิ่ม N เข้า Long pool ของรอบปัจจุบัน\n• บันทึก position ด้วย Cycle ID, P_entry, P_target, N, และ address ผู้เล่น',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: '• สถานะ Long ปรากฏใน Holdings Table พร้อม badge "ITM" หรือ "OTM" ตามราคา live\n• Long pool ใน Pool Meter เพิ่มขึ้น\n• สถานะจะถูก settle อัตโนมัติเมื่อสิ้นรอบ 12 ชั่วโมง',
      },
      {
        heading: 'เงื่อนไข ITM ของ Long',
        body: 'สถานะ Long เป็น In-the-Money (ITM) เมื่อ P_final > P_target\n\nหาก ITM: ผลตอบแทน = N × (1 + ΔP)  โดย ΔP = |P_entry − P_target| / P_target\nหาก OTM: ได้รับ N คืน (ทุนสุทธิหลังหักเบี้ย)',
      },
    ],
  },

};

// ─── Body renderer ────────────────────────────────────────────────────────────

function BodyRenderer({ body }) {
  const lines = body.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Numbered item (may have indented sub-bullets immediately after)
    if (/^\d+\./.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s*/, '');
        const subItems = [];
        i++;
        while (i < lines.length && /^\s+•/.test(lines[i])) {
          subItems.push(lines[i].trim().replace(/^•\s*/, ''));
          i++;
        }
        items.push({ text, subItems });
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Top-level bullet
    if (/^•/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^•/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^•\s*/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Plain text — collect until empty line, bullet, or numbered item
    const textLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\d+\./.test(lines[i].trim()) &&
      !/^•/.test(lines[i].trim()) &&
      !/^\s+•/.test(lines[i])
    ) {
      textLines.push(lines[i]);
      i++;
    }
    if (textLines.length) blocks.push({ type: 'p', text: textLines.join('\n') });
  }

  return (
    <div className="space-y-2.5 text-sm text-slate-400 leading-relaxed">
      {blocks.map((block, bi) => {
        if (block.type === 'ol') {
          return (
            <ol key={bi} className="space-y-2">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2.5">
                  <span className="text-teal/50 font-mono shrink-0 w-5 text-right">{ii + 1}.</span>
                  <span>
                    {item.text}
                    {item.subItems.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {item.subItems.map((sub, si) => (
                          <li key={si} className="flex gap-2 text-slate-500 ml-1">
                            <span className="text-teal/30 shrink-0">•</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={bi} className="space-y-1.5">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2.5">
                  <span className="text-teal/50 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={bi} className="whitespace-pre-line">{block.text}</p>;
      })}
    </div>
  );
}

// ─── Content renderer ─────────────────────────────────────────────────────────

function PageContent({ pageId }) {
  const page = PAGES[pageId] ?? PAGES.overview;

  return (
    <article className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8 pb-6 border-b border-[#1c2636]">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-teal/70 mb-2 block">
          {page.badge}
        </span>
        <h1 className="text-2xl font-bold text-slate-100">{page.title}</h1>
      </div>

      <div className="space-y-8">
        {page.sections.map((sec, i) => (
          <section key={i}>
            <h2 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-teal/60 inline-block" />
              {sec.heading}
            </h2>
            <BodyRenderer body={sec.body} />
          </section>
        ))}
      </div>

      <div className="mt-14 pt-6 border-t border-[#1c2636] text-[11px] text-slate-600 font-mono">
        P2P ClearingHouse · CI7103 · Sepolia Testnet
      </div>
    </article>
  );
}

// ─── Main WikiPage ────────────────────────────────────────────────────────────

export default function WikiPage() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('overview');

  return (
    <div className="h-screen flex flex-col bg-[#070b12] text-slate-100 overflow-hidden">

      <header className="h-14 shrink-0 flex items-center px-4 border-b border-[#1c2636] bg-[#0a0f1a]/80 backdrop-blur-sm z-20 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal/10 border border-teal/25 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#00d4aa" strokeWidth="1.2" />
              <path d="M6 13L10 5L14 13" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 11h5" stroke="#00d4aa" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-sm text-slate-100">ClearingHouse</span>
          <span className="text-[10px] font-semibold text-teal/60 tracking-widest uppercase">/ Wiki</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => navigate('/')}
          className="btn-ghost flex items-center gap-1.5 text-xs"
          title="กลับสู่แอป"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          กลับสู่แอป
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        <aside className="w-56 shrink-0 border-r border-[#1c2636] bg-[#0a0f1a]/60 overflow-y-auto py-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-600 px-4 mb-3">
            สารบัญ
          </p>

          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-4">
              <p className="text-[11px] font-semibold text-slate-400 px-4 mb-1">{section}</p>
              {items.map(({ id, label }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    className={`w-full text-left text-xs px-4 py-1.5 flex items-center gap-2 transition-colors duration-100
                      ${active
                        ? 'text-teal bg-teal/8'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                      }`}
                  >
                    <span className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-teal' : ''}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto">
          <PageContent pageId={activePage} />
        </main>
      </div>
    </div>
  );
}
