"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, CheckCircle, Volume2, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterviewSession({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sessionId = params.id;

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [questionCount, setQuestionCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null); // ✅ NEW: track errors

  const recognitionRef = useRef<any>(null);
  const isFinishingRef = useRef(false); // ✅ NEW: prevent double finishSession calls

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    try {
      const res = await fetch(
        `https://ai-tutor-evaluator.onrender.com/api/interviews/session/${sessionId}/next-question`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ FIX Bug 1: handle non-ok responses explicitly
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Server error: ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.isComplete) {
        // ✅ FIX Bug 2: guard against double calls
        if (!isFinishingRef.current) {
          isFinishingRef.current = true;
          await finishSession(token);
        }
      } else {
        setCurrentQuestion(data.question);
        setCurrentDifficulty(data.currentDifficulty);
        setQuestionCount(data.questionIndex);
        setTranscript('');
      }
    } catch (err) {
      console.error('FETCH QUESTION ERROR:', err);
      setError('Failed to fetch question. Please check your connection.');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNextQuestion();

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) setTranscript(prev => prev + finalTranscript);
        };
        recognitionRef.current = recognition;
      }
    }
  }, [sessionId]);

  const readQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    setTranscript('');
    setIsRecording(true);
    if (recognitionRef.current) recognitionRef.current.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const finishSession = async (token: string) => {
    try {
      const res = await fetch(
        `https://ai-tutor-evaluator.onrender.com/api/interviews/session/${sessionId}/evaluate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      console.log('FINAL RESULT:', data);

      localStorage.setItem('interviewResult', JSON.stringify(data));
      router.push('/result');
    } catch (err) {
      console.error('FINISH ERROR:', err);
      isFinishingRef.current = false; // ✅ reset on error so user can retry
      setError('Failed to evaluate session. Please try again.');
    }
  };

  const submitAnswer = async () => {
    stopRecording();
    setProcessing(true);

    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    const finalTranscript =
      transcript.trim() || 'I um basically have no idea... so yeah.';

    try {
      const res = await fetch(
        `https://ai-tutor-evaluator.onrender.com/api/interviews/session/${sessionId}/answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            transcript: finalTranscript,
          }),
        }
      );

      // ✅ FIX Bug 1: handle non-ok submit response
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Submit failed: ${res.status}`);
        setProcessing(false);
        return;
      }

      const data = await res.json();
      console.log('ANSWER RESPONSE:', data);

      // ✅ FIX Bug 2: if complete, finish — do NOT also call fetchNextQuestion
      if (data.isComplete) {
        setProcessing(false);
        if (!isFinishingRef.current) {
          isFinishingRef.current = true;
          await finishSession(token);
        }
        return; // ✅ CRITICAL: early return prevents fetchNextQuestion
      }

      // ✅ Only fetch next question if interview is NOT complete
      await fetchNextQuestion();

    } catch (err) {
      console.error('SUBMIT ERROR:', err);
      setError('Failed to submit answer. Please try again.');
    }

    setProcessing(false);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  // ✅ Error state — now shows actual error instead of "Interview completed or error fetching"
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
        <p className="text-destructive font-semibold text-lg">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchNextQuestion();
          }}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // ✅ No question — only shown if truly no question (not on completion)
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 transition-colors">
      <header className="flex justify-between items-center max-w-4xl w-full mx-auto mb-16">
        <div className="font-bold text-xl tracking-tight">AI Tutor Eval</div>
        <div className="flex gap-4">
          <div className="text-sm font-medium bg-secondary text-secondary-foreground px-4 py-2 rounded-full border border-border">
            Question {Math.min(questionCount || 1, 5)} of 5
          </div>
          <div className="text-sm font-medium bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/20">
            Level {currentDifficulty}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="w-full text-center mb-12"
          >
            <button
              onClick={() => readQuestion(currentQuestion.text)}
              className="mx-auto mb-6 p-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center justify-center"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-8 drop-shadow-sm">
              {currentQuestion.text}
            </h2>
          </motion.div>
        </AnimatePresence>

        <div className="w-full bg-card border border-border p-6 rounded-3xl min-h-[200px] mb-8 relative glass-card shadow-lg">
          {!isRecording && !transcript && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">
              Press microphone and speak your answer clearly...
            </div>
          )}
          {transcript && (
            <p className="text-lg text-card-foreground leading-relaxed font-medium pb-12">
              {transcript}
            </p>
          )}
          {isRecording && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-primary font-semibold">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
              Listening...
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={processing}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(100,50,255,0.4)] disabled:opacity-50"
            >
              <Mic className="w-8 h-8 text-primary-foreground" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,50,50,0.4)]"
            >
              <Square className="w-8 h-8 text-destructive-foreground fill-current" />
            </button>
          )}

          <button
            onClick={submitAnswer}
            disabled={processing || isRecording}
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full font-bold flex items-center gap-3 transition-colors disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : questionCount >= 5 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
            {questionCount >= 5 ? 'Finish Interview' : 'Submit Answer'}
          </button>
        </div>
      </main>
    </div>
  );
}
