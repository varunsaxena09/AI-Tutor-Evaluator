import OpenAI from 'openai';
import { calculateCommunicationMetrics } from '../utils/metrics';

type AIEvaluation = {
  overallScore: number;
  clarityScore: number;
  confidenceScore: number;
  communicationScore: number;
  warmthScore: number;
  simplicityScore: number;
  patienceScore: number;
  fluencyScore: number;
  detailedFeedback: string;
  recommendation: string;
  correctness: string;
};

// ✅ Reject mock/test/fake keys
const isRealKey = (key?: string) =>
  !!key &&
  key.startsWith('sk-') &&
  key.length > 40 &&
  !key.includes('mock') &&
  !key.includes('test') &&
  !key.includes('fake');

const openai = isRealKey(process.env.OPENAI_API_KEY)
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ✅ Smart fallback — realistic word count tiers for voice answers
const fallbackEvaluate = (
  transcript: string,
  metrics: ReturnType<typeof calculateCommunicationMetrics>
): AIEvaluation => {
  const lower = transcript.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).filter(Boolean).length;

  const failKeywords = [
    "don't know", "no idea", "not sure", "forgot", "pass", "sorry",
    "i have no", "no clue", "blank", "skip"
  ];
  const isFailed = failKeywords.some(kw => lower.includes(kw));

  if (isFailed || wordCount < 3) {
    return {
      correctness: 'incorrect',
      overallScore: 10,
      clarityScore: 2,
      confidenceScore: metrics.confidenceScore,
      communicationScore: 2,
      warmthScore: 3,
      simplicityScore: 2,
      patienceScore: 3,
      fluencyScore: 2,
      recommendation: 'REJECTED',
      detailedFeedback: 'Candidate was unable to answer the question.'
    };
  }

  // Realistic tiers for voice answers:
  //   < 3 words  → incorrect (caught above)
  //   3–8 words  → partial
  //   9–20 words → correct (concise)
  //   > 20 words → correct (detailed)

  let correctness: string;
  let overallScore: number;
  let clarityScore: number;
  let fluencyScore: number;
  let communicationScore: number;

  if (wordCount > 20) {
    correctness = 'correct';
    overallScore = 85;
    clarityScore = 8.5;
    fluencyScore = 8;
    communicationScore = 8.5;
  } else if (wordCount >= 9) {
    correctness = 'correct';
    overallScore = 70;
    clarityScore = 7;
    fluencyScore = 7;
    communicationScore = 7;
  } else if (wordCount >= 3) {
    correctness = 'partial';
    overallScore = 45;
    clarityScore = 5;
    fluencyScore = 5;
    communicationScore = 5;
  } else {
    correctness = 'incorrect';
    overallScore = 20;
    clarityScore = 3;
    fluencyScore = 3;
    communicationScore = 3;
  }

  if (metrics.fillerDensity > 0.15) {
    overallScore = Math.max(10, overallScore - 15);
    clarityScore = Math.max(1, clarityScore - 2);
    if (correctness === 'correct') correctness = 'partial';
  }

  if (metrics.pauseCount > 4) {
    overallScore = Math.max(10, overallScore - 10);
    if (correctness === 'correct') correctness = 'partial';
  }

  const recommendation =
    correctness === 'correct' && overallScore >= 65
      ? 'SELECTED'
      : correctness === 'partial'
      ? 'NEEDS_IMPROVEMENT'
      : 'REJECTED';

  return {
    correctness,
    overallScore,
    clarityScore,
    confidenceScore: metrics.confidenceScore,
    communicationScore,
    warmthScore: Math.min(10, communicationScore * 0.9),
    simplicityScore: Math.min(10, clarityScore * 0.95),
    patienceScore: Math.min(10, communicationScore * 0.85),
    fluencyScore,
    recommendation,
    detailedFeedback:
      correctness === 'correct'
        ? 'Good answer. Candidate demonstrated solid understanding.'
        : correctness === 'partial'
        ? 'Partial answer. Candidate showed some understanding but lacked depth.'
        : 'Insufficient answer. Candidate did not adequately address the question.'
  };
};

export const evaluateCandidateAnswer = async (
  questionText: string,
  transcript: string
) => {
  const metrics = calculateCommunicationMetrics(transcript);

  if (!openai) {
    console.log('ℹ️  No valid OpenAI key — using fallback evaluator.');
    const evaluation = fallbackEvaluate(transcript, metrics);
    console.log(`   words: ${transcript.trim().split(/\s+/).filter(Boolean).length}, correctness: ${evaluation.correctness}`);
    return { metrics, evaluation };
  }

  try {
    const prompt = `
Evaluate the tutor candidate's response.
Question: "${questionText}"
Answer: "${transcript}"
Filler Density: ${metrics.fillerDensity}
Pause Count: ${metrics.pauseCount}

Return STRICT JSON:
{
  "correctness": "correct" | "partial" | "incorrect",
  "score": number (0-10),
  "clarity": number (0-10),
  "confidence": number (0-10),
  "fluency": number (0-10),
  "feedback": string
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const clarity = Number(result.clarity ?? 0);
    const fluency = Number(result.fluency ?? 0);
    const correctness = ['correct', 'partial', 'incorrect'].includes(result.correctness)
      ? result.correctness : 'incorrect';

    const evaluation: AIEvaluation = {
      clarityScore: clarity,
      confidenceScore: Number(result.confidence ?? metrics.confidenceScore ?? 0),
      fluencyScore: fluency,
      communicationScore: (clarity + fluency) / 2,
      warmthScore: Math.min(10, clarity * 0.9),
      simplicityScore: Math.min(10, clarity * 0.95),
      patienceScore: Math.min(10, fluency * 0.85),
      detailedFeedback: result.feedback || '',
      recommendation: correctness === 'correct' ? 'SELECTED' : 'REJECTED',
      overallScore: Number(result.score ?? 0) * 10,
      correctness
    };

    return { metrics, evaluation };

  } catch (e) {
    console.error('OpenAI Error:', e);
    console.log('⚠️  Falling back to local evaluator.');
    const evaluation = fallbackEvaluate(transcript, metrics);
    return { metrics, evaluation };
  }
};