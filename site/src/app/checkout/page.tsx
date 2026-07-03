'use client';

import { useState, useEffect } from 'react';
import { Check, EyeOff } from 'lucide-react';
import { apiFetch } from '@/lib/client-fetch';

const steps = [
  { id: 1, name: 'Identificação' },
  { id: 2, name: 'Endereço' },
  { id: 3, name: 'Frete' },
  { id: 4, name: 'Pagamento' },
];

function getSessionId() {
  const id = localStorage.getItem('alura_cart_session');
  return id || '';
}

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
}

// ─── Step 1: Login/Register ───
function IdentificationStep({ onNext }: { onNext: (customer: CustomerInfo) => void }) {
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

  const apiPost = async <T = unknown>(path: string, body: Record<string, unknown>) => {
    return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const data = await apiPost<{ customer: CustomerInfo }>('/api/auth/login', { email: loginEmail, password: loginPw }); onNext(data.customer); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (regPw !== regPw2) { setError('Senhas não conferem.'); return; }
    if (regPw.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setLoading(true);
    try { const data = await apiPost<{ customer: CustomerInfo }>('/api/auth/register', { name: regName, email: regEmail, password: regPw, password_confirmation: regPw2 }); onNext(data.customer); }
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

interface SavedAddress {
  id: number;
  label: string | null;
  type: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  is_default: boolean;
}

// ─── Step 2: Address ───
function AddressStep({ customer, onNext, onBack }: {
  customer: CustomerInfo | null;
  onNext: (address: Record<string, string>, addressId: number | null) => void;
  onBack: () => void;
}) {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(!customer);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [cep, setCep] = useState(''); const [loadingCep, setLoadingCep] = useState(false); const [cepError, setCepError] = useState('');
  const [street, setStreet] = useState(''); const [number, setNumber] = useState(''); const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState(''); const [city, setCity] = useState(''); const [state, setState] = useState('');
  const ic = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const lc = "bg-bg text-text-muted";

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    apiFetch<SavedAddress[]>('/api/store/addresses')
      .then(list => {
        if (cancelled) return;
        setAddresses(list);
        const def = list.find(a => a.is_default);
        if (def) setSelectedId(def.id);
        else if (list.length === 0) setShowForm(true);
      })
      .catch(() => { if (!cancelled) setAddresses([]); });
    return () => { cancelled = true; };
  }, [customer]);

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

  const resetForm = () => {
    setFormLabel(''); setCep(''); setStreet(''); setNumber(''); setComplement('');
    setNeighborhood(''); setCity(''); setState(''); setCepError(''); setError('');
  };

  const fillForm = (addr: SavedAddress) => {
    setFormLabel(addr.label || '');
    setCep(addr.zip_code);
    setStreet(addr.street);
    setNumber(addr.number);
    setComplement(addr.complement || '');
    setNeighborhood(addr.neighborhood);
    setCity(addr.city);
    setState(addr.state);
  };

  const handleSaveAddress = async () => {
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim() || !cep.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!customer) return;

    setSaving(true); setError('');
    const body = {
      type: 'shipping',
      label: formLabel.trim() || null,
      zip_code: cep.replace(/\D/g, ''),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim() || '',
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
    };

    try {
      let addr: SavedAddress;
      if (editingId) {
        addr = await apiFetch<SavedAddress>(`/api/store/addresses/${editingId}`, {
          method: 'PUT', body: JSON.stringify(body),
        });
        setAddresses(prev => (prev ?? []).map(a => a.id === editingId ? addr : a));
      } else {
        addr = await apiFetch<SavedAddress>('/api/store/addresses', {
          method: 'POST', body: JSON.stringify(body),
        });
        setAddresses(prev => [...(prev ?? []), addr]);
      }
      setSelectedId(addr.id);
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar endereço.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/store/addresses/${id}`, { method: 'DELETE' });
      setAddresses(prev => (prev ?? []).filter(a => a.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch { setError('Erro ao excluir endereço.'); }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await apiFetch(`/api/store/addresses/${id}/default`, { method: 'POST' });
      setAddresses(prev => (prev ?? []).map(a => ({ ...a, is_default: a.id === id })));
    } catch { setError('Erro ao definir endereço padrão.'); }
  };

  const handleContinue = () => {
    if (customer && selectedId) {
      const addr = addresses?.find(a => a.id === selectedId);
      if (addr) {
        onNext({
          zip_code: addr.zip_code,
          street: addr.street,
          number: addr.number,
          complement: addr.complement || '',
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
        }, addr.id);
        return;
      }
    }
    // Guest or new unsaved address
    const clean = cep.replace(/\D/g, '');
    if (!clean || !street.trim() || !number.trim() || !city.trim() || !state.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    onNext({
      zip_code: clean, street: street.trim(), number: number.trim(),
      complement: complement.trim(), neighborhood: neighborhood.trim(),
      city: city.trim(), state: state.trim().toUpperCase(),
    }, null);
  };

  const loadingAddresses = customer && addresses === null;
  if (loadingAddresses) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Endereço de entrega</h2>
      {error && <div className="mt-3 text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{error}</div>}

      {/* Saved addresses list */}
      {customer && addresses && addresses.length > 0 && !showForm && (
        <div className="mt-4 space-y-2">
          {addresses.map(addr => (
            <div key={addr.id} className={`border rounded-lg p-3 transition-colors ${selectedId === addr.id ? 'border-primary-500 bg-primary-50' : 'border-border'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="address" checked={selectedId === addr.id} onChange={() => { setSelectedId(addr.id); setError(''); }} className="mt-0.5 text-primary-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">{addr.label || 'Endereço'}</span>
                    {addr.is_default && <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Padrão</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}</p>
                  <p className="text-xs text-text-muted">{addr.neighborhood} — {addr.city}/{addr.state} — {addr.zip_code}</p>
                </div>
              </label>
              <div className="flex gap-2 mt-2 ml-7">
                <button onClick={() => { fillForm(addr); setEditingId(addr.id); setShowForm(true); setError(''); }} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Editar</button>
                {!addr.is_default && <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-text-muted hover:text-text font-medium">Definir como padrão</button>}
                {!addr.is_default && <button onClick={() => handleDelete(addr.id)} className="text-xs text-danger-500 hover:text-danger-600 font-medium">Excluir</button>}
              </div>
            </div>
          ))}
          <button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); setError(''); }} className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
            + Adicionar novo endereço
          </button>
        </div>
      )}

      {/* Address form */}
      {(showForm || !customer || (addresses && addresses.length === 0)) && (
        <div className="mt-4 space-y-3">
          {customer && (
            <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Nome do endereço (ex: Casa, Trabalho)" className={ic} />
          )}
          <div>
            <input type="text" placeholder="CEP" maxLength={9} value={cep} onChange={e => setCep(e.target.value)} onBlur={e => lookupCep(e.target.value)} className={`${ic} ${loadingCep ? lc : ''}`} />
            {loadingCep && <p className="text-xs text-text-muted mt-1">Consultando CEP...</p>}
            {cepError && <p className="text-xs text-danger-500 mt-1">{cepError} — preencha manualmente</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Rua" value={street} onChange={e => setStreet(e.target.value)} className={`${ic} col-span-2`} disabled={loadingCep} />
            <input type="text" placeholder="Nº" value={number} onChange={e => setNumber(e.target.value)} className={ic} disabled={loadingCep} />
          </div>
          <input type="text" placeholder="Complemento" value={complement} onChange={e => setComplement(e.target.value)} className={ic} disabled={loadingCep} />
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={ic} disabled={loadingCep} />
            <input type="text" placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} className={`${ic} col-span-2`} disabled={loadingCep} />
          </div>
          <input type="text" placeholder="Estado (UF)" value={state} onChange={e => setState(e.target.value)} maxLength={2} className={`${ic} w-20`} disabled={loadingCep} />

          {customer && showForm && (
            <div className="flex gap-3 pt-1">
              <button onClick={handleSaveAddress} disabled={saving} className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 flex justify-center">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingId ? 'Atualizar endereço' : 'Salvar endereço'}
              </button>
              {(addresses?.length ?? 0) > 0 && (
                <button onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text">Cancelar</button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6 pt-2">
        <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text">Voltar</button>
        <button onClick={handleContinue} disabled={customer ? !selectedId && !showForm : false} className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Shipping ───
function ShippingStep({ cep, onNext, onBack }: { cep: string; onNext: (method: string, cost: string) => void; onBack: () => void }) {
  const [options, setOptions] = useState<{ service_code: string; name: string; price: number; estimated_days?: number }[]>([]);
  const [selected, setSelected] = useState(''); const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ options: { service_code: string; name: string; price: number; estimated_days?: number }[] }>('/api/checkout/shipping', { method: 'POST', body: JSON.stringify({ cep, session_id: getSessionId() }) })
      .then(d => setOptions(d.options || [])).catch(() => setError('Erro ao carregar fretes')).finally(() => setLoading(false));
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
interface PaymentMethod {
  gateway: string;
  method: string;
  type: string;
  label: string;
  description?: string;
}

interface CheckoutResult {
  order?: { id: number; number: string; total: string };
  payment_data?: {
    status?: string;
    qr_code?: string;
    pix_code?: string;
    boleto_url?: string;
    boleto_digitable_line?: string;
  };
}

function PaymentStep({ address, addressId, customerId, shippingMethod, shippingCost, onBack }: {
  address: Record<string, string>; addressId: number | null; customerId?: number;
  shippingMethod: string; shippingCost: string;
  onBack: () => void;
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CheckoutResult | null>(null);

  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    apiFetch<{ methods: any[] }>('/api/checkout/payment-methods')
      .then(d => setMethods(d.methods || []))
      .catch(() => setError('Erro ao carregar formas de pagamento.'))
      .finally(() => setMethodsLoading(false));
  }, []);

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    if (!selected) {
      errors.payment = 'Selecione uma forma de pagamento.';
    }
    if (selected?.type === 'credit_card') {
      if (!cardNumber.replace(/\D/g, '').trim()) errors.card_number = 'Número do cartão obrigatório.';
      else if (cardNumber.replace(/\D/g, '').length < 13) errors.card_number = 'Número do cartão inválido.';
      if (!cardName.trim()) errors.card_name = 'Nome no cartão obrigatório.';
      if (!cardExpiry.trim()) errors.card_expiry = 'Validade obrigatória.';
      else if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) errors.card_expiry = 'Formato MM/AA.';
      if (!cardCvv.trim()) errors.card_cvv = 'CVV obrigatório.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelect = (method: PaymentMethod) => {
    setSelected({ ...method, type: method.type.toLowerCase() });
    setError('');
    setFieldErrors({});
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv(''); setInstallments(1);
  };

  const handleConfirm = async () => {
    if (!validateFields()) return;
    if (!selected) return;

    setSubmitting(true); setError(''); setFieldErrors({});
    try {
      const body: Record<string, unknown> = {
        session_id: getSessionId(),
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        payment_gateway: selected.gateway,
        payment_method: selected.method,
      };

      if (addressId) {
        body.address_id = addressId;
        if (customerId) body.customer_id = customerId;
      } else {
        body.address = address;
        if (customerId) { body.customer_id = customerId; body.save_address = true; body.address_label = 'Endereço'; }
      }

      if (selected.type === 'credit_card') {
        body.card_number = cardNumber.replace(/\D/g, '');
        body.card_name = cardName.trim();
        body.card_expiry = cardExpiry.trim();
        body.card_cvv = cardCvv.trim();
        body.installments = installments;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Domain': window.location.hostname },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        throw new Error(data.message || 'Erro ao processar pagamento.');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar compra.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──
  if (result) {
    const pd = result.payment_data;
    const isCreditCard = selected?.type === 'credit_card';
    const isPix = selected?.type === 'pix';
    const isBoleto = selected?.type === 'boleto';
    const total = parseFloat(result.order?.total || '0').toFixed(2).replace('.', ',');

    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-text mt-4">Pedido confirmado!</h2>
        <p className="text-text-muted mt-1">Número: <strong>{result.order?.number}</strong></p>
        <p className="text-text-muted">Total: R$ {total}</p>

        {isCreditCard && pd?.status === 'paid' && (
          <div className="mt-4 p-4 bg-success-500/10 border border-success-500/20 rounded-lg">
            <p className="text-sm font-semibold text-success-600">Pagamento aprovado</p>
            <p className="text-xs text-text-muted mt-1">Transação processada com sucesso.</p>
          </div>
        )}

        {isPix && (
          <div className="mt-4 p-4 bg-bg rounded-lg inline-block text-left">
            <p className="text-sm font-semibold text-text mb-3 text-center">Pagamento via PIX</p>
            {pd?.qr_code && (
              <div className="bg-white p-2 rounded mb-3 flex justify-center">
                <img src={pd.qr_code} alt="QR Code PIX" className="w-40 h-40" />
              </div>
            )}
            {pd?.pix_code && (
              <div>
                <p className="text-xs text-text-muted mb-1">Código copia e cola:</p>
                <div className="bg-bg border border-border rounded p-2">
                  <p className="text-xs text-text break-all font-mono select-all">{pd.pix_code}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(pd.pix_code || '')}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copiar código
                </button>
              </div>
            )}
            <p className="text-xs text-text-muted mt-3">Status: Aguardando pagamento</p>
          </div>
        )}

        {isBoleto && (
          <div className="mt-4 p-4 bg-bg rounded-lg inline-block text-left">
            <p className="text-sm font-semibold text-text mb-2 text-center">Boleto Bancário</p>
            {pd?.boleto_digitable_line && (
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-1">Linha digitável:</p>
                <div className="bg-bg border border-border rounded p-2">
                  <p className="text-xs text-text break-all font-mono select-all">{pd.boleto_digitable_line}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(pd.boleto_digitable_line || '')}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copiar linha digitável
                </button>
              </div>
            )}
            {pd?.boleto_url && (
              <a
                href={pd.boleto_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Visualizar / Imprimir Boleto
              </a>
            )}
            <p className="text-xs text-text-muted mt-3 text-center">Status: Aguardando pagamento</p>
          </div>
        )}
      </div>
    );
  }

  // ── Form view ──
  const ic = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const ie = "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500";
  const shippingPrice = parseFloat(shippingCost);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Pagamento</h2>
      {error && <div className="mt-3 text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{error}</div>}

      {methods.length === 0 && !methodsLoading && (
        <p className="mt-4 text-sm text-text-muted">Nenhuma forma de pagamento disponível.</p>
      )}

      <div className="mt-4 space-y-2">
        {methods.map(m => {
          const sel = selected?.gateway === m.gateway && selected?.method === m.method;
          return (
            <label
              key={`${m.gateway}-${m.method}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${sel ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}
            >
              <input
                type="radio"
                name="payment"
                checked={sel}
                onChange={() => handleSelect(m)}
                className="text-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-text">{m.label}</p>
                {m.description && <p className="text-xs text-text-muted">{m.description}</p>}
              </div>
            </label>
          );
        })}
      </div>
      {fieldErrors.payment && <p className="mt-1 text-xs text-danger-500">{fieldErrors.payment}</p>}

      {/* Credit card form */}
      {selected?.type === 'credit_card' && (
        <div className="mt-4 p-4 border border-border rounded-lg space-y-3">
          <div>
            <input
              type="text"
              value={cardNumber}
              onChange={e => { setCardNumber(e.target.value); setFieldErrors(prev => ({ ...prev, card_number: '' })); }}
              placeholder="Número do cartão"
              maxLength={19}
              className={`${ic} ${fieldErrors.card_number ? ie : ''}`}
            />
            {fieldErrors.card_number && <p className="mt-1 text-xs text-danger-500">{fieldErrors.card_number}</p>}
          </div>
          <div>
            <input
              type="text"
              value={cardName}
              onChange={e => { setCardName(e.target.value); setFieldErrors(prev => ({ ...prev, card_name: '' })); }}
              placeholder="Nome no cartão"
              className={`${ic} ${fieldErrors.card_name ? ie : ''}`}
            />
            {fieldErrors.card_name && <p className="mt-1 text-xs text-danger-500">{fieldErrors.card_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                value={cardExpiry}
                onChange={e => { setCardExpiry(e.target.value); setFieldErrors(prev => ({ ...prev, card_expiry: '' })); }}
                placeholder="MM/AA"
                maxLength={5}
                className={`${ic} ${fieldErrors.card_expiry ? ie : ''}`}
              />
              {fieldErrors.card_expiry && <p className="mt-1 text-xs text-danger-500">{fieldErrors.card_expiry}</p>}
            </div>
            <div>
              <input
                type="text"
                value={cardCvv}
                onChange={e => { setCardCvv(e.target.value.replace(/\D/g, '')); setFieldErrors(prev => ({ ...prev, card_cvv: '' })); }}
                placeholder="CVV"
                maxLength={4}
                className={`${ic} ${fieldErrors.card_cvv ? ie : ''}`}
              />
              {fieldErrors.card_cvv && <p className="mt-1 text-xs text-danger-500">{fieldErrors.card_cvv}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Parcelas</label>
            <select
              value={installments}
              onChange={e => setInstallments(Number(e.target.value))}
              className={`${ic} bg-surface`}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}x de R$ {(shippingPrice / n).toFixed(2).replace('.', ',')}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Endereço</span>
          <span className="text-text text-right max-w-[60%]">{address.street}, {address.number} — {address.city}/{address.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Frete</span>
          <span className="text-text">{shippingMethod} — R$ {shippingPrice.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selected || submitting}
          className="flex-1 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {submitting ? 'Processando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ───
export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [address, setAddress] = useState<Record<string, string>>({});
  const [addressId, setAddressId] = useState<number | null>(null);
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch('/api/store/me', { headers: { 'X-Tenant-Domain': window.location.hostname } })
      .then(r => r.json())
      .then(d => {
        if (d.authenticated && d.customer) {
          setCustomer(d.customer);
          setStep(2);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
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
          step === 1 ? <IdentificationStep onNext={(c) => { setCustomer(c); setStep(2); }} /> :
          step === 2 ? <AddressStep customer={customer} onNext={(a, id) => { setAddress(a); setAddressId(id); setStep(3); }} onBack={() => setStep(1)} /> :
          step === 3 ? <ShippingStep cep={address.zip_code} onNext={(m, c) => { setShippingMethod(m); setShippingCost(c); setStep(4); }} onBack={() => setStep(2)} /> :
          <PaymentStep address={address} addressId={addressId} customerId={customer?.id} shippingMethod={shippingMethod} shippingCost={shippingCost} onBack={() => setStep(3)} />
        }
      </div>
    </div>
  );
}
