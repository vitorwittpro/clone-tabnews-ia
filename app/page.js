'use client';

import { useEffect, useRef, useState } from 'react';
import { cat, messages, names, palettes } from './art';

const claimsKey = 'calendario-gatos-resgates-v1';
const preferencesKey = 'calendario-gatos-preferencias-v1';
const defaults = { theme: 'light', style: 'cats', free: false };
const labels = { claimed: 'Resgatado', missed: 'Perdido', future: 'Ainda não disponível', available: 'Disponível para resgate' };
const badges = { claimed: '✓', missed: '×', future: '🔒', available: '🎁' };
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const moveDate = (date, delta) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function giftFile(date, style) {
  const svg = style === 'messages'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="400" viewBox="0 0 680 400"><rect width="680" height="400" rx="24" fill="${palettes[date.getMonth()][0]}"/><g text-anchor="middle" font-family="sans-serif" fill="#382f30"><text x="340" y="155" font-size="70" fill="#a94361">♥</text><text x="340" y="245" font-size="28">${messages[(date.getDate() - 1) % messages.length]}</text><text x="340" y="320" font-size="18">${date.toLocaleDateString('pt-BR')}</text></g></svg>`
    : cat(date.getMonth());
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function saveFile(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
}

export default function Calendar() {
  const [today, setToday] = useState(null);
  const [shown, setShown] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preferences, setPreferences] = useState(defaults);
  const [claims, setClaims] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setShown(new Date(now.getFullYear(), now.getMonth(), 1));
    function sync() {
      setToday(new Date());
      setClaims(readStorage(claimsKey, {}));
      setPreferences({ ...defaults, ...readStorage(preferencesKey, defaults) });
    }
    sync();
    const timer = setInterval(() => setToday(new Date()), 60_000);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  if (!today || !shown) return <main><section aria-busy="true">Carregando calendário…</section></main>;

  function status(date) {
    const key = dateKey(date);
    if (claims[key]) return 'claimed';
    if (preferences.free || key === dateKey(today)) return 'available';
    return key > dateKey(today) ? 'future' : 'missed';
  }

  function updatePreferences(change) {
    const next = { ...preferences, ...change };
    setPreferences(next);
    try { localStorage.setItem(preferencesKey, JSON.stringify(next)); }
    catch { setNotice('Não foi possível salvar suas preferências neste navegador.'); }
  }

  function openGift(date) { setNotice(''); setSelected(date); }
  function claim() {
    if (status(selected) !== 'available') return;
    const next = { ...claims, [dateKey(selected)]: { file: giftFile(selected, preferences.style), claimedAt: new Date().toISOString() } };
    try {
      localStorage.setItem(claimsKey, JSON.stringify(next));
      setClaims(next);
      setNotice('');
    } catch { setNotice('Não foi possível salvar o resgate. Libere o armazenamento do navegador e tente novamente.'); }
  }

  const state = selected ? status(selected) : null;
  const file = selected && (claims[dateKey(selected)]?.file?.startsWith('data:image/svg+xml') ? claims[dateKey(selected)].file : giftFile(selected, preferences.style));
  const restricted = state === 'future' || state === 'missed';
  const month = shown.getMonth();
  const year = shown.getFullYear();
  const offset = new Date(year, month, 1).getDay();
  const count = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;

  async function downloadSticker() {
    if (status(selected) !== 'claimed' || busy) return;
    setBusy(true);
    try {
      const image = new Image();
      image.src = file;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const scale = Math.min(480 / image.naturalWidth, 480 / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      canvas.getContext('2d').drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .85));
      if (blob?.type !== 'image/webp') throw new Error();
      const url = URL.createObjectURL(blob);
      saveFile(url, `figurinha-${dateKey(selected)}.webp`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Figurinha estática criada! Importe o WebP em um app de figurinhas.');
    } catch { setNotice('Não foi possível gerar o WebP neste navegador. Você ainda pode baixar a imagem SVG.'); }
    finally { setBusy(false); }
  }

  return <div className={`app ${preferences.theme === 'night' ? 'night' : ''}`}>
    <main>
      <div className="picture"><div className="caption">Um gato para cada mês</div><div className="art" role="img" aria-label={`Arte de gato de ${names[month]}`} dangerouslySetInnerHTML={{ __html: cat(month) }} /></div>
      <section>
        <header><h1 aria-live="polite">{names[month]} {year}</h1><div className="navigation">
          <button aria-label="Mês anterior" onClick={() => setShown(new Date(year, month - 1, 1))}>←</button>
          <button aria-label="Próximo mês" onClick={() => setShown(new Date(year, month + 1, 1))}>→</button>
        </div></header>
        <div className="gift-bar"><div><strong>Seu presente de hoje</strong><p>{status(today) === 'claimed' ? 'Resgatado! Sua imagem está guardada neste navegador.' : preferences.free ? 'Modo livre ativo: explore e resgate qualquer dia.' : 'Abra e resgate até o fim do dia.'}</p></div><button className="gift-button" style={{ animation: status(today) === 'claimed' ? 'none' : undefined }} aria-label="Abrir presente de hoje" onClick={() => openGift(today)}>🎁</button></div>
        <div className="preferences">
          <label>Tema<select value={preferences.theme} onChange={event => updatePreferences({ theme: event.target.value })}><option value="light">Claro</option><option value="night">Noturno</option></select></label>
          <label>Presentes<select value={preferences.style} onChange={event => updatePreferences({ style: event.target.value })}><option value="cats">Gatos do mês</option><option value="messages">Mensagens carinhosas</option></select></label>
          <label className="toggle"><input type="checkbox" checked={preferences.free} onChange={event => updatePreferences({ free: event.target.checked })} />Modo livre: resgatar qualquer data</label>
          <button onClick={() => { if (confirm('Apagar todos os resgates salvos neste navegador?')) { try { localStorage.removeItem(claimsKey); setClaims({}); setNotice(''); } catch { setNotice('Não foi possível limpar os resgates.'); } } }}>Limpar resgates locais</button>
        </div>
        <div className="week" aria-hidden="true">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => <span key={day}>{day}</span>)}</div>
        <div className="days" role="list" aria-label="Dias do mês">{Array.from({ length: count }, (_, index) => {
          const date = new Date(year, month, index - offset + 1), dayState = status(date), isToday = dateKey(date) === dateKey(today);
          return <div key={dateKey(date)} role="listitem" className={`day ${dayState}${date.getMonth() !== month ? ' outside' : ''}${isToday ? ' today' : ''}`}><button aria-current={isToday ? 'date' : undefined} aria-label={`${date.toLocaleDateString('pt-BR', { dateStyle: 'full' })}, ${labels[dayState]}`} onClick={() => openGift(date)}><span>{date.getDate()}</span><small>{badges[dayState]}</small></button></div>;
        })}</div>
        <footer><span className="legend">Hoje em destaque</span><button onClick={() => setShown(new Date(today.getFullYear(), today.getMonth(), 1))}>Voltar para hoje</button></footer>
        <p className="note">Clique em um dia para ver seu presente. ✓ Resgatado · × Perdido · 🔒 Futuro.<br />Presentes ilustrados gerados no navegador. Suas preferências e resgates ficam salvos neste dispositivo.</p>
        {!selected && notice && <p role="status">{notice}</p>}
      </section>
    </main>
    <dialog ref={dialog} aria-labelledby="modal-title" onClose={() => setSelected(null)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close();
    }}>
      {selected && <>
        <div className="modal-header"><h2 id="modal-title">{selected.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</h2><button aria-label="Fechar" onClick={() => dialog.current.close()}>✕</button></div>
        <div className={`gift-preview${restricted ? ` restricted ${state}` : ''}`}>
          <img src={file} alt={restricted ? 'Prévia desfocada do presente' : 'Imagem do presente do dia'} />
          {restricted && <div className="restriction"><span aria-hidden="true" style={{ fontSize: 60 }}>{state === 'future' ? '🎁' : '⌛'}</span><strong>{state === 'future' ? 'Uma surpresa vem aí' : 'Este presente ficou para trás'}</strong><span>{state === 'future' ? `Libera em ${selected.toLocaleDateString('pt-BR')}. Volte nesse dia para resgatar.` : 'Não resgatado no dia. O acesso e o download estão encerrados.'}</span></div>}
        </div>
        <p role="status" aria-live="polite">{notice || ({ available: preferences.free ? 'Modo livre: resgate este presente e baixe quando quiser.' : 'Resgate até o fim de hoje para poder baixar quando quiser.', claimed: 'Presente resgatado! Você pode baixar esta imagem quando quiser neste navegador.', missed: 'Prazo encerrado. Este presente permanece bloqueado.', future: 'A imagem será revelada na data indicada.' })[state]}</p>
        <div className="actions">
          {state === 'available' && <button className="primary" onClick={claim}>Resgatar</button>}
          {state === 'claimed' && <><button className="primary" onClick={() => saveFile(file, `presente-${dateKey(selected)}.svg`)}>Baixar imagem</button><button disabled={busy} onClick={downloadSticker}>{busy ? 'Criando figurinha…' : 'Baixar figurinha'}</button><span className="note">WebP estático · 512 × 512 · importe em um app de figurinhas para usar no WhatsApp.</span></>}
        </div>
        <div className="modal-nav"><button disabled={busy} onClick={() => openGift(moveDate(selected, -1))}>← Dia anterior</button><button disabled={busy} onClick={() => openGift(moveDate(selected, 1))}>Próximo dia →</button></div>
      </>}
    </dialog>
  </div>;
}
