import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Wrench, Mic, MicOff, X, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; input: unknown; output: unknown }>;
}

const SUGGESTIONS = [
  'How many customers do I have?',
  'How many leads do I have?',
  "What's my pipeline value?",
  'What can you do?',
];

// Voice input uses the browser's built-in Web Speech API (Chrome/Edge only —
// there's no server component, so nothing to configure).
const SpeechRecognitionCtor: any =
  (typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.post('/ai/chat', { message, conversationId }),
    onSuccess: (res) => {
      setConversationId(res.data.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: res.data.message, toolCalls: res.data.toolCalls },
      ]);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['deals-board'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setInput('');
    chatMutation.mutate(text);
  }

  function toggleVoiceInput() {
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setVoiceError(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setVoiceError('Could not hear you clearly — please try again.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return (
    <>
      {/* expanded chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:right-6">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="AITELLION" className="h-6 w-6" />
              <div>
                <p className="font-display text-sm font-semibold text-text">AITELLION Assistant</p>
                <p className="text-[11px] text-text-faint">Ask it to look things up or take action</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-faint hover:bg-surface-2 hover:text-text"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="text-volt-soft" size={24} />
                <p className="mt-2 text-sm font-medium text-text">Ask AITELLION anything about your business</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-muted hover:border-volt hover:text-volt-soft"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-volt text-white' : 'bg-surface-2 text-text'}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                      {m.toolCalls.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-mono text-text-muted">
                          <Wrench size={10} /> {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-text-faint">Thinking…</div>
              </div>
            )}

            {chatMutation.isError && (
              <p className="text-center text-xs text-danger">
                The assistant couldn't respond. If this is a fresh deployment, make sure GEMINI_API_KEY is set in the backend .env.
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {voiceError && <p className="px-4 pt-1 text-center text-xs text-danger">{voiceError}</p>}

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                isListening
                  ? 'animate-pulse border-danger bg-danger/10 text-danger'
                  : 'border-border text-text-muted hover:border-volt hover:text-volt-soft'
              }`}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <input
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-volt"
              placeholder={isListening ? 'Listening…' : 'Ask or tell it to take an action…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={chatMutation.isPending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-volt text-white transition hover:bg-volt-soft disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-surface shadow-2xl ring-1 ring-border transition hover:ring-volt/60 sm:right-6"
      >
        {open ? <X size={22} className="text-text" /> : <img src="/logo.png" alt="AITELLION Assistant" className="h-8 w-8" />}
        {!open && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-volt/20" />}
      </button>
    </>
  );
}