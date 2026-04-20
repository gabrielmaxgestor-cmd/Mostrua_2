import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  link: string;
  actionText: string;
}

interface OnboardingProgressProps {
  steps: Step[];
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ steps }) => {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => !s.completed);

  if (progress === 100) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Configuração da Loja</h2>
          <p className="text-gray-500 text-sm">Complete os passos abaixo para começar a vender.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-green-600">{progress}%</span>
          <p className="text-gray-500 text-sm">concluído</p>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-green-500 h-2 rounded-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={`p-4 rounded-xl border ${
              step.completed ? 'bg-gray-50 border-gray-100' : 
              nextStep?.id === step.id ? 'bg-green-50 border-green-200 ring-1 ring-green-500' : 
              'bg-white border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className={`w-5 h-5 mt-0.5 shrink-0 ${nextStep?.id === step.id ? 'text-green-500' : 'text-gray-300'}`} />
              )}
              <div>
                <h3 className={`font-semibold text-sm ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className="text-gray-500 text-xs mt-1 mb-3">{step.description}</p>
                
                {!step.completed && nextStep?.id === step.id && (
                  <Link 
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
                  >
                    {step.actionText} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
