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
      { id: 'uc-long',     label: 'UC-03 · เปิด Long Order' },
      { id: 'uc-short',    label: 'UC-04 · เปิด Short Order' },
      { id: 'uc-settle',   label: 'UC-05 · กด Settlement (Treasury)' },
      { id: 'uc-claim',    label: 'UC-06 · Claim ผลตอบแทนหลัง Settle' },
      { id: 'uc-critical', label: 'UC-07 · เปิด Order ช่วง Critical' },
      { id: 'uc-no-counter', label: 'UC-10 · ITM แต่ไม่มีคู่ตรงข้าม' },
    ],
  },
  {
    section: 'ตรวจสอบธุรกรรม',
    items: [
      { id: 'uc-etherscan',      label: 'UC-08 · ตรวจสอบธุรกรรมของฉัน' },
      { id: 'uc-etherscan-vault', label: 'UC-09 · ตรวจสอบธุรกรรมของ Vault' },
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
        heading: 'การ Deploy Smart Contract',
        body: 'สัญญาอัจฉริยะถูก deploy บน Ethereum Sepolia testnet และผ่านการ verify source code บน Sepolia Etherscan แล้ว\n\nที่อยู่สัญญา (Vault):\n0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb\n\nรายละเอียดการ deploy:\n• Network — Ethereum Sepolia (Chain ID: 11155111)\n• ภาษา — Solidity\n• Oracle — Chainlink ETH/USD Price Feed (Sepolia)\n• Owner — Treasury address 0x00B75a4087b59D763918394F0eF34BE1Ff03B759\n• ตรวจสอบ contract และ source code ได้ที่ sepolia.etherscan.io/address/0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb',
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
    title: 'UC-03: เปิด Long Order',
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

  'uc-short': {
    title: 'UC-04: เปิด Short Order',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้เปิดสถานะ Short เพื่อเดิมพันว่าราคา ETH/USD ณ สิ้นรอบจะต่ำกว่าราคาเป้าหมาย (P_target) ที่ถูกกำหนดไว้ตั้งแต่เริ่มรอบ Short เป็นฝั่งตรงข้ามของ Long — ผู้เล่นทั้งสองฝั่งเป็นคู่สัญญากันโดยตรงผ่าน pool',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• กระเป๋า MetaMask เชื่อมต่อและอยู่บน Sepolia network\n• มี Sepolia ETH เพียงพอ (ขั้นต่ำ 0.001 ETH บวกค่า gas)\n• มีรอบการซื้อขายที่ active อยู่ในขณะนั้น\n• กระเป๋าต้องไม่ใช่ Treasury address (Treasury ไม่สามารถเปิดสถานะได้)',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. บน Dashboard เลื่อนไปที่ TradePanel\n2. เลือกฝั่ง "Short" — ปุ่มจะ highlight สีม่วง\n3. ใส่จำนวน collateral (ETH) ในช่อง Collateral\n4. ตรวจสอบ Order Summary ที่อัปเดต real-time:\n   • เบี้ยรวม (Total Premium %)\n   • Net Position หลังหักเบี้ย\n   • Possible Profit หากราคาลงตามคาด\n5. คลิกปุ่ม "Open Short"\n6. MetaMask popup ปรากฏ — ตรวจสอบจำนวน ETH และกด Confirm\n7. รอธุรกรรมถูก mine (ปุ่มจะแสดง "Broadcasting Tx…" ระหว่างรอ)',
      },
      {
        heading: 'สิ่งที่เกิดขึ้นใน Smart Contract',
        body: 'เมื่อธุรกรรมถูก mine:\n• สัญญาบันทึก P_entry = ราคา Chainlink ณ เวลาที่ block ถูก confirm\n• หักเบี้ยประกันรวมออกจาก collateral → ได้ Net Position (N)\n• เพิ่ม N เข้า Short pool ของรอบปัจจุบัน\n• บันทึก position ด้วย Cycle ID, P_entry, P_target, N, และ address ผู้เล่น',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: '• สถานะ Short ปรากฏใน Holdings Table พร้อม badge "ITM" หรือ "OTM" ตามราคา live\n• Short pool ใน Pool Meter เพิ่มขึ้น\n• สถานะจะถูก settle อัตโนมัติเมื่อสิ้นรอบ 12 ชั่วโมง',
      },
      {
        heading: 'เงื่อนไข ITM ของ Short',
        body: 'สถานะ Short เป็น In-the-Money (ITM) เมื่อ P_final < P_target\n\nหาก ITM: ผลตอบแทน = N × (1 + ΔP)  โดย ΔP = |P_entry − P_target| / P_target\nหาก OTM: ได้รับ N คืน (ทุนสุทธิหลังหักเบี้ย)',
      },
      {
        heading: 'ความแตกต่างจาก Long',
        body: '• ปุ่มเลือกฝั่งเป็น "Short" (สีม่วง) แทน "Long" (สีน้ำเงิน)\n• N ถูกเพิ่มเข้า Short pool แทน Long pool\n• ITM เมื่อราคา ลง ต่ำกว่า P_target (Long ITM เมื่อราคา ขึ้น)\n• ผลตอบแทนมาจาก Long pool ของฝั่งตรงข้าม ไม่ใช่ Short pool',
      },
    ],
  },

  'uc-settle': {
    title: 'UC-05: กด Settlement (Treasury)',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'Treasury คือผู้ดูแลระบบที่มีสิทธิ์เรียก settle() บน smart contract เพื่อปิดรอบการชำระเงินปัจจุบัน เมื่อ settle สำเร็จ oracle จะบันทึกราคาสุดท้าย (P_final) สัญญาจำแนก ITM/OTM และกระจาย ETH ให้ผู้เล่นทุกคนตามสัดส่วนทันที',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• กระเป๋าที่เชื่อมต่อต้องเป็น Treasury address เท่านั้น:\n   0x00B75a4087b59D763918394F0eF34BE1Ff03B759\n• รอบปัจจุบันต้องผ่านไปแล้วอย่างน้อย 12 ชั่วโมง (หรือใช้ force-settle ผ่าน Sandbox ก็ได้)\n• Sandbox Panel ต้องมองเห็นอยู่ (แสดงเฉพาะ Treasury wallet)',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เชื่อมต่อ MetaMask ด้วย Treasury address (0x00B75...)\n2. Dashboard จะแสดง Sandbox Panel ที่ด้านล่างของหน้าจอ (TradePanel ถูกซ่อน)\n3. ใน Sandbox Panel คลิกปุ่ม "Settle Cycle"\n4. MetaMask popup ปรากฏ — ตรวจสอบ gas fee และคลิก Confirm\n5. รอธุรกรรมถูก mine — ปุ่มจะแสดงสถานะ loading ระหว่างรอ\n6. เมื่อ tx สำเร็จ Cycle Status จะแสดงว่ารอบถูก settle แล้ว',
      },
      {
        heading: 'สิ่งที่เกิดขึ้นใน Smart Contract',
        body: 'เมื่อ settle() ถูกเรียก:\n• สัญญาอ่านราคา P_final จาก Chainlink oracle ณ block ที่ tx ถูก mine\n• เปรียบเทียบ P_final กับ P_target ของรอบ:\n   Long ITM เมื่อ P_final > P_target\n   Short ITM เมื่อ P_final < P_target\n• รวม net position ของฝั่ง OTM เป็น payout pool\n• แต่ละสถานะ ITM ได้รับ: (N ของตัวเอง / N รวม ITM) × payout pool\n• โอน ETH ออกจาก vault ไปยัง address ผู้เล่นแต่ละคนโดยตรง\n• emit event CycleSettled พร้อม P_final และสรุปผล',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: '• Holdings Table ของผู้เล่นทุกคนอัปเดตแสดงจำนวน ETH จริงที่ได้รับจาก on-chain\n• สถานะทุกตัวในรอบนั้นแสดง badge "Settled"\n• Cycle ID เพิ่มขึ้น 1 — รอบใหม่พร้อมเริ่มได้ทันทีโดย Treasury เรียก startCycle()\n• ETH Balance ของ Vault บน Etherscan ลดลงเท่ากับยอดรวมที่กระจายออกไป',
      },
      {
        heading: 'ข้อควรระวัง',
        body: '• settle() เรียกได้เฉพาะ Treasury เท่านั้น กระเป๋าอื่น tx จะ revert ทันที\n• ห้าม settle ซ้ำในรอบเดิม — สัญญาตรวจสอบ state และ revert หากพยายาม\n• หากไม่มีผู้เล่นฝั่งใดฝั่งหนึ่ง OTM pool จะเป็น 0 และ ITM pool ยังคืนทุนสุทธิให้ผู้เล่นทั้งหมด',
      },
    ],
  },

  'uc-claim': {
    title: 'UC-06: Claim ผลตอบแทนหลัง Settle',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'หลังจาก Treasury กด settle รอบเสร็จแล้ว ผู้เล่นที่มีสถานะในรอบนั้นสามารถกด Claim เพื่อรับ ETH ที่ได้รับการจัดสรรจาก smart contract กลับคืนสู่กระเป๋าของตัวเองได้ ทั้ง ITM (ได้ทุน + กำไรจาก pool ฝั่งตรงข้าม) และ OTM (ได้ทุนสุทธิคืน)',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• กระเป๋าที่เชื่อมต่อต้องเป็นกระเป๋าที่เคยเปิดสถานะในรอบนั้น\n• รอบนั้นต้องถูก settle แล้ว (Treasury เรียก settle() สำเร็จ)\n• ยังไม่เคย claim สถานะนั้นมาก่อน',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เชื่อมต่อ MetaMask ด้วยกระเป๋าที่เคยเปิดสถานะ\n2. ดูที่ Holdings Table — สถานะที่ settle แล้วจะแสดงยอด ETH จริงที่ claim ได้\n3. คลิกปุ่ม "Claim" ที่แถวของสถานะนั้น\n4. MetaMask popup ปรากฏ — ยืนยัน gas fee และคลิก Confirm\n5. รอธุรกรรมถูก mine\n6. ETH เข้ากระเป๋าทันทีและแถวนั้นอัปเดตเป็นสถานะ "Claimed"',
      },
      {
        heading: 'สิ่งที่เกิดขึ้นใน Smart Contract',
        body: 'เมื่อ claim() ถูกเรียก:\n• สัญญาตรวจสอบว่า msg.sender เป็นเจ้าของสถานะนั้นจริง\n• ตรวจสอบว่ารอบถูก settle แล้วและยังไม่เคย claim\n• โอน ETH ที่จัดสรรไว้จาก vault ไปยัง msg.sender\n• บันทึก flag hasClaimed = true เพื่อป้องกัน double-claim',
      },
      {
        heading: 'ยอดที่ได้รับ',
        body: 'หากสถานะ ITM:\n   ผลตอบแทน = (N ของตัวเอง / N รวมฝั่ง ITM) × payout pool ของฝั่ง OTM\n\nหากสถานะ OTM:\n   ผลตอบแทน = N (net position คืนทุนสุทธิหลังหักเบี้ย)\n\nค่าที่แสดงใน Holdings คือยอด on-chain จริงจาก event ของ contract ไม่ใช่ประมาณการ',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: '• ETH เข้ากระเป๋าทันทีเมื่อ tx สำเร็จ\n• แถวใน Holdings แสดง badge "Claimed" และล็อคไม่ให้กด claim ซ้ำ\n• ยอด ETH ใน Topbar เพิ่มขึ้นตามจำนวนที่ได้รับ\n• สามารถตรวจสอบการโอนได้บน Sepolia Etherscan ที่แท็บ Internal Transactions ของ contract',
      },
    ],
  },

  'uc-critical': {
    title: 'UC-07: เปิด Order ช่วง Critical',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ช่วง Critical คือ 90 นาทีสุดท้ายของแต่ละรอบ (10.5–12 ชั่วโมงหลังเริ่มรอบ) ผู้เล่นยังเปิดสถานะได้อยู่ แต่ Time Premium จะสูงขึ้นเป็น 5–10% เพื่อสะท้อนความเสี่ยงที่สูงขึ้นใกล้ปิดรอบ\n\nในสถานการณ์นี้ Treasury ใช้ Sandbox Panel กด Fast Forward เพื่อข้ามเวลาให้ถึงช่วง Critical ก่อน จากนั้นกระเป๋าอื่นจึงเปิดสถานะเพื่อเห็นค่าเบี้ยที่สูงขึ้น',
      },
      {
        heading: 'Phase ของแต่ละรอบ',
        body: '• Stable (0–9 ชั่วโมง) — Time Premium = 0%\n• Warning (9–10.5 ชั่วโมง) — Time Premium = 2%\n• Critical (10.5–12 ชั่วโมง) — Time Premium = 5–10% (สูงขึ้นตามเวลาที่เหลือ)',
      },
      {
        heading: 'ขั้นตอน — Treasury Fast Forward ไปช่วง Critical',
        body: '1. เชื่อมต่อ MetaMask ด้วย Treasury address (0x00B75...)\n2. ใน Sandbox Panel คลิกปุ่ม "Fast Forward to Critical"\n3. MetaMask popup ปรากฏ — ยืนยัน gas fee และคลิก Confirm\n4. รอ tx สำเร็จ — Cycle Status จะเปลี่ยนสีเป็นแดงและแสดง phase "Critical"\n5. Countdown แสดงเวลาที่เหลือน้อยกว่า 90 นาที',
      },
      {
        heading: 'ขั้นตอน — ผู้เล่นเปิดสถานะช่วง Critical',
        body: '1. สลับไปกระเป๋าอื่นที่ไม่ใช่ Treasury\n2. เปิด TradePanel — Order Summary จะแสดง Time Premium สูงกว่าปกติ\n3. เลือก Long หรือ Short และใส่จำนวน collateral\n4. ตรวจสอบ Order Summary:\n   • Time Premium — แสดง 5–10% แทนที่จะเป็น 0% ช่วง Stable\n   • Total Premium — รวมสูงกว่าปกติ\n   • Net Position — ต่ำกว่าปกติเพราะเบี้ยแพงขึ้น\n5. คลิกปุ่มเปิดสถานะ และยืนยันใน MetaMask',
      },
      {
        heading: 'สิ่งที่แตกต่างจากการเปิดช่วง Stable',
        body: '• Time Premium = 5–10% (ช่วง Stable = 0%)\n• Total Premium รวมสูงกว่า → Net Position ต่ำกว่า\n• Possible Profit ลดลงตามเพราะทุนสุทธิน้อยลง\n• สัญญายังรับสถานะได้ปกติ — ไม่มีการล็อคการเปิดสถานะ',
      },
      {
        heading: 'เหตุผลที่มี Critical Premium',
        body: 'ช่วง Critical เป็นช่วงที่ใกล้ปิดรอบ ผู้เล่นที่เข้ามาช้าได้เปรียบเพราะทราบทิศทางราคาแล้วบางส่วน ระบบจึงเพิ่ม Time Premium เพื่อชดเชยความได้เปรียบนั้นและรักษาความยุติธรรมให้ผู้เล่นที่เข้ามาตั้งแต่ช่วง Stable',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: '• สถานะปรากฏใน Holdings Table พร้อม badge ITM/OTM ตามราคา live\n• เบี้ยที่หักไปแล้วจะไม่คืน ไม่ว่าจะ settle ช้าหรือเร็ว\n• เมื่อ Treasury settle รอบ สถานะนี้จะถูกจำแนกและรับผลตอบแทนเช่นเดียวกับสถานะปกติ',
      },
    ],
  },

  'uc-no-counter': {
    title: 'UC-10: ITM แต่ไม่มีคู่ตรงข้าม',
    badge: 'การทำรายการ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'กรณีนี้เกิดขึ้นเมื่อผู้เล่นเปิดสถานะถูกทิศ (ITM) แต่เมื่อสิ้นรอบพบว่า pool ฝั่งตรงข้ามไม่มีผู้เล่นเลย (empty pool) ผลตอบแทนที่ ITM ควรได้มาจาก OTM pool แต่เมื่อ OTM pool ว่างเปล่า ก็ไม่มี ETH ให้กระจาย ผู้เล่น ITM จึงได้รับเฉพาะ net position (N) ของตัวเองคืน ไม่มีกำไรเพิ่ม',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: '• ผู้เล่นเปิดสถานะ Long หรือ Short ในรอบที่ active\n• ในรอบนั้นไม่มีผู้เล่นคนใดเปิดสถานะฝั่งตรงข้ามเลย\n• Treasury settle รอบและราคาจบเป็น ITM ของฝั่งผู้เล่น',
      },
      {
        heading: 'ขั้นตอนการสาธิต',
        body: '1. Treasury เริ่มรอบใหม่ด้วย startCycle()\n2. ผู้เล่น A เปิดสถานะ Long ด้วย collateral บางส่วน (ไม่มีผู้เล่นอื่นเปิด Short เลย)\n3. รอหรือให้ Treasury กด Fast-Forward → Critical เพื่อข้ามเวลา\n4. Treasury กด settle — สมมติว่าราคา ETH ขึ้น ผู้เล่น A อยู่ฝั่ง Long จึง ITM\n5. Short pool = 0 ETH → payout pool ว่าง\n6. ผู้เล่น A กด Claim — ได้รับเฉพาะ N คืน ไม่มีกำไรจาก pool ตรงข้าม',
      },
      {
        heading: 'สิ่งที่เกิดขึ้นใน Smart Contract',
        body: 'เมื่อ settle():\n• สัญญาตรวจสอบ Short pool = 0\n• payout pool สำหรับ Long ITM = 0\n• ผู้เล่น Long ITM ทุกคนได้รับ N ของตัวเองกลับคืน (ไม่ขาดทุน แต่ไม่มีกำไร)\n• สัญญาไม่ revert — ระบบทำงานปกติ เพียงแต่ไม่มีกำไรให้กระจาย',
      },
      {
        heading: 'สิ่งที่ผู้เล่นเห็นใน Holdings',
        body: '• สถานะแสดง badge "ITM" (ถูกทิศ)\n• ยอด Payout = N (เท่ากับทุนสุทธิที่ฝากไป หลังหักเบี้ย)\n• ไม่มีกำไรเพิ่มจากฝั่งตรงข้าม\n• กด Claim เพื่อรับ N กลับคืนได้ตามปกติ',
      },
      {
        heading: 'สรุปความแตกต่าง',
        body: '• ITM ปกติ (มีคู่ตรงข้าม) — ได้ N ของตัวเอง + สัดส่วนจาก OTM pool\n• ITM แต่ไม่มีคู่ตรงข้าม — ได้เฉพาะ N คืน (ไม่กำไร ไม่ขาดทุนจากเบี้ย)\n\nนี่คือพฤติกรรมที่ตั้งใจออกแบบ — ระบบ P2P ต้องการคู่สัญญาสองฝั่งจึงจะเกิดกำไร',
      },
    ],
  },

  'uc-etherscan': {
    title: 'UC-08: ตรวจสอบธุรกรรมของฉันบน Etherscan',
    badge: 'ตรวจสอบธุรกรรม',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'หลังจากยืนยันธุรกรรมใน MetaMask ผู้ใช้สามารถตรวจสอบสถานะและรายละเอียดทั้งหมดบน Sepolia Etherscan ได้แบบ real-time เพื่อยืนยันว่า transaction ถูก mine สำเร็จและ smart contract รับ position เรียบร้อย',
      },
      {
        heading: 'ขั้นตอนเปิด Etherscan จาก MetaMask',
        body: '1. หลัง confirm tx ใน MetaMask คลิกที่ popup notification ที่ขึ้นมา หรือเปิด MetaMask แล้วไปที่แท็บ Activity\n2. คลิกที่รายการธุรกรรมล่าสุด\n3. คลิก "View on block explorer" — MetaMask จะเปิด Sepolia Etherscan ในแท็บใหม่พร้อม tx hash อัตโนมัติ',
      },
      {
        heading: 'ขั้นตอนค้นหาด้วย Tx Hash โดยตรง',
        body: '1. Copy tx hash จาก MetaMask (รูปแบบ 0x... ยาว 66 ตัวอักษร)\n2. เปิดเบราว์เซอร์ไปที่ sepolia.etherscan.io\n3. วาง tx hash ในช่องค้นหาแล้วกด Enter\n4. หน้า Transaction Detail จะเปิดขึ้น',
      },
      {
        heading: 'สิ่งที่ต้องตรวจสอบ',
        body: '• Status — ต้องแสดง "Success" (สีเขียว) หาก Pending รอ block ถัดไป หาก Failed ดู revert reason\n• Block — หมายเลข block ที่ tx ถูก mine บันทึกไว้ ซึ่งเป็น block เดียวกับที่ P_entry ถูกอ่านจาก oracle\n• To — ต้องเป็น contract address 0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb\n• Value — จำนวน ETH ที่ส่งไป (collateral ที่ใส่)\n• Gas Used — ค่า gas จริงที่ถูกหักจากกระเป๋า',
      },
      {
        heading: 'ตรวจสอบ Event Log',
        body: '1. เลื่อนลงมาที่แท็บ "Logs" ในหน้า Transaction\n2. หา event ชื่อ PositionOpened (หรือชื่อตาม contract)\n3. ใน event data จะเห็น:\n   • cycleId — หมายเลขรอบที่เปิดสถานะ\n   • trader — address ของผู้เล่น\n   • isLong — true = Long, false = Short\n   • collateral — จำนวน ETH ที่ฝาก\n   • entryPrice — P_entry ที่ oracle ให้ ณ block นั้น',
      },
      {
        heading: 'ตรวจสอบ Internal Transactions',
        body: '1. คลิกแท็บ "Internal Txns"\n2. จะเห็นการโอน ETH จากกระเป๋าเข้าสู่ contract\n3. ถ้ามีการโอนออกด้วย (เช่น การคืนทุน OTM หลัง settle) จะเห็นในหน้านี้เช่นกัน',
      },
      {
        heading: 'Link โดยตรง',
        body: 'Sepolia Etherscan: sepolia.etherscan.io\nContract address: sepolia.etherscan.io/address/0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb',
      },
    ],
  },

  'uc-etherscan-vault': {
    title: 'UC-09: ตรวจสอบธุรกรรมของ Vault บน Etherscan',
    badge: 'ตรวจสอบธุรกรรม',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'Vault คือ smart contract ที่รับและถือ ETH ของผู้เล่นทุกคน การดูธุรกรรมของ Vault ช่วยให้เห็นภาพรวมของกิจกรรมทั้งหมดในระบบ เช่น ใครเปิดสถานะบ้าง มีการ settle รอบไหนไปแล้ว และเงินไหลเข้า-ออกอย่างไร',
      },
      {
        heading: 'เปิดหน้า Vault บน Etherscan',
        body: '1. ไปที่ sepolia.etherscan.io\n2. วาง contract address ในช่องค้นหา:\n   0x111Dc5a9D306493b9C51ebF63EE19b001B8082cb\n3. กด Enter — หน้า Contract Overview จะเปิดขึ้น',
      },
      {
        heading: 'แท็บ Transactions',
        body: '• แสดงธุรกรรมทั้งหมดที่เรียก function บน contract\n• แต่ละแถวคือ 1 tx — ดูได้ว่า From (ผู้เล่น address ใด) ส่ง ETH เท่าไหร่ เมื่อไหร่\n• Method column บอกว่าเรียก function อะไร เช่น openPosition, settle, startCycle\n• กรองดูเฉพาะ tx ของ address ตัวเองได้โดยค้นหา address ของเราในช่อง Filter',
      },
      {
        heading: 'แท็บ Internal Transactions',
        body: '• แสดงการโอน ETH ที่เกิดขึ้นภายใน contract เช่น การจ่ายผลตอบแทนออกจาก vault หลัง settle\n• ถ้าเห็น ETH โอนออก (To = address ผู้เล่น) แสดงว่า settle สำเร็จและผู้เล่นได้รับเงินคืน',
      },
      {
        heading: 'แท็บ Events (Logs)',
        body: '• แสดง event ทั้งหมดที่ contract emit ออกมาตลอดประวัติ\n• Event หลักที่น่าสนใจ:\n   PositionOpened — มีผู้เล่นเปิดสถานะใหม่\n   CycleStarted — Treasury เริ่มรอบใหม่ (บันทึก P_target)\n   CycleSettled — รอบถูก settle (บันทึก P_final และผล ITM/OTM)',
      },
      {
        heading: 'แท็บ Contract',
        body: '• ดู source code ของ Vault contract ได้ที่นี่ (ถ้า verified)\n• อ่าน ABI เพื่อดูชื่อ function และ parameter ทั้งหมดที่ contract รองรับ\n• ใช้ Read Contract เพื่อ query ข้อมูลปัจจุบัน เช่น currentCycleId, longPool, shortPool ได้โดยไม่ต้องส่ง tx',
      },
      {
        heading: 'ดู ETH Balance ของ Vault',
        body: '• ที่ด้านบนของหน้า Contract Overview จะแสดง ETH Balance ปัจจุบัน\n• ค่านี้ควรเท่ากับ longPool + shortPool ของรอบที่ active อยู่รวมกัน\n• ถ้ายอดเป็น 0 หลัง settle แสดงว่า ETH ถูกกระจายออกให้ผู้เล่นหมดแล้ว',
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
