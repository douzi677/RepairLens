import { useState } from 'react';

export function FeedbackButtons() {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    setSubmitted(true);
    // MVP: log to console; later: POST to analytics endpoint
    console.log('Feedback:', { helpful, timestamp: new Date().toISOString() });
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <span className="text-sm text-slate-400">感谢反馈 🙏</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-center py-4">
      <span className="text-sm text-slate-500 self-center mr-1">这份报告对你有帮助吗？</span>
      <button
        onClick={() => handleFeedback(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-white border border-slate-200
                   hover:bg-green-50 hover:border-green-300 active:bg-green-100 transition-colors min-h-[44px]"
      >
        👍 有帮助
      </button>
      <button
        onClick={() => handleFeedback(false)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-white border border-slate-200
                   hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition-colors min-h-[44px]"
      >
        👎 没帮助
      </button>
    </div>
  );
}
