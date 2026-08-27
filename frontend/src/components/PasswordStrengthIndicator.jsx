import { Check, X } from 'lucide-react';

import { COMMON_WEAK_PASSWORDS } from '../utils/constants';

export const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;

  const rules = [
    { label: 'At least 8 characters long', test: (pw) => pw.length >= 8 },
    { label: 'Contains uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'Contains lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
    { label: 'Contains a number (0-9)', test: (pw) => /\d/.test(pw) },
    { label: 'Contains special character (!@#$%^&*)', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
    { label: 'Is not a common/weak password', test: (pw) => !COMMON_WEAK_PASSWORDS.includes(pw.toLowerCase()) },
  ];

  const passedCount = rules.filter(r => r.test(password)).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-red-500';
  let strengthTextColor = 'text-red-500';
  let bars = 1;

  if (passedCount === 6) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-green-500';
    strengthTextColor = 'text-green-500';
    bars = 3;
  } else if (passedCount >= 4) {
    strengthLabel = 'Medium';
    strengthColor = 'bg-yellow-500';
    strengthTextColor = 'text-yellow-500';
    bars = 2;
  }

  return (
    <div className="mt-2 space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password Strength:</span>
        <span className={`text-xs font-bold ${strengthTextColor}`}>{strengthLabel}</span>
      </div>

      {/* Visual Strength Bars */}
      <div className="grid grid-cols-3 gap-1.5 h-1.5">
        <div className={`h-full rounded-full transition-all duration-300 ${bars >= 1 ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${bars >= 2 ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${bars >= 3 ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
      </div>

      {/* Checklist */}
      <ul className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        {rules.map((rule, idx) => {
          const passed = rule.test(password);
          return (
            <li key={idx} className="flex items-center gap-2 text-xs">
              {passed ? (
                <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
              <span className={passed ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
