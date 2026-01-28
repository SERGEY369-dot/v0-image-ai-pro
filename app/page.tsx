'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const API_URL = "https://image.pollinations.ai/prompt/";
    let currentLang = 'ru';
    let history = JSON.parse(localStorage.getItem('ai_history') || '[]');
    let currentExampleIndex = 0;
    let topZIndex = 1000;

    const translations = {
      ru: {
        title: "Картинка AI Pro", ratio: "Формат:", examples: "Примеры:", prompt: "Ваш промпт:",
        btnGen: "✨ Сгенерировать", btnReset: "Сброс", gallery: "Галерея",
        btnClear: "Очистить галерею", wait: "Рисую...", empty: "Результат появится здесь", 
        download: "📥 Скачать", selectPlaceholder: "-- Выбрать --",
        examplesList: [
          "Киберпанк город будущего в неоновых огнях", 
          "Космический кот в скафандре на фоне далеких звезд", 
          "Средневековый замок на вершине заснеженного холма", 
          "Портрет эльфийки с золотыми волосами в сказочном лесу", 
          "Футуристический автомобиль мчится по ночному шоссе", 
          "Подводный мир с гигантскими светящимися медузами", 
          "Стимпанк лаборатория с медными трубами и паром", 
          "Японский сад камней с цветущей сакурой утром", 
          "Могучий дракон парит над облаками в лучах заката"
        ]
      },
      en: {
        title: "AI Image Pro", ratio: "Aspect Ratio:", examples: "Examples:", prompt: "Your Prompt:",
        btnGen: "✨ Generate", btnReset: "Reset", gallery: "Gallery",
        btnClear: "Clear Gallery", wait: "Drawing...", empty: "Result will appear here", 
        download: "📥 Download", selectPlaceholder: "-- Select --",
        examplesList: [
          "Cyberpunk city of the future in neon lights", 
          "Space cat in a suit against a backdrop of distant stars", 
          "Medieval castle on top of a snowy hill", 
          "Portrait of an elf with golden hair in a fairy forest", 
          "Futuristic car racing on a night highway", 
          "Underwater world with giant glowing jellyfish", 
          "Steampunk laboratory with copper pipes and steam", 
          "Japanese rock garden with blooming sakura in the morning", 
          "Mighty dragon soaring above the clouds at sunset"
        ]
      }
    };

    async function translateText(text: string, targetLang: string) {
      if (!text.trim()) return text;
      try {
        const sourceLang = targetLang === 'en' ? 'ru' : 'en';
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await res.json();
        return data.responseData.translatedText || text;
      } catch (e) {
        return text;
      }
    }

    async function changeLang(lang: string) {
      const oldPrompt = (document.getElementById('prompt') as HTMLTextAreaElement).value.trim();
      currentLang = lang;
      
      updateUI();

      if (oldPrompt && currentExampleIndex === 0) {
        const translated = await translateText(oldPrompt, lang);
        (document.getElementById('prompt') as HTMLTextAreaElement).value = translated;
      }
    }

    function updateUI() {
      const t = translations[currentLang as keyof typeof translations];
      document.getElementById('ui-title')!.innerText = t.title;
      document.getElementById('ui-label-ratio')!.innerText = t.ratio;
      document.getElementById('ui-label-examples')!.innerText = t.examples;
      document.getElementById('ui-label-prompt')!.innerText = t.prompt;
      document.getElementById('generateBtn')!.innerText = t.btnGen;
      document.getElementById('ui-reset')!.innerText = t.btnReset;
      document.getElementById('ui-gallery-title')!.innerText = t.gallery;
      document.getElementById('ui-clear-btn')!.innerText = t.btnClear;
      
      const status = document.getElementById('statusPlaceholder');
      if (status) status.innerText = t.empty;

      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('btn-' + currentLang)?.classList.add('active');

      const select = document.getElementById('promptExamples') as HTMLSelectElement;
      select.innerHTML = `<option value="">${t.selectPlaceholder}</option>`;
      t.examplesList.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex; opt.innerText = ex;
        select.appendChild(opt);
      });

      if (currentExampleIndex > 0) {
        select.selectedIndex = currentExampleIndex;
        (document.getElementById('prompt') as HTMLTextAreaElement).value = t.examplesList[currentExampleIndex - 1];
      }
    }

    function applyExample(index: number) {
      currentExampleIndex = index;
      if(index > 0) {
        (document.getElementById('prompt') as HTMLTextAreaElement).value = translations[currentLang as keyof typeof translations].examplesList[index - 1];
      }
    }

    async function downloadImg(url: string) {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ai-img-${Date.now()}.jpg`;
      link.click();
    }

    async function generateImage() {
      const basePrompt = (document.getElementById('prompt') as HTMLTextAreaElement).value.trim();
      if (!basePrompt) return;

      const qualityBoost = ", ultra-detailed, 8k resolution, highly saturated colors, cinematic lighting, sharp focus, masterpiece, crystal clear";
      const fullPrompt = basePrompt + qualityBoost;

      const btn = document.getElementById('generateBtn') as HTMLButtonElement;
      const container = document.getElementById('resultContainer')!;
      btn.disabled = true;
      container.innerHTML = `<div class="loader"></div><p>${translations[currentLang as keyof typeof translations].wait}</p>`;
      
      const ratio = (document.getElementById('aspectRatio') as HTMLSelectElement).value;
      let w = 1024, h = 1024;
      if (ratio === '16:9') { w = 1280; h = 720; }
      else if (ratio === '9:16') { w = 720; h = 1280; }
      else if (ratio === '3:2')  { w = 1200; h = 800; }

      const url = `${API_URL}${encodeURIComponent(fullPrompt)}?width=${w}&height=${h}&seed=${Math.floor(Math.random()*999999)}&model=flux&nologo=true&t=${Date.now()}`;
      
      const img = new Image();
      img.src = url;
      img.onload = () => {
        container.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:8px;"><button class="download-btn" onclick="window.downloadImg('${url}')">${translations[currentLang as keyof typeof translations].download}</button>`;
        history.unshift(url);
        localStorage.setItem('ai_history', JSON.stringify(history.slice(0, 30)));
        addToGallery(url);
        btn.disabled = false;
      };
    }

    function addToGallery(url: string) {
      const g = document.getElementById('gallery')!;
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.left = Math.random() * 60 + "%";
      item.style.top = Math.random() * 150 + "px";
      topZIndex++;
      item.style.zIndex = topZIndex.toString();
      item.innerHTML = `<img src="${url}">`;
      item.oncontextmenu = (e) => { e.preventDefault(); downloadImg(url); };
      g.appendChild(item);
      makeInteractable(item);
    }

    function initialGallery() {
      const g = document.getElementById('gallery')!;
      g.innerHTML = "";
      [...history].reverse().forEach((url: string) => addToGallery(url));
    }

    function clearGallery() {
      if(confirm(currentLang === 'ru' ? 'Очистить всю галерею?' : 'Clear all gallery?')) {
        history = [];
        localStorage.removeItem('ai_history');
        document.getElementById('gallery')!.innerHTML = "";
      }
    }

    function makeInteractable(el: HTMLElement) {
      let isRotating = false;
      let startAngle = 0;
      let currentRotation = 0;
      el.onmousedown = (e) => {
        if(e.button !== 0) return;
        e.preventDefault();
        topZIndex++; 
        el.style.zIndex = topZIndex.toString();
        const rect = el.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        if (offsetY < rect.height * 0.2 || offsetY > rect.height * 0.8 || offsetX < rect.width * 0.2 || offsetX > rect.width * 0.8) {
          isRotating = true;
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) - currentRotation;
        } else { isRotating = false; }
        let p3 = e.clientX, p4 = e.clientY;
        document.onmousemove = (me) => {
          me.preventDefault();
          if (isRotating) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            currentRotation = Math.atan2(me.clientY - centerY, me.clientX - centerX) - startAngle;
            el.style.transform = `rotate(${currentRotation}rad)`;
          } else {
            const p1 = p3 - me.clientX, p2 = p4 - me.clientY;
            p3 = me.clientX; p4 = me.clientY;
            el.style.top = (el.offsetTop - p2) + "px"; el.style.left = (el.offsetLeft - p1) + "px";
          }
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; };
      };
    }

    function softReset() {
      currentExampleIndex = 0;
      (document.getElementById('promptExamples') as HTMLSelectElement).selectedIndex = 0;
      (document.getElementById('prompt') as HTMLTextAreaElement).value = '';
      document.getElementById('resultContainer')!.innerHTML = `<div id="statusPlaceholder">${translations[currentLang as keyof typeof translations].empty}</div>`;
    }

    (window as any).changeLang = changeLang;
    (window as any).applyExample = applyExample;
    (window as any).generateImage = generateImage;
    (window as any).downloadImg = downloadImg;
    (window as any).clearGallery = clearGallery;
    (window as any).softReset = softReset;

    updateUI();
    initialGallery();
  }, [])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --bg: linear-gradient(135deg, #0d001a, #001a33);
          --card: rgba(20,25,35,0.9);
          --text: #e0e8f0;
          --border: #4a3a6e;
          --accent: #0055ff;
          --success: #10b981;
          --warning: #ff8800;
          --danger: #ef4444;
        }
        body {
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          margin: 0;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }
        .lang-panel { margin-bottom: 1rem; display: flex; gap: 10px; }
        .lang-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid var(--border);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          cursor: pointer;
        }
        .lang-btn.active { background: var(--accent); border-color: var(--accent); }
        .container {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 1100px;
          backdrop-filter: blur(15px);
          display: flex;
          flex-direction: row;
          gap: 2rem;
          margin-bottom: 2rem;
          box-sizing: border-box;
          z-index: 10;
        }
        .input-section { flex: 1; }
        .result-section {
          flex: 1;
          background: rgba(0,0,0,0.4);
          border-radius: 12px;
          padding: 1rem;
          min-height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--border);
          text-align: center;
        }
        .gallery-container {
          width: 100%;
          max-width: 1100px;
          min-height: 600px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .gallery-grid {
          position: relative;
          width: 100%;
          height: 500px;
        }
        .gallery-item {
          position: absolute;
          width: 180px;
          aspect-ratio: 1/1;
          border-radius: 8px;
          overflow: hidden;
          cursor: grab;
          border: 3px solid #fff;
          background: #000;
          box-shadow: 0 10px 20px rgba(0,0,0,0.6);
          user-select: none;
          touch-action: none;
        }
        .gallery-item:hover { 
          z-index: 999999 !important; 
          outline: 3px solid var(--accent);
        }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }

        textarea, select {
          width: 100%; padding: 12px; border-radius: 10px;
          background: #0f141e; color: white; border: 1px solid var(--border);
          margin-bottom: 1rem; font-family: inherit; box-sizing: border-box;
        }
        button {
          padding: 12px 20px; border-radius: 10px; border: none;
          cursor: pointer; font-weight: 700; transition: 0.3s;
        }
        .generate { background: var(--accent); color: white; width: 100%; margin-bottom: 10px; text-transform: uppercase; }
        .btn-reset { background: var(--warning); color: white; width: 100%; margin-top: 5px; }
        .btn-clear { background: var(--danger); color: white; padding: 8px 15px; font-size: 0.8rem; }
        .btn-clear:hover { filter: brightness(1.2); }
        .generate:disabled { opacity: 0.5; cursor: wait; }
        .download-btn { background: var(--success); color: white; width: 100%; margin-top: 15px; }
        .loader {
          border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--accent);
          border-radius: 50%; width: 45px; height: 45px; animation: spin 0.8s linear infinite;
          margin-bottom: 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="lang-panel">
        <button className="lang-btn" id="btn-ru" onClick={() => (window as any).changeLang('ru')}>RU</button>
        <button className="lang-btn" id="btn-en" onClick={() => (window as any).changeLang('en')}>EN</button>
      </div>

      <h1 id="ui-title">Картинка AI Pro</h1>

      <div className="container">
        <div className="input-section">
          <label id="ui-label-ratio">Формат:</label>
          <select id="aspectRatio">
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="3:2">3:2</option>
          </select>
          <label id="ui-label-examples">Примеры:</label>
          <select id="promptExamples" onChange={(e) => (window as any).applyExample(e.target.selectedIndex)}></select>
          <label id="ui-label-prompt">Ваш промпт:</label>
          <textarea id="prompt" rows={4}></textarea>
          <button className="generate" id="generateBtn" onClick={() => (window as any).generateImage()}>✨ Сгенерировать</button>
          <button className="btn-reset" id="ui-reset" onClick={() => (window as any).softReset()}>Сброс</button>
        </div>
        <div className="result-section" id="resultContainer">
          <div id="statusPlaceholder">Результат появится здесь</div>
        </div>
      </div>

      <div className="gallery-container">
        <div className="gallery-header">
          <h3 style={{margin: 0}} id="ui-gallery-title">Галерея</h3>
          <button className="btn-clear" id="ui-clear-btn" onClick={() => (window as any).clearGallery()}>Очистить галерею</button>
        </div>
        <div className="gallery-grid" id="gallery"></div>
      </div>
    </>
  )
}
