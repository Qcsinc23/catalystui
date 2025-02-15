import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PerformanceCharts({ timeframe }) {
  // Placeholder data - In real app, this would come from API
  const qualityScoreData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Quality Score',
        data: [95, 96, 94, 98, 97, 98.5],
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const eventCompletionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Completed Events',
        data: [25, 30, 28, 32, 35, 40],
        backgroundColor: 'rgb(34, 197, 94)',
      },
      {
        label: 'Total Events',
        data: [28, 32, 30, 35, 38, 42],
        backgroundColor: 'rgb(99, 102, 241)',
      },
    ],
  };

  const qualityScoreOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Quality Score Trend',
      },
    },
    scales: {
      y: {
        min: 90,
        max: 100,
        ticks: {
          callback: (value) => value + '%',
        },
      },
    },
  };

  const eventCompletionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Event Completion Rate',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="bg-white shadow rounded-lg p-6">
        <Line data={qualityScoreData} options={qualityScoreOptions} />
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <Bar data={eventCompletionData} options={eventCompletionOptions} />
      </div>
    </div>
  );
}