/* global __ALLOW_MOCK__ */
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { APP_MODE } from '../../config/brand';
import { apiPost } from '../../services/api';
import { modeKey } from '../../utils/format';
import { LUXURY_EASE } from '../../components/ui/Primitives';

const KEY_ADMIN_TOK = modeKey('bb_admin_tok');

export function AdminLoginView({ initialMsg = '', onAuthenticated, onRequireSetup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [msg, setMsg] = useState(initialMsg);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMsg(initialMsg);
  }, [initialMsg]);

  const onEmailChange = (val) => {
    setEmail(val);
    if (needCode) {
      setNeedCode(false);
      setCode('');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!email.trim()) {
      setMsg('Email is required.');
      return;
    }
    if (!password) {
      setMsg('Password is required.');
      return;
    }
    if (needCode && !/^\d{6}$/.test(code.trim())) {
      setMsg('Enter the 6-digit authenticator code.');
      return;
    }

    setBusy(true);
    try {
      const r = await apiPost('adminLogin', {
        email: email.trim(),
        password,
        code: needCode ? code.trim() : undefined
      });
      sessionStorage.setItem(KEY_ADMIN_TOK, r.token);
      if (r.scope === 'setup') onRequireSetup(r);
      else onAuthenticated(r);
    } catch (err) {
      if (err.code === 'TOTP_REQUIRED' || err.code === 'INVALID_CODE') {
        setNeedCode(true);
        setMsg(err.code === 'TOTP_REQUIRED' ? '' : err.message);
      } else {
        setMsg(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-charcoal p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: LUXURY_EASE }}
        className="w-full max-w-[420px] bg-ivory p-7 shadow-2xl md:p-8"
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#444748]">
          <Lock className="h-3.5 w-3.5 text-champagne-dark" />
          <span>ENTERPRISE ADMIN</span>
        </div>
        <h1 className="mb-4 mt-1.5 font-display text-3xl text-obsidian">BLACK BRAND</h1>

        {__ALLOW_MOCK__ && APP_MODE === 'mock' && (
          <div className="mb-4 border border-champagne bg-[#faf7ef] p-3 text-[11px] leading-relaxed text-[#5a4316]">
            <b>Sandbox Mode:</b> Use <code>owner@sandbox.test</code> / <code>SandboxOwner123!</code> (full access), or{' '}
            <code>setup@sandbox.test</code> / <code>SandboxSetup123!</code> (2FA setup test, code <code>123456</code>).
          </div>
        )}

        {msg && (
          <div className="mb-4 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm"
            />
          </div>

          {needCode && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                Authenticator code
              </label>
              <input
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm tracking-[0.2em]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full bg-charcoal font-display text-base tracking-[0.08em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate">
          <a href="index.html" className="underline hover:text-obsidian">
            ← Back to store
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export function AdminTotpSetupView({ token, onComplete, onCancel }) {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const setupRequestRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    // React StrictMode replays effects in development. Reuse the same request,
    // but attach a fresh subscriber after cleanup so the QR code still renders.
    if (setupRequestRef.current?.token !== token) {
      setupRequestRef.current = {
        token,
        promise: apiPost('adminTotpSetup', {}, { token })
      };
    }
    let alive = true;
    setupRequestRef.current.promise
      .then((r) => {
        if (alive) setSetupData(r);
      })
      .catch((e) => {
        if (alive) onCancel(e.message);
      });
    return () => {
      alive = false;
    };
  }, [token, onCancel]);

  useEffect(() => {
    if (setupData?.otpauthUri && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, setupData.otpauthUri, { width: 180, margin: 1 }).catch(
        () => {}
      );
    }
  }, [setupData]);

  const confirm = async (e) => {
    e.preventDefault();
    setErr('');
    if (!/^\d{6}$/.test(code.trim())) {
      setErr('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    try {
      const s = await apiPost('adminTotpConfirm', { code: code.trim() }, { token });
      sessionStorage.setItem(KEY_ADMIN_TOK, s.token);
      onComplete(s);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-charcoal p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: LUXURY_EASE }}
        className="w-full max-w-[420px] bg-ivory p-7 shadow-2xl md:p-8"
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#444748]">
          <ShieldCheck className="h-3.5 w-3.5 text-champagne-dark" />
          <span>SECURITY</span>
        </div>
        <h1 className="mb-3 mt-1 font-display text-3xl text-obsidian">
          Set up 2-step verification
        </h1>

        {!setupData ? (
          <div className="my-10 flex justify-center" role="status" aria-label="Loading">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-hairline border-t-obsidian" />
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-slate">
              Scan with Google Authenticator, Authy or similar, then enter the 6-digit code.
            </p>
            <div className="my-3 grid place-items-center border border-hairline bg-white p-3">
              <canvas ref={canvasRef} />
            </div>
            <p className="text-xs text-slate">Or enter this key manually:</p>
            <div className="my-1.5 break-all border border-hairline bg-white p-2 font-mono text-xs">
              {setupData.secret}
            </div>
            <form onSubmit={confirm} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#444748]">
                  6-digit code
                </label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="h-11 w-full border border-[#cfcfcd] bg-white px-3 text-sm tracking-[0.2em]"
                />
              </div>
              {err && (
                <div className="border border-[#f3c1bd] bg-[#fff1f0] p-2.5 text-xs text-[#8a1a14]">
                  {err}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onCancel('')}
                  className="h-12 border border-[#bdbdbb] bg-white px-4 text-xs font-semibold uppercase tracking-[0.08em] text-obsidian hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="h-12 flex-1 bg-charcoal font-display text-sm tracking-[0.08em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? 'VERIFYING…' : 'ENABLE & CONTINUE'}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
