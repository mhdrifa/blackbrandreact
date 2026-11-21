import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { PHONE_RE } from '../../utils/format';

export function LoginPage() {
  const { auth, setCustomerSession } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') === 'checkout' ? '/checkout' : '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Sign in — BLACK BRAND';
    if (auth.user) navigate('/account', { replace: true });
  }, [auth.user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await apiPost('custLogin', { email, password });
      setCustomerSession(r);
      toast('Welcome back');
      navigate(next);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border border-hairline bg-white p-8">
        <h1 className="mb-5 font-display text-3xl">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">Email</label>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">Password</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
          </div>
          {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
          <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
            {busy ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
        <div className="mt-4 text-center text-xs"><Link to="/forgot-password" className="font-semibold underline">Forgot password?</Link></div>
        <div className="mt-3 text-center text-xs text-[#444748]">New here? <Link to="/register" className="font-semibold underline">Create an account</Link></div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { auth, setCustomerSession } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Create account — BLACK BRAND';
    if (auth.user) navigate('/account', { replace: true });
  }, [auth.user, navigate]);

  const sendReg = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirm) return setErr('Passwords do not match.');
    if (!PHONE_RE.test(form.phone.trim())) return setErr('Enter a valid phone number.');
    setBusy(true);
    try {
      await apiPost('custRegister', { name: form.name, email: form.email, phone: form.phone, password: form.password });
      setStep('verify');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyReg = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await apiPost('custVerify', { email: form.email.trim().toLowerCase(), code });
      setCustomerSession(r);
      toast('Account created — welcome to BLACK BRAND');
      navigate('/account');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="border border-hairline bg-white p-8">
          <h1 className="font-display text-3xl">Check your email</h1>
          <p className="my-3 text-xs text-slate">
            We sent a 6-digit code to <b>{form.email.trim().toLowerCase()}</b>. Enter it below to finish creating your account.
          </p>
          <form onSubmit={verifyReg} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Code</label>
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
            </div>
            {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
            <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
              {busy ? 'CREATING…' : 'CONFIRM & CREATE ACCOUNT'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => apiPost('custRegister', { name: form.name, email: form.email, phone: form.phone, password: form.password }).then(() => toast('A new code is on its way')).catch((e2) => toast(e2.message, true))}
            className="mt-4 block w-full text-center text-xs font-semibold underline"
          >
            Send a new code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border border-hairline bg-white p-8">
        <h1 className="mb-5 font-display text-3xl">Create account</h1>
        <form onSubmit={sendReg} className="space-y-3.5">
          {[
            ['Full name', 'name', 'text'],
            ['Email', 'email', 'email'],
            ['Phone number', 'phone', 'tel'],
            ['Password (min 8 characters)', 'password', 'password'],
            ['Confirm password', 'confirm', 'password']
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">{label}</label>
              <input
                type={type}
                required
                minLength={type === 'password' ? 8 : undefined}
                placeholder={key === 'phone' ? '+94 7X XXX XXXX' : undefined}
                value={form[key]}
                onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
                className="h-11 w-full border border-[#cfcfcd] px-3 text-sm"
              />
            </div>
          ))}
          {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
          <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
            {busy ? 'SENDING CODE…' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-[#444748]">Already registered? <Link to="/login" className="font-semibold underline">Sign in</Link></div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { setCustomerSession } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Reset password — BLACK BRAND'; }, []);

  const sendReset = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await apiPost('custForgot', { email: email.trim().toLowerCase() });
      setStep('reset');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const completeReset = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await apiPost('custReset', { email: email.trim().toLowerCase(), code, password });
      setCustomerSession(r);
      toast('Password updated');
      navigate('/account');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border border-hairline bg-white p-8">
        {step === 'email' ? (
          <>
            <h1 className="mb-5 font-display text-3xl">Reset password</h1>
            <form onSubmit={sendReset} className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
              </div>
              {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
              <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
                {busy ? 'SENDING…' : 'SEND RESET CODE'}
              </button>
            </form>
            <div className="mt-4 text-center text-xs"><Link to="/login" className="font-semibold underline">Back to sign in</Link></div>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl">Enter your code</h1>
            <p className="my-3 text-xs text-slate">
              If an account exists for <b>{email.trim().toLowerCase()}</b>, we sent a 6-digit code. It expires in 30 minutes.
            </p>
            <form onSubmit={completeReset} className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">Code</label>
                <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]">New password (min 8 characters)</label>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full border border-[#cfcfcd] px-3 text-sm" />
              </div>
              {err && <div className="border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">{err}</div>}
              <button type="submit" disabled={busy} className="h-12 w-full bg-obsidian font-display text-sm tracking-[0.1em] text-white">
                {busy ? 'SAVING…' : 'SET NEW PASSWORD'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
