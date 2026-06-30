'use client';

import { useState, useEffect } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';

const steps = [
  { id: 1, name: 'Identificação' },
  { id: 2, name: 'Endereço' },
  { id: 3, name: 'Frete' },
  { id: 4, name: 'Pagamento' },
];

function getSessionId() {
  const id = localStorage.getItem('njord_cart_session');
  return id || '';
}

// ─── Step 1: Login/Register ───
function IdentificationStep({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPw2, setRegPw2] = useState('');

  const apiPost = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({ message: 'Erro' })); throw new Error(err.message || 'Erro'); }
    return res.json();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await apiPost('/api/auth/login', { email: loginEmail, password: loginPw }); onNext(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (regPw !== regPw2) { setError('Senhas não conferem.'); return; }
    if (regPw.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setLoading(true);
    try { await apiPost('/api/auth/register', { name: regName, email: regEmail, password: regPw, password_confirmation: regPw2 }); onNext(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  };

  const ic = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      <p className="mt-1 text-sm text-text-muted">{mode === 'login' ? 'Acesse sua conta para continuar' : 'Cadastre-se para finalizar a compra'}</p>
      {error && <div className="mt-3 text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{error}</div>}
      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" required className={ic} />
          <div className="relative"><input type={showPw ? 'text' : 'password'} value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="Senha" required className={ic + " pr-10"} /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"><EyeOff size={16} /></button></div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60 flex justify-center">{loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Entrar'}</button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-4 space-y-3">
          <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nome completo" required className={ic} />
          <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email" required className={ic} />
          <input type="password" value={regPw} onChange={e => setRegPw(e.target.value)} placeholder="Senha (mín. 6)" required minLength={6} className={ic} />
          <input type="password" value={regPw2} onChange={e => setRegPw2(e.target.value)} placeholder="Confirmar senha" required className={ic} />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60 flex justify-center">{loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Criar conta e continuar'}</button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-text-muted">{mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-primary-600 hover:text-primary-700 font-medium">{mode === 'login' ? 'Cadastre-se' : 'Fazer login'}</button></p>
    </div>
  );
}

// ─── Step 2: Address ───
function AddressStep({ onNext, onBack }: { onNext: (a: Record<string, string>) => void; onBack: () => void }) {
  const [cep, setCep] = useState(''); const [loadingCep, setLoadingCep] = useState(false); const [cepError, setCepError] = useState('');
  const [street, setStreet] = useState(''); const [number, setNumber] = useState(''); const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState(''); const [city, setCity] = useState(''); const [state, setState] = useState('');
  const ic = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const lc = "bg-bg text-text-muted";

  const lookupCep = async (v: string) => {
    const clean = v.replace(/\D/g, ''); if (clean.length !== 8) return;
    setLoadingCep(true); setCepError('');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (d.erro) { setCepError('CEP não encontrado'); } else { setStreet(d.logradouro || ''); setNeighborhood(d.bairro || ''); setCity(d.localidade || ''); setState(d.uf || ''); }
    } catch { setCepError('Erro'); }
    finally { setLoadingCep(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onNext({ zip_code: cep.replace(/\D/g, ''), street, number, complement, neighborhood, city, state }); };

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Endereço de entrega</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div><input type="text" placeholder="CEP" maxLength={9} value={cep} onChange={e => setCep(e.target.value)} onBlur={e => lookupCep(e.target.value)} className={`${ic} ${loadingCep ? lc : ''}`} />{loadingCep && <p className="text-xs text-text-muted mt-1">Consultando CEP...</p>}{cepError && <p className="text-xs text-danger-500 mt-1">{cepError} — preencha manualmente</p>}</div>
        <div className="grid grid-cols-3 gap-3"><input type="text" placeholder="Rua" value={street} onChange={e => setStreet(e.target.value)} className={`${ic} col-span-2`} disabled={loadingCep} /><input type="text" placeholder="Nº" value={number} onChange={e => setNumber(e.target.value)} className={ic} disabled={loadingCep} /></div>
        <input type="text" placeholder="Complemento" value={complement} onChange={e => setComplement(e.target.value)} className={ic} disabled={loadingCep} />
        <div className="grid grid-cols-3 gap-3"><input type="text" placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={ic} disabled={loadingCep} /><input type="text" placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} className={`${ic} col-span-2`} disabled={loadingCep} /></div>
        <input type="text" placeholder="Estado (UF)" value={state} onChange={e => setState(e.target.value)} maxLength={2} className={`${ic} w-20`} disabled={loadingCep} />
        <div className="flex gap-3 pt-2"><button type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text">Voltar</button><button type="submit" className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">Continuar</button></div>
      </form>
    </div>
  );
}

// ─── Step 3: Shipping ───
function ShippingStep({ cep, onNext, onBack }: { cep: string; onNext: (method: string, cost: string) => void; onBack: () => void }) {
  const [options, setOptions] = useState<{ service_code: string; name: string; price: number; estimated_days?: number }[]>([]);
  const [selected, setSelected] = useState(''); const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/checkout/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cep, session_id: getSessionId() }) })
      .then(r => r.json()).then(d => setOptions(d.options || [])).catch(() => setError('Erro ao carregar fretes')).finally(() => setLoading(false));
  }, [cep]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Frete</h2>
      <p className="mt-1 text-sm text-text-muted">CEP: {cep}</p>
      {error && <p className="mt-2 text-sm text-danger-500">{error}</p>}
      {options.length === 0 && !loading && <p className="mt-4 text-sm text-text-muted">Nenhuma opção disponível para este CEP.</p>}
      <div className="mt-4 space-y-2">
        {options.map(o => (
          <label key={o.service_code} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selected === o.service_code ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="shipping" value={o.service_code} checked={selected === o.service_code} onChange={() => setSelected(o.service_code)} className="text-primary-600" />
              <div><p className="text-sm font-medium text-text">{o.name}</p>{o.estimated_days && <p className="text-xs text-text-muted">Até {o.estimated_days} dias úteis</p>}</div>
            </div>
            <p className="text-sm font-semibold text-text">{o.price === 0 ? 'Grátis' : `R$ ${o.price.toFixed(2).replace('.', ',')}`}</p>
          </label>
        ))}
      </div>
      <div className="flex gap-3 mt-4 pt-2"><button onClick={onBack} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text">Voltar</button><button onClick={() => { const o = options.find(o => o.service_code === selected); if (o) onNext(o.service_code, String(o.price)); }} disabled={!selected} className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">Continuar</button></div>
    </div>
  );
}

// ─── Step 4: Payment + Confirm ───
function PaymentStep({ address, shippingMethod, shippingCost, onBack }: {
  address: Record<string, string>; shippingMethod: string; shippingCost: string;
  onBack: () => void;
}) {
  const [methods, setMethods] = useState<{ gateway: string; method: string; label: string; type: string; description?: string }[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ order?: { number: string; total: string }; payment_data?: { qr_code?: string; boleto_url?: string; status?: string } } | null>(null);

  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    fetch('/api/checkout/payment-methods').then(r => r.json()).then(d => setMethods(d.methods || [])).catch(() => {});
  }, []);

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      const body: Record<string, unknown> = {
        session_id: getSessionId(), address,
        shipping_method: shippingMethod, shipping_cost: shippingCost,
        payment_gateway: selected, payment_method: selected,
      };
      if (selected === 'credit_card') {
        body.card_number = cardNumber;
        body.card_name = cardName;
        body.card_expiry = cardExpiry;
        body.card_cvv = cardCvv;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro');
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao finalizar compra'); }
    finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto"><Check size={32} className="text-white" /></div>
        <h2 className="text-xl font-bold text-text mt-4">Pedido confirmado!</h2>
        <p className="text-text-muted mt-1">Número: <strong>{result.order?.number}</strong></p>
        <p className="text-text-muted">Total: R$ {parseFloat(result.order?.total || '0').toFixed(2).replace('.', ',')}</p>
        {result.payment_data?.qr_code && (
          <div className="mt-4 p-4 bg-bg rounded-lg inline-block">
            <p className="text-sm font-medium text-text mb-2">Pague com PIX:</p>
            <div className="bg-white p-2 rounded"><img src={result.payment_data.qr_code} alt="QR Code PIX" className="w-40 h-40 mx-auto" /></div>
          </div>
        )}
        {result.payment_data?.boleto_url && <a href={result.payment_data.boleto_url} target="_blank" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium text-sm">Imprimir Boleto</a>}
      </div>
    );
  }

  const ic = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const shippingPrice = parseFloat(shippingCost);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Pagamento</h2>
      {error && <div className="mt-3 text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{error}</div>}

      <div className="mt-4 space-y-2">
        {methods.map(m => (
          <label key={m.gateway} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selected === m.gateway ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
            <input type="radio" name="payment" value={m.gateway} checked={selected === m.gateway} onChange={() => setSelected(m.gateway)} className="text-primary-600" />
            <div><p className="text-sm font-medium text-text">{m.label}</p>{m.description && <p className="text-xs text-text-muted">{m.description}</p>}</div>
          </label>
        ))}
      </div>

      {/* Credit card form */}
      {methods.find(m => m.gateway === selected)?.type === 'credit_card' && (
        <div className="mt-4 p-4 border border-border rounded-lg space-y-3">
          <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="Número do cartão" maxLength={19} className={ic} />
          <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome no cartão" className={ic} />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/AA" maxLength={5} className={ic} />
            <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="CVV" maxLength={4} className={ic} />
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-muted">Endereço</span><span className="text-text">{address.street}, {address.number} — {address.city}/{address.state}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Frete</span><span className="text-text">{shippingMethod} — R$ {shippingPrice.toFixed(2).replace('.', ',')}</span></div>
      </div>

      <div className="flex gap-3 mt-6 pt-2">
        <button onClick={onBack} disabled={loading} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text">Voltar</button>
        <button onClick={handleConfirm} disabled={!selected || loading} className="flex-1 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50 flex justify-center">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ───
export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch('/api/store/me').then(r => r.json()).then(d => { if (d.authenticated) setStep(2); }).catch(() => {}).finally(() => setCheckingAuth(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-8">Checkout</h1>
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${step >= s.id ? 'bg-primary-600 text-white' : 'bg-bg border border-border text-text-muted'}`}>
              {step > s.id ? <Check size={14} /> : s.id}
            </div>
            <span className={`text-xs hidden sm:block ${step >= s.id ? 'text-primary-600 font-medium' : 'text-text-muted'}`}>{s.name}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${step > s.id ? 'bg-primary-600' : 'bg-border'}`} />}
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-xl border border-border p-6">
        {checkingAuth ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div> :
          step === 1 ? <IdentificationStep onNext={() => setStep(2)} /> :
          step === 2 ? <AddressStep onNext={(a) => { setAddress(a); setStep(3); }} onBack={() => setStep(1)} /> :
          step === 3 ? <ShippingStep cep={address.zip_code} onNext={(m, c) => { setShippingMethod(m); setShippingCost(c); setStep(4); }} onBack={() => setStep(2)} /> :
          <PaymentStep address={address} shippingMethod={shippingMethod} shippingCost={shippingCost} onBack={() => setStep(3)} />
        }
      </div>
    </div>
  );
}
