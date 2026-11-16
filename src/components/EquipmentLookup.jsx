import { useEffect, useRef, useState } from 'react';
import { getEquipoByCodigo } from '../services/api';

export default function EquipmentLookup({ onSelect, onClear }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const video = useRef(null);
  const stream = useRef(null);
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setCamera(false); };
  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); }, []);
  const lookup = async (value) => {
    if (!value.trim()) { setError('Ingrese el código de inventario.'); return; }
    onClear?.();
    setBusy(true); setError('');
    try {
      const eq = await getEquipoByCodigo(value);
      if (!eq) setError('No se encontró el código en el inventario disponible.');
      else onSelect(eq);
    } catch (err) { setError(err.message || 'No se pudo consultar el inventario. Intente nuevamente.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!camera) return;
    let cancelled = false;
    let timer;
    const run = async () => {
      try {
        const detector = new window.BarcodeDetector();
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) { media.getTracks().forEach(t => t.stop()); return; }
        stream.current = media; video.current.srcObject = media;
        await video.current.play();
        const scan = async () => {
          if (cancelled) return;
          try {
            const results = await detector.detect(video.current);
            if (cancelled) return;
            if (results[0]) {
              const value = results[0].rawValue;
              setCode(value); stop(); await lookup(value); return;
            }
            timer = setTimeout(scan, 250);
          } catch { if (!cancelled) { setError('No se pudo leer la etiqueta. Use un lector o ingrese el código.'); stop(); } }
        };
        await scan();
      } catch { if (!cancelled) { setError('No se pudo abrir la cámara. Revise el permiso y use HTTPS o localhost.'); stop(); } }
    };
    run();
    return () => { cancelled = true; clearTimeout(timer); stream.current?.getTracks().forEach(t => t.stop()); };
    // The camera session keeps its initial lookup callback until it stops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  return <section className="border rounded p-3 mb-4 bg-light">
    <label htmlFor="inventory-code" className="form-label fw-bold">Buscar por código de inventario UNP</label>
    <p className="small text-muted">Escanee con un lector o escriba el código de la etiqueta. Se consulta el inventario local de prueba.</p>
    <div className="input-group">
      <input id="inventory-code" className="form-control" type="text" placeholder="740899504221" value={code} onChange={e => { setCode(e.target.value); onClear?.(); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!busy) lookup(code); } }} />
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => lookup(code)}>{busy ? 'Buscando...' : 'Buscar equipo'}</button>
      <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={() => {
        if (camera) stop();
        else if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) setError('Este navegador no permite el escaneo con cámara. Use un lector de barras o ingrese el código.');
        else { setError(''); setCamera(true); }
      }}>{camera ? 'Cerrar cámara' : 'Escanear con cámara'}</button>
    </div>
    {camera && <video ref={video} muted playsInline className="w-100 mt-3" style={{ maxHeight: 280 }} />}
    {error && <div className="text-danger mt-2" role="alert">{error}</div>}
  </section>;
}
