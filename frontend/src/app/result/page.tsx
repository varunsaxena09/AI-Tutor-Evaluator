"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("interviewResult");
    if (data) {
      setResult(JSON.parse(data));
    }
  }, []);

  const handleDashboard = () => {
    router.push("/dashboard/candidate");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("interviewResult");
    router.push("/login");
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading result...
      </div>
    );
  }

  const isSelected = result.result === "SELECTED";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">

      {/* RESULT HEADER */}
      <h1 className={`text-4xl font-bold mb-6 ${isSelected ? "text-green-500" : "text-red-500"}`}>
        {isSelected ? "SELECTED ✅" : "NOT SELECTED ❌"}
      </h1>

      {/* MAIN STATS */}
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-xl space-y-4 shadow-lg">

        <div className="flex justify-between">
          <span>Correct Answers</span>
          <span className="font-semibold">
            {result.correctAnswers} / {result.totalQuestions}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Accuracy</span>
          <span className="font-semibold">
            {result.accuracy.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Communication</span>
          <span className="font-semibold">
            {result.communicationScore.toFixed(1)} / 10
          </span>
        </div>

        <div className="flex justify-between">
          <span>Confidence</span>
          <span className="font-semibold">
            {result.confidenceScore.toFixed(1)} / 10
          </span>
        </div>

        <div className="flex justify-between">
          <span>Filler Words</span>
          <span className="font-semibold">
            {result.totalFillerWords}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Pauses</span>
          <span className="font-semibold">
            {result.totalPauses}
          </span>
        </div>
      </div>

      {/* REASONS */}
      {result.reasons && result.reasons.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 w-full max-w-xl shadow-lg">
          <h2 className="font-semibold mb-3 text-lg">Why you were not selected:</h2>
          <ul className="space-y-2 text-sm">
            {result.reasons.map((reason: string, i: number) => (
              <li key={i} className="text-red-400">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleDashboard}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-secondary text-secondary-foreground border border-border rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Logout
        </button>
      </div>

    </div>
  );
}
