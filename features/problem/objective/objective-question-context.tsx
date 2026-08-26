'use client';

import { createContext, useContext } from 'react';

type QuestionContextValue = {
  id: string;
  type: 'select' | 'multiselect';
};

const QuestionContext = createContext<QuestionContextValue | null>(null);

export function useQuestionContext() {
  return useContext(QuestionContext);
}

export default QuestionContext;
