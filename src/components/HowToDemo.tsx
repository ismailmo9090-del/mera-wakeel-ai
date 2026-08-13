import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Check, Pointer } from 'lucide-react';

export type HowToType = 'login' | 'signup';
export type HowToUserType = 'citizen' | 'advocate';

interface HowToDemoProps {
  type: HowToType;
  userType: HowToUserType;
  open: boolean;
}

interface FieldDef {
  name: string;
  label: string;
  masked?: boolean;
}

type Action =
  | { type: 'move'; target: string }
  | { type: 'click' }
  | { type: 'type'; field: string; text: string }
  | { type: 'typeMasked'; field: string; len: number }
  | { type: 'checkTerm' }
  | { type: 'success'; label: string }
  | { type: 'pause'; ms: number }
  | { type: 'reset' };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const MOVE_MS = 650;
const CHAR_DELAY = 45;
const DOT_DELAY = 55;

/* Sample data shown by the mini mock — varies by portal (citizen vs advocate). */
const SAMPLES: Record<HowToUserType, { login: { email: string; passwordLen: number }; signup: any }> = {
  citizen: {
    login: { email: 'rahul.kumar@gmail.com', passwordLen: 8 },
    signup: {
      fullName: 'Rahul Sharma',
      phone: '98***10',
      email: 'rahul.sharma@gmail.com',
      barNumber: '',
      passwordLen: 8,
    },
  },
  advocate: {
    login: { email: 'advocate@barcouncil.in', passwordLen: 8 },
    signup: {
      fullName: 'Adv. Vikram Mehta',
      phone: '98***98',
      email: 'vikram.mehta@barcouncil.in',
      barNumber: 'D/2048/2018',
      passwordLen: 8,
    },
  },
};

const loginFields: FieldDef[] = [
  { name: 'email', label: 'Email Address' },
  { name: 'password', label: 'Password', masked: true },
];

const signupFields = (userType: HowToUserType): FieldDef[] =>
  userType === 'advocate'
    ? [
        { name: 'fullName', label: 'Full Name' },
        { name: 'phone', label: 'Phone Number' },
        { name: 'email', label: 'Email Address' },
        { name: 'barNumber', label: 'Bar Council No.' },
        { name: 'password', label: 'Create Password', masked: true },
        { name: 'confirm', label: 'Confirm Password', masked: true },
      ]
    : [
        { name: 'fullName', label: 'Full Name' },
        { name: 'phone', label: 'Phone Number' },
        { name: 'email', label: 'Email Address' },
        { name: 'password', label: 'Create Password', masked: true },
        { name: 'confirm', label: 'Confirm Password', masked: true },
      ];

const buildActions = (type: HowToType, userType: HowToUserType): Action[] => {
  const s = SAMPLES[userType];
  const to = (target: string): Action => ({ type: 'move', target });
  const click = (): Action => ({ type: 'click' });
  const field = (name: string): Action => ({ type: 'type', field: name, text: s.signup[name] });
  const masked = (name: string, len: number): Action => ({ type: 'typeMasked', field: name, len });

  if (type === 'login') {
    return [
      to('email'),
      click(),
      { type: 'type', field: 'email', text: s.login.email },
      to('password'),
      click(),
      masked('password', s.login.passwordLen),
      to('submit'),
      click(),
      { type: 'success', label: 'Logging in...' },
      { type: 'pause', ms: 1500 },
      { type: 'reset' },
    ];
  }

  const acts: Action[] = [
    to('fullName'),
    click(),
    field('fullName'),
    to('phone'),
    click(),
    field('phone'),
    to('email'),
    click(),
    field('email'),
  ];
  if (userType === 'advocate') {
    acts.push(to('barNumber'), click(), field('barNumber'));
  }
  acts.push(
    to('password'),
    click(),
    masked('password', s.signup.passwordLen),
    to('confirm'),
    click(),
    masked('confirm', s.signup.passwordLen),
    to('terms'),
    click(),
    { type: 'checkTerm' },
    to('submit'),
    click(),
    { type: 'success', label: 'Account ban raha hai...' },
    { type: 'pause', ms: 1500 },
    { type: 'reset' }
  );
  return acts;
};

/**
 * Reusable "How to Login/Signup" tutorial. Renders a mini mock of the real auth
 * form and plays a scripted, looping cursor animation (pure CSS/JS — no real
 * mouse tracking or form submission). Panel is only animated while `open`.
 */
export const HowToDemo: React.FC<HowToDemoProps> = ({ type, userType, open }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef<Record<string, HTMLElement | null>>({});
  const cursorRef = useRef({ x: 0, y: 0, visible: false });

  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [animCursor, setAnimCursor] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [terms, setTerms] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [runId, setRunId] = useState(0);

  const fields = type === 'login' ? loginFields : signupFields(userType);

  const setFieldRef = (name: string) => (el: HTMLElement | null) => {
    targetsRef.current[name] = el;
  };

  const spawnRipple = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((ri) => ri.id !== id)), 600);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setValues({});
    setTerms(false);
    setSuccess(null);
    setActiveField(null);
    setCursor({ x: 0, y: 0, visible: false });
    cursorRef.current = { x: 0, y: 0, visible: false };

    const moveTo = async (name: string) => {
      const el = targetsRef.current[name];
      const card = cardRef.current;
      if (!el || !card) return;
      const er = el.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const x = er.left + er.width / 2 - cr.left;
      const y = er.top + er.height / 2 - cr.top;
      const first = !cursorRef.current.visible;
      cursorRef.current = { x, y, visible: true };
      if (first) {
        setAnimCursor(false);
        setCursor({ x, y, visible: true });
        await nextFrame();
        setAnimCursor(true);
      } else {
        setCursor({ x, y, visible: true });
      }
      await sleep(MOVE_MS);
    };

    const doClick = async () => {
      const { x, y } = cursorRef.current;
      spawnRipple(x, y);
      setPressed(true);
      await sleep(160);
      if (cancelled) return;
      setPressed(false);
      await sleep(240);
    };

    const typeText = async (field: string, text: string, delay: number) => {
      for (let i = 1; i <= text.length; i++) {
        if (cancelled) return;
        setValues((p) => ({ ...p, [field]: text.slice(0, i) }));
        await sleep(delay);
      }
    };

    const typeDots = async (field: string, len: number, delay: number) => {
      for (let i = 1; i <= len; i++) {
        if (cancelled) return;
        setValues((p) => ({ ...p, [field]: '•'.repeat(i) }));
        await sleep(delay);
      }
    };

    const run = async () => {
      await sleep(500);
      const actions = buildActions(type, userType);
      // Start cursor just above the first field so the very first move is smooth
      while (!cancelled) {
        for (const a of actions) {
          if (cancelled) return;
          switch (a.type) {
            case 'move':
              setActiveField(a.target);
              await moveTo(a.target);
              break;
            case 'click':
              await doClick();
              break;
            case 'type':
              await typeText(a.field, a.text, CHAR_DELAY);
              break;
            case 'typeMasked':
              await typeDots(a.field, a.len, DOT_DELAY);
              break;
            case 'checkTerm':
              spawnRipple(cursorRef.current.x, cursorRef.current.y);
              setTerms(true);
              await sleep(450);
              break;
            case 'success':
              setSuccess(a.label);
              await sleep(900);
              break;
            case 'pause':
              await sleep(a.ms);
              break;
            case 'reset':
              setValues({});
              setTerms(false);
              setSuccess(null);
              setActiveField(null);
              await sleep(450);
              break;
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, type, userType, runId]);

  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div
        ref={cardRef}
        className="relative rounded-xl bg-[#1C2E52] border border-[#FFFFFF]/10 p-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD766] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
            Live Demo:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#E2E8F0]">
              {type === 'login' ? 'Login Kaise Kare' : 'Signup Kaise Kare'}
            </span>
            <button
              type="button"
              onClick={() => setRunId((r) => r + 1)}
              className="w-6 h-6 rounded-full bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Replay demo"
            >
              <RotateCcw className="w-3 h-3 text-[#E2E8F0]" />
            </button>
          </div>
        </div>

        {/* Mini form replica (matches real field order per portal) */}
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-[9px] font-bold text-[#CBD5E1] mb-0.5">{f.label}</label>
              <div
                ref={setFieldRef(f.name)}
                className={`relative rounded-md border bg-[#0F1D38]/60 px-2 py-1.5 text-[10px] font-mono text-[#F1F5F9] transition-colors ${
                  activeField === f.name
                    ? 'border-[#F5A623] ring-1 ring-[#F5A623]/30'
                    : 'border-[#FFFFFF]/15'
                }`}
              >
                {f.masked
                  ? '•'.repeat((values[f.name] || '').length)
                  : values[f.name] || (
                      <span className="text-[#7B8A9E] font-sans">
                        {f.name === 'email'
                          ? userType === 'advocate' && type === 'signup'
                            ? 'advocate@email.com'
                            : 'apna@email.com'
                          : f.name === 'barNumber'
                          ? 'e.g. D/2048/2018'
                          : '••••••••'}
                      </span>
                    )}
              </div>
            </div>
          ))}

          {/* Terms checkbox (Signup only) */}
          {type === 'signup' && (
            <div ref={setFieldRef('terms')} className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  terms ? 'bg-[#D4A017] border-[#D4A017]' : 'bg-[#0F1D38]/60 border-[#FFFFFF]/25'
                }`}
              >
                {terms && (
                  <motion.span
                    initial={{ scale: 0.4, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-3 h-3 text-[#0F1D38]" strokeWidth={3.5} />
                  </motion.span>
                )}
              </span>
              <span className="text-[9px] text-[#CBD5E1]">Main Terms & Conditions accept karta hoon</span>
            </div>
          )}

          {/* Submit button */}
          <div ref={setFieldRef('submit')}>
            <motion.div
              animate={pressed ? { scale: 0.96 } : { scale: 1 }}
              transition={{ duration: 0.1 }}
              className={`mt-1 w-full rounded-md py-1.5 text-center text-[10px] font-extrabold transition-colors shadow border ${
                activeField === 'submit' && !pressed
                  ? 'bg-[#F5A623] text-[#0F1D38] border-[#FFD766]'
                  : 'bg-[#0F2557] text-[#FFFFFF] border-[#F5A623]/30'
              }`}
            >
              {type === 'login' ? 'Login to Portal' : 'Create Account'}
            </motion.div>
          </div>

          {/* Success message */}
          <div className="h-4">
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#8BEFB0]"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-3.5 h-3.5 rounded-full bg-[#16A34A]/20 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-[#8BEFB0]" strokeWidth={3.5} />
                  </motion.span>
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cursor + click ripples */}
        {open && (
          <>
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: cursor.x,
                top: cursor.y,
                opacity: cursor.visible ? 1 : 0,
                transform: 'translate(-2px, -4px)',
                transition: animCursor
                  ? `left ${MOVE_MS}ms cubic-bezier(0.4,0,0.2,1), top ${MOVE_MS}ms cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease`
                  : 'none',
              }}
            >
              <Pointer className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            </div>
            {ripples.map((ri) => (
              <motion.span
                key={ri.id}
                className="absolute z-10 pointer-events-none -ml-3 -mt-3 w-6 h-6 rounded-full border-2 border-[#F5A623]"
                style={{ left: ri.x, top: ri.y }}
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HowToDemo;