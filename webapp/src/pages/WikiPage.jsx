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
    section: 'หน้าจอ',
    items: [
      { id: 'uc03', label: 'UC-03 · เปลี่ยนธีม' },
      { id: 'uc04', label: 'UC-04 · เปลี่ยนภาษา' },
    ],
  },
  {
    section: 'ข้อมูลตลาด',
    items: [
      { id: 'uc05', label: 'UC-05 · สถานะรอบ' },
      { id: 'uc06', label: 'UC-06 · ราคาตลาด' },
      { id: 'uc07', label: 'UC-07 · กองทุนสภาพคล่อง' },
    ],
  },
  {
    section: 'การซื้อขาย',
    items: [
      { id: 'uc08', label: 'UC-08 · เปิด Long' },
      { id: 'uc09', label: 'UC-09 · เปิด Short' },
      { id: 'uc10', label: 'UC-10 · สรุปคำสั่ง' },
    ],
  },
  {
    section: 'สถานะของฉัน',
    items: [
      { id: 'uc11', label: 'UC-11 · ดูสถานะ' },
      { id: 'uc12', label: 'UC-12 · คำนวณผลตอบแทน' },
      { id: 'uc13', label: 'UC-13 · ITM / OTM' },
    ],
  },
  {
    section: 'ขั้นสูง',
    items: [
      { id: 'uc14', label: 'UC-14 · ตารางข้อมูลหลัก' },
      { id: 'uc15', label: 'UC-15 · Sandbox Panel' },
      { id: 'uc16', label: 'UC-16 · คำนวณเบี้ยประกัน' },
      { id: 'uc17', label: 'UC-17 · การจ่ายผลตอบแทน' },
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
        heading: 'รอบการชำระเงินทำงานอย่างไร?',
        body: 'แต่ละรอบมีราคาเป้าหมาย (P_target) ซึ่งคือราคา Chainlink ณ เวลาเริ่มรอบ และบันทึกราคาเปิดสถานะของผู้เล่นแต่ละคน (P_entry) ณ เวลาที่ธุรกรรมถูกยืนยัน เมื่อสิ้นรอบ ราคาสุดท้ายของ oracle จะกำหนดว่าฝั่งใด In-the-Money (ITM) ฝั่ง ITM รับส่วนแบ่งจาก pool ฝั่งตรงข้าม ฝั่ง OTM ได้รับเงินทุนสุทธิคืน',
      },
      {
        heading: 'ระบบเบี้ยประกัน',
        body: 'ทุกสถานะต้องจ่ายเบี้ยรวมที่หักจากหลักประกันก่อนเข้า pool:\n• เบี้ยฐาน (Base Premium) 0.10% คงที่\n• เบี้ยเอียง (Skew Premium) ตัวคูณ 0.5× / 1× / 2× ตามความไม่สมดุลของ pool\n• เบี้ยเวลา (Time Premium) 0% ช่วง Stable / 2% Warning / 5–10% Critical\n• ค่าระยะห่างราคา (Price Surcharge) สูงสุด 70% ของ ΔP เมื่อราคาเคลื่อนไปในทิศที่คุณได้เปรียบแล้ว',
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

  uc03: {
    title: 'UC-03: เปลี่ยนธีม',
    badge: 'หน้าจอ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้สลับระหว่าง Dark mode (ค่าเริ่มต้น) และ Light mode',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'แอปโหลดแล้ว (ไม่จำเป็นต้องเชื่อมต่อกระเป๋า)',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. คลิกไอคอนดวงอาทิตย์/ดวงจันทร์ใน Topbar\n2. สีพื้นหลัง card และข้อความอัปเดตทันที',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ธีมที่เลือกคงอยู่ตลอด session ปัจจุบัน Dark mode เป็นค่าเริ่มต้น',
      },
    ],
  },

  uc04: {
    title: 'UC-04: เปลี่ยนภาษา',
    badge: 'หน้าจอ',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้สลับภาษาของ UI ระหว่างอังกฤษ (EN) และไทย (TH)',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'แอปโหลดแล้ว',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. คลิกปุ่ม "TH" / "EN" ใน Topbar\n2. ป้ายกำกับ หัวคอลัมน์ และข้อความสถานะทั้งหมดอัปเดตเป็นภาษาที่เลือก',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ภาษาที่เลือกใช้งานตลอด session ตัวเลขและ address ไม่ถูกแปล',
      },
    ],
  },

  uc05: {
    title: 'UC-05: ดูสถานะรอบ',
    badge: 'ข้อมูลตลาด',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้ดูข้อมูลรอบการชำระเงินที่ active รวมถึง Cycle ID เวลาเริ่ม/สิ้นสุด และนาฬิกานับถอยหลัง',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อและอยู่บน Sepolia network',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เปิด Dashboard\n2. หา card Cycle Status ที่มุมซ้ายบน\n3. card แสดง: Cycle ID, timestamp เริ่มต้น, timestamp สิ้นสุด, เวลาที่เหลือ, และ phase ปัจจุบัน (Stable / Warning / Critical)',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'นาฬิกานับถอยหลังอัปเดตทุกวินาที การเปลี่ยน phase สะท้อนทันที',
      },
    ],
  },

  uc06: {
    title: 'UC-06: ดูราคาตลาด',
    badge: 'ข้อมูลตลาด',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้ดูราคา ETH/USD live จาก Chainlink oracle และกราฟราคาย้อนหลังในรอบปัจจุบัน',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อแล้ว',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. component PriceChart แสดงอยู่บน Dashboard\n2. ราคา oracle ปัจจุบันแสดงที่ด้านบนของกราฟ\n3. P_target (ราคา strike ของรอบ) แสดงเป็นเส้นอ้างอิง',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ราคาอัปเดตทุก oracle round กราฟ plot ประวัติราคาตลอดช่วงรอบปัจจุบัน',
      },
    ],
  },

  uc07: {
    title: 'UC-07: ดูกองทุนสภาพคล่อง',
    badge: 'ข้อมูลตลาด',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้ดูยอด collateral ใน Long pool และ Short pool แบบ real-time',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อแล้ว',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. หา component Pool Meter บน Dashboard\n2. แสดง Long ETH vs Short ETH พร้อม balance bar แบบ visual\n3. skew factor (0.5× / 1× / 2×) คำนวณจากอัตราส่วนและแสดงเป็น badge',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ยอด pool อัปเดต real-time หลังมีสถานะใหม่ถูกเปิด',
      },
    ],
  },

  uc08: {
    title: 'UC-08: เปิดสถานะ Long',
    badge: 'การซื้อขาย',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้เปิดสถานะ Long โดยคาดว่าราคา ETH/USD จะสูงกว่า P_target เมื่อสิ้นรอบ',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อและมี Sepolia ETH เพียงพอ มีรอบที่ active อยู่ กระเป๋าต้องไม่ใช่ Treasury',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. คลิก "Long" ใน TradePanel\n2. ใส่จำนวน collateral (ขั้นต่ำ 0.001 ETH)\n3. ตรวจสอบ Order Summary (เบี้ย, net position, กำไรที่เป็นไปได้)\n4. คลิก "Open Long" และยืนยันธุรกรรมใน MetaMask',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ธุรกรรมถูก mine สถานะปรากฏใน Holdings table ของรอบปัจจุบัน',
      },
    ],
  },

  uc09: {
    title: 'UC-09: เปิดสถานะ Short',
    badge: 'การซื้อขาย',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้เปิดสถานะ Short โดยคาดว่าราคา ETH/USD จะต่ำกว่า P_target เมื่อสิ้นรอบ',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อและมี Sepolia ETH เพียงพอ มีรอบที่ active อยู่',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. คลิก "Short" ใน TradePanel\n2. ใส่จำนวน collateral\n3. ตรวจสอบ Order Summary\n4. คลิก "Open Short" และยืนยันธุรกรรม',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ธุรกรรมถูก mine สถานะปรากฏใน Holdings ด้วย Side = Short',
      },
    ],
  },

  uc10: {
    title: 'UC-10: สรุปคำสั่งซื้อขาย',
    badge: 'การซื้อขาย',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ก่อน submit การซื้อขาย ผู้ใช้สามารถตรวจสอบรายละเอียดค่าธรรมเนียมทั้งหมดและกำไรที่เป็นไปได้',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'TradePanel มีจำนวน collateral ที่ถูกต้อง',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. ใส่จำนวน collateral ใน TradePanel\n2. Order Summary อัปเดต live แสดง: เบี้ยฐาน, เบี้ยเอียง, เบี้ยเวลา, ค่าระยะห่างราคา, เบี้ยรวม %, Net Position, และ Possible Profit\n3. กด expand breakdown เพื่อดูคำอธิบายแต่ละฟิลด์',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ค่าทั้งหมดเป็นการประมาณจากราคา oracle และสถานะ pool ปัจจุบัน ค่าจริงอาจต่างเล็กน้อยเมื่อ mine transaction',
      },
    ],
  },

  uc11: {
    title: 'UC-11: ดูสถานะของฉัน',
    badge: 'สถานะของฉัน',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ผู้ใช้ดูสถานะที่เปิดอยู่ทั้งหมดในรอบปัจจุบันและรอบก่อนหน้า',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อ มีสถานะที่เปิดไว้อย่างน้อย 1 รายการ',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เลื่อนลงไปที่ส่วน HoldingsTable บน Dashboard\n2. ตารางแสดงแต่ละสถานะพร้อม: Cycle ID, Side, Entry Price, Target Price, Collateral, สถานะ (ITM / OTM), และ Est. Payout\n3. สถานะที่ settle แล้วแสดงจำนวน ETH ที่ claim ได้จริงจาก on-chain',
      },
      {
        heading: 'ผลลัพธ์หลังดำเนินการ',
        body: 'ตาราง refresh อัตโนมัติหลังทุก block',
      },
    ],
  },

  uc12: {
    title: 'UC-12: คำนวณผลตอบแทน',
    badge: 'สถานะของฉัน',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ระบบคำนวณผลตอบแทนที่คาดหวังของแต่ละสถานะโดยอิงจากราคา oracle ปัจจุบัน',
      },
      {
        heading: 'สูตรการคำนวณ',
        body: 'Net Position N = Collateral × (1 − เบี้ยรวม %)\nถ้า ITM: Payout = N × (1 + ΔP)  โดย ΔP = |P_entry − P_target| / P_target\nถ้า OTM: Payout = N  (คืนทุนเท่านั้น)',
      },
      {
        heading: 'หมายเหตุ',
        body: 'ผลตอบแทนที่แสดงใน Holdings สะท้อนยอดที่ claim ได้จริงจาก on-chain หลัง settle ก่อน settle เป็นเพียงการประมาณ สัญญาใช้สัดส่วน pool จริง ไม่ใช่สูตรโดยตรง',
      },
    ],
  },

  uc13: {
    title: 'UC-13: สถานะ ITM / OTM',
    badge: 'สถานะของฉัน',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'แต่ละสถานะแสดงว่าอยู่ใน In The Money (ITM) หรือ Out of The Money (OTM) ตามราคา live ปัจจุบัน',
      },
      {
        heading: 'กฎการตัดสิน',
        body: 'สถานะ Long เป็น ITM เมื่อ P_ปัจจุบัน > P_target\nสถานะ Short เป็น ITM เมื่อ P_ปัจจุบัน < P_target',
      },
      {
        heading: 'การแสดงผล',
        body: 'สถานะ ITM แสดง badge สีเขียว "ITM" สถานะ OTM แสดง badge สีหม่น "OTM" สถานะอัปเดตทุกครั้งที่ราคา oracle เปลี่ยน',
      },
    ],
  },

  uc14: {
    title: 'UC-14: ตารางข้อมูลหลัก',
    badge: 'ขั้นสูง',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'มุมมองข้อมูลดิบที่แสดงสถานะทั้งหมดในทุกรอบที่บันทึกไว้ใน smart contract',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าเชื่อมต่อ เข้าถึงได้จาก Dashboard',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เลื่อนลงไปที่ส่วน MasterDataTable\n2. ตารางดึงข้อมูล Position events ทั้งหมดจากสัญญาและแสดงรายละเอียดครบ รวมถึง block number และ transaction hash',
      },
      {
        heading: 'ประโยชน์',
        body: 'ใช้สำหรับ audit, debug, และสาธิตความโปร่งใสของ on-chain',
      },
    ],
  },

  uc15: {
    title: 'UC-15: Sandbox Panel',
    badge: 'ขั้นสูง',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'แผงควบคุมสำหรับ admin ใช้เรียก function บน contract เช่น force-settle รอบ',
      },
      {
        heading: 'เงื่อนไขก่อนใช้งาน',
        body: 'กระเป๋าที่เชื่อมต่อต้องเป็น Treasury (เจ้าของสัญญา) Sandbox Panel ถูกซ่อนสำหรับกระเป๋าอื่น',
      },
      {
        heading: 'ขั้นตอน',
        body: '1. เชื่อมต่อด้วยกระเป๋า Treasury\n2. Sandbox panel ปรากฏบน Dashboard\n3. ใช้ปุ่มที่มีเพื่อเรียก admin operations เช่น เริ่มรอบใหม่, force settle',
      },
      {
        heading: 'คำเตือน',
        body: 'การกระทำของ admin ไม่สามารถย้อนกลับได้บน on-chain ใช้ด้วยความระมัดระวัง',
      },
    ],
  },

  uc16: {
    title: 'UC-16: คำนวณเบี้ยประกัน',
    badge: 'ขั้นสูง',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'ทำความเข้าใจวิธีคำนวณเบี้ยประกันแบบหลายชั้นก่อนที่สถานะจะถูกรับ',
      },
      {
        heading: 'องค์ประกอบของเบี้ย',
        body: 'R_base = 0.001 (0.10% ของ collateral)\nS_factor = 0.5 ถ้า long pool > 2× short; 2.0 ถ้า short pool > 2× long; ไม่งั้น 1.0\nR_skew = R_base × S_factor\nR_time = 0% (Stable) / 2% (Warning) / 5–10% (Critical แบบ interpolated)\nR_dist = min(0.7 × ΔP, 0.7) เมื่อ ΔP > 0 และสถานะได้เปรียบราคาแล้ว\nΠ_รวม = R_skew + R_time + R_dist',
      },
      {
        heading: 'การนำไปใช้',
        body: 'Net Position N = C × (1 − Π_รวม) โดย Π_รวม ถูก cap เพื่อไม่ให้ N ติดลบ',
      },
    ],
  },

  uc17: {
    title: 'UC-17: การจ่ายผลตอบแทน',
    badge: 'ขั้นสูง',
    sections: [
      {
        heading: 'คำอธิบาย',
        body: 'เมื่อสิ้นรอบ 12 ชั่วโมง สัญญากระจาย ITM pool ให้สถานะที่ชนะตามสัดส่วน',
      },
      {
        heading: 'ลำดับการ settle',
        body: '1. บันทึก P_final จาก oracle\n2. จำแนกทุกสถานะเป็น ITM หรือ OTM\n3. net position ของฝั่ง OTM ถูกรวมเป็น payout pool\n4. แต่ละสถานะ ITM ได้รับ: (net ของตัวเอง / net ITM รวม) × payout pool',
      },
      {
        heading: 'การรับผลตอบแทน',
        body: 'หลัง settle ยอด ETH ที่ claim ได้ปรากฏใน Holdings table สำหรับทุกสถานะที่ settle แล้ว',
      },
    ],
  },
};

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
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {sec.body}
            </p>
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
