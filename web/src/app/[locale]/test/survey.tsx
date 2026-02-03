'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@nextui-org/button';
import { RadioGroup, Radio } from '@nextui-org/radio';
import { Progress } from '@nextui-org/progress';
import confetti from 'canvas-confetti';
import { useRouter } from '@/navigation';

import { CloseIcon, InfoIcon } from '@/components/icons';
import { type Question } from '@bigfive-org/questions';
import { sleep, formatTimer, isDev } from '@/lib/helpers';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useTimer from '@/hooks/useTimer';
import { type Answer } from '@/types';
import { Card, CardHeader } from '@nextui-org/card';

interface SurveyProps {
  questions: Question[];
  nextText: string;
  prevText: string;
  resultsText: string;
  saveTest: Function;
  language: string;
  maxQuestions?: number; // New prop to limit questions
}

export const Survey = ({
  questions,
  nextText,
  prevText,
  resultsText,
  saveTest,
  language,
  maxQuestions = 10 // Default to 20 questions, can be changed to 10 or any number
}: SurveyProps) => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsPerPage, setQuestionsPerPage] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const { width } = useWindowDimensions();
  const seconds = useTimer();

  // Limit the questions to the specified number
  const limitedQuestions = useMemo(
    () => questions.slice(0, maxQuestions),
    [questions, maxQuestions]
  );

  useEffect(() => {
    const handleResize = () => {
      setQuestionsPerPage(window.innerWidth > 768 ? 10 : 1);
    };
    handleResize();
  }, [width]);

  useEffect(() => {
    const restoreData = () => {
      if (dataInLocalStorage()) {
        console.log('Restoring data from local storage');
        restoreDataFromLocalStorage();
      }
    };
    restoreData();
  }, []);

  const currentQuestions = useMemo(
    () =>
      limitedQuestions.slice(
        currentQuestionIndex,
        currentQuestionIndex + questionsPerPage
      ),
    [currentQuestionIndex, limitedQuestions, questionsPerPage]
  );

  const isTestDone = limitedQuestions.length === answers.length;

  const progress = Math.round((answers.length / limitedQuestions.length) * 100);

  const nextButtonDisabled =
    inProgress ||
    currentQuestionIndex + questionsPerPage > answers.length ||
    (isTestDone &&
      currentQuestionIndex === limitedQuestions.length - questionsPerPage) ||
    loading;

  const backButtonDisabled = currentQuestionIndex === 0 || loading;

  async function handleAnswer(id: string, value: string) {
    const question = limitedQuestions.find((question) => question.id === id);
    if (!question) return;

    const newAnswer: Answer = {
      id,
      score: Number(value),
      domain: question.domain,
      facet: question.facet
    };

    setAnswers((prevAnswers) => [
      ...prevAnswers.filter((a) => a.id !== id),
      newAnswer
    ]);

    const latestAnswerId = answers.slice(-1)[0]?.id;

    if (
      questionsPerPage === 1 &&
      limitedQuestions.length !== answers.length + 1 &&
      id !== latestAnswerId
    ) {
      setInProgress(true);
      await sleep(700);
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
      setInProgress(false);
    }
    populateDataInLocalStorage();
  }

  function handlePreviousQuestions() {
    setCurrentQuestionIndex((prev) => prev - questionsPerPage);
    window.scrollTo(0, 0);
  }

  function handleNextQuestions() {
    if (inProgress) return;
    setCurrentQuestionIndex((prev) => prev + questionsPerPage);
    window.scrollTo(0, 0);
    if (restored) setRestored(false);
  }

  function skipToEnd() {
    const randomAnswers = limitedQuestions
      .map((question) => ({
        id: question.id,
        score: Math.floor(Math.random() * 5) + 1,
        domain: question.domain,
        facet: question.facet
      }))
      .slice(0, limitedQuestions.length - 1);

    setAnswers([...randomAnswers]);
    setCurrentQuestionIndex(limitedQuestions.length - 1);
  }

  async function submitTest() {
    setLoading(true);
    confetti({});
    const result = await saveTest({
      testId: 'b5-120',
      lang: language,
      invalid: false,
      timeElapsed: seconds,
      dateStamp: new Date(),
      answers
    });
    localStorage.removeItem('inProgress');
    localStorage.removeItem('b5data');
    console.log(result);
    localStorage.setItem('resultId', result.id);
    console.log("resultssss:", result)
    router.push(`/result/${result.id}`);
  }

  function dataInLocalStorage() {
    return !!localStorage.getItem('inProgress');
  }

  function populateDataInLocalStorage() {
    localStorage.setItem('inProgress', 'true');
    localStorage.setItem(
      'b5data',
      JSON.stringify({ answers, currentQuestionIndex, maxQuestions })
    );
  }

  function restoreDataFromLocalStorage() {
    const data = localStorage.getItem('b5data');
    if (data) {
      const { answers, currentQuestionIndex } = JSON.parse(data);
      setAnswers(answers);
      setCurrentQuestionIndex(currentQuestionIndex);
      setRestored(true);
    }
  }

  function clearDataInLocalStorage() {
    console.log('Clearing data from local storage');
    localStorage.removeItem('inProgress');
    localStorage.removeItem('b5data');
    location.reload();
  }

  return (
    <div className='mt-2'>
      <Progress
        aria-label='Progress bar'
        value={progress}
        className='max-w'
        showValueLabel={true}
        label={formatTimer(seconds)}
        minValue={0}
        maxValue={100}
        size='lg'
        color='secondary'
      />
      {restored && (
        <Card className='mt-4 bg-warning/20 text-warning-600 dark:text-warning'>
          <CardHeader className='justify-between'>
            <Button isIconOnly variant='light' color='warning'>
              <InfoIcon />
            </Button>
            <p>
              Your answers has been restored. Click here to&nbsp;
              <a
                className='underline cursor-pointer'
                onClick={clearDataInLocalStorage}
                aria-label='Clear data'
              >
                start a new test
              </a>
              .
            </p>
            <Button
              isIconOnly
              variant='light'
              color='warning'
              onClick={() => setRestored(false)}
            >
              <CloseIcon />
            </Button>
          </CardHeader>
        </Card>
      )}
      {currentQuestions.map((question) => (
        <div key={'q' + question.num}>
          <h2 className='text-2xl my-4'>{question.text}</h2>
          <div>
            <RadioGroup
              onValueChange={(value) => handleAnswer(question.id, value)}
              value={answers
                .find((answer) => answer.id === question.id)
                ?.score.toString()}
              color='secondary'
              isDisabled={inProgress}
            >
              {question.choices.map((choice, index) => (
                <Radio
                  key={index + question.id}
                  value={choice.score.toString()}
                >
                  {choice.text}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        </div>
      ))}
      <div className='my-12 space-x-4 inline-flex'>
        <Button
          color='primary'
          isDisabled={backButtonDisabled}
          onClick={handlePreviousQuestions}
        >
          {prevText.toUpperCase()}
        </Button>

        <Button
          color='primary'
          isDisabled={nextButtonDisabled}
          onClick={handleNextQuestions}
        >
          {nextText.toUpperCase()}
        </Button>

        {isTestDone && (
          <Button
            color='secondary'
            onClick={submitTest}
            disabled={loading}
            isLoading={loading}
          >
            {resultsText.toUpperCase()}
          </Button>
        )}

        {isDev && !isTestDone && (
          <Button color='primary' onClick={skipToEnd}>
            Skip to end (dev)
          </Button>
        )}
      </div>
    </div>
  );
};