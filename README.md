# game8 — 8-bit Village (Go + Vanilla JS)

เดโมเกมมุมมอง 8-bit แบบเบาๆ เขียนด้วย Go สำหรับเสิร์ฟไฟล์เว็บ (`/web/game8`) และเกมเพลย์ฝั่งเบราว์เซอร์ (canvas + tile map).
โค้ด Go มี graceful shutdown และมีตัวอย่าง API (`/api/ping`).

> โครงปัจจุบัน:  
> `cmd/game8/main.go`, `web/game8/{index.html,styles.css,game.js,map.json}`, และ `internal/gamefs/embed.go` (สำรองสำหรับฝังไฟล์ในอนาคต)

---

## Features
- 🕹️ Canvas 320×240 (ขยาย x2) + tile map (เล็ก รันเร็ว)
- 🚶 WASD/ลูกศร เคลื่อนที่ + กล้องติดตามตัวละคร
- 🧱 ชนขอบ/ชนกำแพงด้วย AABB ง่ายๆ
- 🌐 เซิร์ฟเวอร์ Go เสิร์ฟ static + `/api/ping`
- ⛔ ปิดนุ่มนวล (graceful shutdown) เมื่อ CTRL+C
- 🔧 โหมด Dev: เสิร์ฟจากโฟลเดอร์ `web/game8` โดยตรง  
  โหมด Prod (ทางเลือก): รองรับฝังไฟล์ด้วย `embed.FS` (ดูด้านล่าง)

---

## Project layout

