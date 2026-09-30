import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchFlows, submitReport } from './api';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DocPanel } from './components/DocPanel';
import { CodeDialog } from './components/CodeDialog';
import { MessageList, ReviewCard, DoneCard } from './components/MessageList';
import { AnswerInput, DoneActions, FileStep, QuickReplies, ReviewActions } from './components/Composer';
import type { Answers, ChatMessage, FlowsResponse, Phase } from './types';
import { formatDateId, validateAnswer } from './validate';
import { getTheme } from './theme';
import { saveReport } from './myReports';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function App() {
  const theme = useMemo(getTheme, []);
  const [data, setData] = useState<FlowsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [flowId, setFlowId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [showCode, setShowCode] = useState(false); // popup kode laporan setelah terkirim
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [furthest, setFurthest] = useState(0); // indeks pertanyaan terjauh yang pernah ditanyakan

  const run = useRef(0); // token: membatalkan percakapan lama saat "mulai ulang"
  const nextId = useRef(1);
  const started = useRef(false);
  const resume = useRef<{ phase: Phase; idx: number } | null>(null); // tujuan kembali setelah selesai mengubah jawaban

  const flow = data && flowId ? data.flows[flowId] : null;

  const push = useCallback((role: 'bot' | 'user', text: string, kind?: ChatMessage['kind']) => {
    setMessages((m) => [...m, { id: nextId.current++, role, text, kind }]);
  }, []);

  /** Bot mengetik lalu menulis tiap baris. Mengembalikan false bila dibatalkan. */
  const say = useCallback(
    async (lines: string | string[], kind?: ChatMessage['kind']): Promise<boolean> => {
      const token = run.current;
      for (const line of Array.isArray(lines) ? lines : [lines]) {
        if (!prefersReduced()) {
          setTyping(true);
          await wait(Math.min(900, 350 + line.length * 6));
        }
        if (token !== run.current) return false;
        setTyping(false);
        push('bot', line, kind);
      }
      return true;
    },
    [push],
  );

  useEffect(() => {
    fetchFlows()
      .then(setData)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const askStep = useCallback(
    async (i: number, id: string, d: FlowsResponse, opts?: { revise?: boolean; resume?: boolean }) => {
      const f = d.flows[id];
      const step = f.steps[i];
      setPhase('sending'); // kunci input selama bot bicara
      setIdx(i);
      setDraft('');
      setInputError(null);
      if (!opts?.revise && !opts?.resume) setFurthest((f) => Math.max(f, i));
      if (step.section && !opts?.revise && !opts?.resume) {
        if (!(await say(step.section, 'section'))) return;
      }
      if (opts?.revise) {
        if (!(await say(`Baik, ubah jawaban untuk: ${step.label}.`))) return;
      }
      if (!(await say(step.q, 'q'))) return;
      setPhase('asking');
    },
    [say],
  );

  const goFiles = useCallback(
    async (f: NonNullable<typeof flow>) => {
      setPhase('sending');
      if (await say(f.files_prompt)) setPhase('files');
    },
    [say],
  );

  const goReview = useCallback(async () => {
    setPhase('sending');
    if (await say('Terima kasih. Berikut ringkasan laporan Anda. Periksa dulu, ubah bila perlu, lalu kirim.')) setPhase('review');
  }, [say]);

  const startFlow = useCallback(
    async (id: string, d: FlowsResponse) => {
      setFlowId(id);
      setAnswers({});
      setFiles([]);
      setEditing(false);
      setPhase('sending');
      const f = d.flows[id];
      if (!(await say(f.intro))) return;
      if (!(await say('Saya akan menanyakan beberapa hal satu per satu. Semua pertanyaan boleh dilewati.'))) return;
      await askStep(0, id, d);
    },
    [say, askStep],
  );

  const begin = useCallback(
    async (d: FlowsResponse) => {
      const params = new URLSearchParams(window.location.search);
      const wanted = params.get('jenis'); // tautan langsung dari website utama: /?jenis=wbs atau /?jenis=gratifikasi
      if (!(await say('Halo, selamat datang di Layanan Pelaporan PT Waskita Karya Infrastruktur.'))) return;
      if (wanted && d.flows[wanted]) {
        push('user', d.flows[wanted].button);
        await startFlow(wanted, d);
        return;
      }
      if (!(await say('Laporan apa yang ingin Anda sampaikan?'))) return;
      setPhase('choose');
    },
    [say, startFlow, push],
  );

  useEffect(() => {
    if (data && !started.current) {
      started.current = true;
      void begin(data);
    }
  }, [data, begin]);

  const restart = () => {
    run.current += 1;
    setTyping(false);
    setMessages([]);
    setAnswers({});
    setFiles([]);
    setFlowId(null);
    setDraft('');
    setInputError(null);
    setEditing(false);
    setRefCode('');
    setShowCode(false);
    setIdx(0);
    setFurthest(0);
    resume.current = null;
    if (data) {
      const params = new URLSearchParams(window.location.search);
      params.delete('jenis');
      window.history.replaceState(null, '', window.location.pathname + (params.toString() ? '?' + params : '') + window.location.hash);
      void begin(data);
    }
  };

  const pick = (id: string) => {
    if (!data) return;
    push('user', data.flows[id].button);
    void startFlow(id, data);
  };

  const finishAnswer = async (value: string) => {
    if (!flow || !flowId || !data) return;
    const step = flow.steps[idx];
    const clean = value.trim();
    setAnswers((a) => {
      const n = { ...a };
      if (clean) n[step.key] = clean;
      else delete n[step.key];
      return n;
    });
    setDraft('');
    setInputError(null);
    if (editing) {
      const back = resume.current;
      resume.current = null;
      setEditing(false);
      if (!back || back.phase === 'review') {
        await goReview();
      } else if (back.phase === 'files') {
        setPhase('sending');
        if (await say('Baik, jawaban sudah diperbarui. Kita lanjut ke lampiran.')) setPhase('files');
      } else if (await say('Baik, jawaban sudah diperbarui. Kita lanjut ke pertanyaan tadi.')) {
        await askStep(back.idx, flowId, data, { resume: true });
      }
    } else if (idx + 1 < flow.steps.length) {
      await askStep(idx + 1, flowId, data);
    } else {
      await goFiles(flow);
    }
  };

  const submitAnswer = () => {
    if (!flow) return;
    const step = flow.steps[idx];
    const err = validateAnswer(step, draft);
    if (err) {
      setInputError(err);
      return;
    }
    if (!draft.trim()) {
      skip();
      return;
    }
    push('user', step.type === 'date' ? formatDateId(draft.trim()) : draft.trim());
    void finishAnswer(draft);
  };

  const skip = () => {
    push('user', 'Dilewati');
    void finishAnswer('');
  };

  const edit = (i: number) => {
    if (!flow || !flowId || !data) return;
    if (!resume.current) resume.current = { phase, idx };
    setEditing(true);
    void askStep(i, flowId, data, { revise: true }).then(() => {
      setDraft(answers[flow.steps[i].key] ?? '');
    });
  };

  const send = async () => {
    if (!flowId || !flow || submitting) return;
    setSubmitting(true);
    setSendError(null);
    const res = await submitReport(flowId, answers, files);
    setSubmitting(false);
    if (res.ok && res.ref) {
      setRefCode(res.ref);
      setShowCode(true);
      saveReport({ ref: res.ref, title: flow.title, at: new Date().toISOString() });
      push('bot', 'Laporan Anda sudah kami terima. Terima kasih atas keberanian Anda.');
      setPhase('done');
    } else {
      const msg = (res.error ?? 'Laporan belum terkirim.') + ' Data Anda masih ada di sini, silakan coba kirim lagi.';
      push('bot', msg, 'error');
      setSendError(msg);
      setPhase('review');
    }
  };

  const progress = useMemo(() => {
    if (!flow || (phase !== 'asking' && phase !== 'files' && phase !== 'review')) return undefined;
    const total = flow.steps.length;
    const current = phase === 'asking' ? idx + 1 : total;
    let section: string | undefined;
    for (let i = Math.min(idx, total - 1); i >= 0; i--) {
      if (flow.steps[i].section) {
        section = flow.steps[i].section;
        break;
      }
    }
    return { current, total, section: phase === 'asking' ? section : undefined };
  }, [flow, phase, idx]);

  if (loadError) {
    return (
      <div className="layout" data-theme={theme}>
        <div className="shell">
          <Header />
          <main className="stage stage--center" id="main">
            <p className="field-error" role="alert">
              {loadError}
            </p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Muat ulang
            </button>
          </main>
        </div>
      </div>
    );
  }

  const locked = phase === 'sending' || submitting;

  return (
    <div className="layout" data-theme={theme}>
      <a className="skip-link" href="#composer">
        Lompat ke kolom jawaban
      </a>
      <Hero />
      <div className="shell">
        <Header flowTitle={flow?.title} progress={progress} />
        <main className="stage" id="main">
          <MessageList messages={messages} typing={typing}>
            {flow && phase === 'review' && <ReviewCard flow={flow} answers={answers} files={files} onEdit={edit} disabled={locked} />}
            {flow && phase === 'done' && <DoneCard refCode={refCode} outro={flow.outro} />}
          </MessageList>
        </main>
        <footer className="dock" id="composer">
          {phase === 'loading' && <p className="hint center">Memuat…</p>}
          {phase === 'choose' && data && <QuickReplies flows={data.flows} onPick={pick} />}
          {phase === 'asking' && flow && (
            <AnswerInput step={flow.steps[idx]} value={draft} error={inputError} onChange={(v) => { setDraft(v); setInputError(null); }} onSubmit={submitAnswer} onSkip={skip} onInvalid={setInputError} disabled={false} />
          )}
          {phase === 'files' && flow && data && (
            <FileStep
              rules={data.upload}
              files={files}
              onChange={setFiles}
              onNext={() => {
                push('user', files.length ? `${files.length} file dilampirkan` : 'Tidak ada lampiran');
                void goReview();
              }}
            />
          )}
          {phase === 'review' && <ReviewActions onSend={send} onRestart={restart} sending={submitting} error={sendError} />}
          {phase === 'done' && <DoneActions onRestart={restart} />}
        </footer>
      </div>
      {showCode && refCode && <CodeDialog code={refCode} onClose={() => setShowCode(false)} />}
      {theme === 'c' && <DocPanel flow={flow} answers={answers} idx={idx} phase={phase} reached={phase === 'asking' ? furthest : flow?.steps.length ?? 0} locked={locked} onEdit={edit} />}
    </div>
  );
}
