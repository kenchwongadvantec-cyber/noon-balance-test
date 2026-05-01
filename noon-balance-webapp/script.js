/**
* Noon Balance - 深度整合加固版
*/

if (!document.getElementById('lunar-library')) {
  const lunarScript = document.createElement('script');
  lunarScript.id = 'lunar-library';
  lunarScript.src = "https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.js";
  document.head.appendChild(lunarScript);
  }
  
  const API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const API_KEY = "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";
  
  const form = document.getElementById("star-form");
  const resultArea = document.getElementById("result");
  const submitBtn = document.getElementById("submit-btn");
  
  // 工具函式保持不變
  function computeTST(dateStr, h, m) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dayOfYear = Math.floor((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 0))) / 86400000);
  const b = ((360 / 365) * (dayOfYear - 81) * Math.PI) / 180;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const lonCorr = 4 * (114.17 - (8 * 15));
  let base = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  base.setMinutes(base.getMinutes() + eot + lonCorr);
  return base.toISOString().split('T')[1].substring(0, 5);
  }
  
  function getBazi(dateStr, tst) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = tst.split(':').map(Number);
  const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
  const lunar = Lunar.fromSolar(solar);
  const ba = lunar.getEightChar();
  return {
  text: `${ba.getYear()} ${ba.getMonth()} ${ba.getDay()} ${ba.getTime()}`,
  raw: { y: ba.getYear(), m: ba.getMonth(), d: ba.getDay(), t: ba.getTime() },
  lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
  };
  }
  
  function typeWriter(text, element) {
  let i = 0;
  element.innerHTML = "";
  function typing() {
  if (i < text.length) {
  element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
  i++;
  setTimeout(typing, 15);
  window.scrollTo(0, document.body.scrollHeight);
  }
  }
  typing();
  }
  
  form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (typeof Solar === 'undefined') return;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-dots">文明同步中</span>';
  resultArea.innerHTML = `<div class="text-center gold-text animate-pulse text-sm">正在調研四維時空能量...</div>`;
  
  try {
  const type = document.getElementById("service-type").value;
  const bDate = document.getElementById("birth-date").value;
  const bHour = document.getElementById("birth-hour").value;
  const bMin = document.getElementById("birth-minute").value;
  
  const tst = computeTST(bDate, bHour, bMin);
  const bazi = getBazi(bDate, tst);
  
  const systemRole = `你是一位精通八字、紫微斗數、易經與古埃及曆法的跨文明命理大師。
  請務必從這四個維度深度分析，並將它們揉合在一起。
  語氣要專業且優雅。輸出格式請多用分段與加粗。`;
  
  const prompt = `受測者：${document.getElementById("name").value}。
  八字排盤：${bazi.text}。真太陽時：${tst}。農曆：${bazi.lunarDate}。
  請結合埃及曆法季節、易經卦象與紫微命格進行綜合評述。`;
  
  const response = await fetch(API_URL, {
  method: "POST",
  headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
  model: "llama-3.3-70b-versatile", // 修正為目前 Groq 最穩定的 70B 模型名稱
  messages: [{ role: "system", content: systemRole }, { role: "user", content: prompt }],
  temperature: 0.6
  })
  });
  
  const data = await response.json();
  
  // 安全檢查：確保 choices 存在
  if (!data.choices || data.choices.length === 0) {
  throw new Error("星際訊號微弱，AI 未能給出回覆。");
  }
  
  const oracleText = data.choices[0].message.content;
  
  resultArea.innerHTML = `
  <div class="bazi-card p-6 rounded-2xl mb-8">
  <div class="flex justify-around text-center mb-4">
  <div><div class="text-[10px] gold-text mb-1">時</div><div class="text-xl font-bold">${bazi.raw.t}</div></div>
  <div><div class="text-[10px] gold-text mb-1">日</div><div class="text-xl font-bold">${bazi.raw.d}</div></div>
  <div><div class="text-[10px] gold-text mb-1">月</div><div class="text-xl font-bold">${bazi.raw.m}</div></div>
  <div><div class="text-[10px] gold-text mb-1">年</div><div class="text-xl font-bold">${bazi.raw.y}</div></div>
  </div>
  <div class="text-center text-xs gold-text mt-4">真太陽時校準：${tst}</div>
  </div>
  <div id="typewriter-output" class="leading-loose text-slate-300"></div>
  `;
  
  typeWriter(oracleText, document.getElementById("typewriter-output"));
  
  } catch (err) {
  resultArea.innerHTML = `<div class="text-red-400 p-4 border border-red-900 rounded text-center">星訊異常：${err.message}<br><small>建議重新點擊或檢查 API 餘額</small></div>`;
  } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = '開始星時校準';
  }
  });
  
  window.toggleFields = function() {
  const type = document.getElementById("service-type").value;
  document.getElementById("p2-inputs").classList.toggle("hidden", type !== "relationship");
  document.getElementById("event-inputs").classList.toggle("hidden", type !== "event");
  };