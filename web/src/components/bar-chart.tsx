'use client';

import { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface BarChartProps {
  max: number;
  results: any;
}

export const BarChart = ({ max, results }: BarChartProps) => {
  const { theme } = useTheme();
  const apexChartTheme = theme === 'dark' ? 'dark' : 'light';
  const [hasLogged, setHasLogged] = useState(false);

  useEffect(() => {
    
    if (results && results.length > 0 && !hasLogged) {
     
      const oceanScores = {
        O: results.find((r: any) => r.domain === 'O')?.score || 0,
        C: results.find((r: any) => r.domain === 'C')?.score || 0,
        E: results.find((r: any) => r.domain === 'E')?.score || 0,
        A: results.find((r: any) => r.domain === 'A')?.score || 0,
        N: results.find((r: any) => r.domain === 'N')?.score || 0
      };

      // Normalized scores (divided by 120)
      const normalizedScores = {
        O: oceanScores.O / 10,
        C: oceanScores.C / 10,
        E: oceanScores.E / 10,
        A: oceanScores.A / 10,
        N: oceanScores.N / 10
      };

      console.log('=== OCEAN SCORES (FINAL) ===');
      console.log('Openness (O):', oceanScores.O, '/ 10');
      console.log('Conscientiousness (C):', oceanScores.C, '/ 10');
      console.log('Extraversion (E):', oceanScores.E, '/ 10');
      console.log('Agreeableness (A):', oceanScores.A, '/ 10');
      console.log('Neuroticism (N):', oceanScores.N, '/ 10');
      console.log('OCEAN Object:', oceanScores);
      console.log('Normalized (÷100):', normalizedScores);
      console.log('================================\n');

      // 🔥 SEND TO BACKEND
      sendToBackend(oceanScores, normalizedScores);

      setHasLogged(true);
    }
  }, [results, hasLogged]);

  // Function to send data to FastAPI backend
  const sendToBackend = async (oceanScores: any, normalizedScores: any) => {
    try {
      // Get report ID from URL or localStorage
      const reportId = localStorage.getItem('resultId') || 'unknown';

      const payload = {
        report_id: reportId,
        timestamp: new Date().toISOString(),
        ocean_scores: {
          openness: oceanScores.O,
          conscientiousness: oceanScores.C,
          extraversion: oceanScores.E,
          agreeableness: oceanScores.A,
          neuroticism: oceanScores.N
        },
        ocean_normalized: {
          openness: normalizedScores.O,
          conscientiousness: normalizedScores.C,
          extraversion: normalizedScores.E,
          agreeableness: normalizedScores.A,
          neuroticism: normalizedScores.N
        }
      };

      console.log('📤 Sending to backend:', payload);

      // 🔥 CHANGE THIS URL to your FastAPI backend URL
      const response = await fetch('http://localhost:8000/api/save-ocean-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend response:', data);
      } else {
        console.error('❌ Backend error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to send to backend:', error);
      console.log('ℹ️ Make sure your FastAPI backend is running on http://localhost:8000');
    }
  };

  const options: ApexOptions = {
    theme: {
      mode: apexChartTheme
    },
    legend: {
      show: false
    },
    chart: {
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    yaxis: {
      max
    },
    xaxis: {
      categories: results.map((result: any) => result.title),
      labels: {
        style: {
          fontFamily: 'Inter, sans-serif'
        }
      }
    },
    plotOptions: {
      bar: {
        distributed: true
      }
    },
    fill: {
      colors: ['#9353d3', '#006FEE', '#f31260', '#f5a524', '#17c964', '#E2711D']
    }
  };

  const series = [
    {
      name: 'You',
      data: results.map((result: any) => result.score)
    }
  ];

  return (
    <>
      <ApexChart
        type='bar'
        options={options}
        series={series}
        height={350}
        width='100%'
      />
    </>
  );
};