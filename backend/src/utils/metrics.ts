export const calculateCommunicationMetrics = (transcript: string) => {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'ah', 'basically', 'actually', 'right', 'so'];
  
  const words = transcript.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
  const totalWords = words.length || 1;
  
  let fillerCount = 0;
  for (const word of words) {
    if (fillerWords.includes(word)) {
      fillerCount++;
    }
  }

  // Handle phrases like 'you know'
  const youKnowMatches = transcript.toLowerCase().match(/you know/g);
  if (youKnowMatches) {
    fillerCount += youKnowMatches.length;
  }

  const fillerDensity = Number((fillerCount / totalWords).toFixed(2));

  // Determine pauses heuristically by looking at transcript punctuation like ellipses '...' or long hyphens '--' or just assuming based on length if audio timings are missing.
  const pauseMatches = transcript.match(/\.\.\.|--/g);
  const pauseCount = pauseMatches ? pauseMatches.length : 0;
  const avgPauseDuration = pauseCount > 0 ? 1.5 : 0; // heuristic

  const uniqueWords = new Set(words);
  const vocabularyRichness = Number((uniqueWords.size / totalWords).toFixed(2));

  const baseSeconds = totalWords / 2.5;
  const totalSeconds = baseSeconds + pauseCount * 1.5;
  const speakingPace = Number(((totalWords / totalSeconds) * 60).toFixed(0));

  let baseConfidence = 10;
  baseConfidence -= fillerDensity * 20;
  baseConfidence -= pauseCount * 0.5;
  if (baseConfidence < 0) baseConfidence = 0;

  return {
    fillerCount,
    fillerDensity,
    pauseCount,
    avgPauseDuration,
    speakingPace,
    vocabularyRichness,
    confidenceScore: Number(baseConfidence.toFixed(1))
  };
};
