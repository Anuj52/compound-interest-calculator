import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import './styles.css';

const periodOptions = [
  { label: 'Daily', days: 1 },
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Yearly', days: 365 }
];

const lineStyles = ['0', '5 5', '10 5', '5 10']; // Solid, dashed, dotted, etc.

const CompoundInterestCalculator = () => {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [days, setDays] = useState(30);
  const [periodDays, setPeriodDays] = useState(1);
  const [contribution, setContribution] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [target, setTarget] = useState('');
  const [data, setData] = useState([]);
  const [finalAmount, setFinalAmount] = useState(0);
  const [chartType, setChartType] = useState('area');
  const [showTable, setShowTable] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentStep, setCurrentStep] = useState(0);
  const [scenarios, setScenarios] = useState([]);
  const [userPrincipal, setUserPrincipal] = useState('');
  const [userRate, setUserRate] = useState('');
  const [userDays, setUserDays] = useState('');
  const [userColor, setUserColor] = useState('#000000'); // Default color for the user scenario
  const chartRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('compoundData');
    if (saved) {
      const p = JSON.parse(saved);
      setPrincipal(p.principal);
      setRate(p.rate);
      setDays(p.days);
      setPeriodDays(p.periodDays || 1);
      setContribution(p.contribution || 0);
      setCurrency(p.currency);
      setTarget(p.target || '');
      setData(p.data || []);
      setFinalAmount(p.finalAmount || 0);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const calculate = () => {
    // Validate inputs
    if (!principal || !rate || !days || !periodDays) {
      alert("Please fill in all required fields.");
      return;
    }

    if (periodDays <= 0) {
      alert("Invalid period selected. Please select a valid period.");
      return;
    }

    const newData = [];
    let amt = Number(principal); // Starting principal amount
    const r = Number(rate) / 100; // Convert rate to decimal
    const steps = Math.floor(Number(days) / periodDays); // Calculate the number of periods
    let targetDay = null; // To store the day when the target is hit

    // Debugging: Log input values
    console.log("Principal:", principal, "Rate:", rate, "Days:", days, "Period Days:", periodDays);

    // Generate data points for the graph
    for (let i = 0; i <= steps; i++) {
      const currentDay = i * periodDays;
      newData.push({ day: currentDay, amount: parseFloat(amt.toFixed(2)) });

      // Check if the target is hit
      if (!targetDay && target && amt >= Number(target)) {
        targetDay = currentDay;
      }

      amt = amt * (1 + r) + Number(contribution); // Compound interest formula
    }

    setData(newData); // Update the graph data
    setFinalAmount(newData[newData.length - 1]?.amount || 0); // Update the final amount
    setCurrentStep(targetDay); // Update the day when the target is hit
  };

  const calculateScenario = (scenario) => {
    const newData = [];
    let amt = scenario.principal;
    const r = scenario.rate / 100;
    const steps = Math.floor(scenario.days / periodDays);
  
    for (let i = 0; i <= steps; i++) {
      const currentDay = i * periodDays;
      newData.push({ day: currentDay, amount: parseFloat(amt.toFixed(2)) });
      amt = amt * (1 + r);
    }
  
    // Update the state with the calculated data and final amount
    setData(newData);
    setFinalAmount(newData[newData.length - 1]?.amount || 0);
  };

  const calculateScenarioData = (scenario) => {
    const newData = [];
    let amt = scenario.principal;
    const r = scenario.rate / 100;
    const steps = Math.floor(scenario.days / periodDays);

    for (let i = 0; i <= steps; i++) {
      const currentDay = i * periodDays;
      newData.push({ day: currentDay, amount: parseFloat(amt.toFixed(2)) });
      amt = amt * (1 + r);
    }

    return newData;
  };

  const downloadCSV = () => {
    let csv = 'Period,Day,Amount\n';
    data.forEach(({ period, day, amount }) => { csv += `${period},${day},${amount}\n`; });
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'compound_interest.csv');
  };

  const exportPDF = () => {
    if (!chartRef.current) return;
    html2canvas(chartRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      pdf.text('Compound Interest Report', 10, 10);
      pdf.addImage(imgData, 'PNG', 10, 20, 280, 100);
      pdf.save('compound_interest.pdf');
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Compound Interest');
    XLSX.writeFile(workbook, 'compound_interest.xlsx');
  };

  const resetAll = () => {
    setPrincipal(1000); // Reset to default value
    setRate(5); // Reset to default value
    setDays(30); // Reset to default value
    setPeriodDays(1); // Reset to default value
    setContribution(0); // Reset to default value
    setData([]); // Clear the graph data
    setFinalAmount(0); // Reset the final amount
  };

  const renderChart = () => {
    return (
      <LineChart>
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#ccc" />

        {/* Line Graph */}
        {data.length > 0 && (
          <Line
            type="monotone"
            dataKey="amount"
            data={data}
            stroke="blue" // Line graph in blue
            strokeWidth={2}
          />
        )}
      </LineChart>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-purple-600 to-blue-500'} shadow-lg`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white text-center sm:text-left">
          Compound Interest Calculator
        </h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="mt-4 sm:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center sm:text-left">Input Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="Principal"
            className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Rate (%)"
            className="p-3 border rounded-lg bg-green-50 dark:bg-green-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Total Days"
            className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900 text-gray-800 dark:text-white"
          />
          <select
            value={periodDays}
            onChange={(e) => {
              const selectedPeriod = Number(e.target.value);
              setPeriodDays(selectedPeriod);
              console.log("Updated Period Days:", selectedPeriod); // Debugging
            }}
            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {periodOptions.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            placeholder="Contribution per period"
            className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900 text-gray-800 dark:text-white col-span-2"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
          </select>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target Amount"
            className="p-3 border rounded-lg bg-red-50 dark:bg-red-900 text-gray-800 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={calculate}
            className="flex-1 py-3 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600"
          >
            Calculate
          </button>
          <button
            onClick={resetAll}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
          >
            Reset
          </button>
        </div>

        {/* Chart Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center sm:text-left">Visualization</h2>
          <div ref={chartRef} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {/* Target Day Display */}
          {currentStep !== null && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                Target of {currency} {target} will be hit on day {currentStep}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      {scenarios.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center sm:text-left">Visualization</h2>
          <div ref={chartRef} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Legend</h3>
            <div className="flex flex-wrap gap-4 mt-2">
              {/* Basic Graph Legend */}
              <div className="flex items-center gap-2">
                <svg width="20" height="10">
                  <line x1="0" y1="5" x2="20" y2="5" stroke="blue" strokeWidth="2" />
                </svg>
                <span className="text-sm text-gray-800 dark:text-gray-300">Basic Calculation</span>
              </div>

              {/* Scenario Graph Legends */}
              {scenarios.map((scenario, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg width="20" height="10">
                    <line
                      x1="0"
                      y1="5"
                      x2="20" y2="5"
                      stroke={scenario.color}
                      strokeWidth="2"
                      strokeDasharray={lineStyles[index % lineStyles.length]} // Match line style
                    />
                  </svg>
                  <span className="text-sm text-gray-800 dark:text-gray-300">
                    Scenario {index + 1}: Principal {scenario.principal}, Rate {scenario.rate}%, Days {scenario.days}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Scenario Form */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Add a New Scenario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <input
            type="number"
            value={userPrincipal}
            onChange={(e) => setUserPrincipal(e.target.value)}
            placeholder="Principal"
            className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={userRate}
            onChange={(e) => setUserRate(e.target.value)}
            placeholder="Rate (%)"
            className="p-3 border rounded-lg bg-green-50 dark:bg-green-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={userDays}
            onChange={(e) => setUserDays(e.target.value)}
            placeholder="Days"
            className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900 text-gray-800 dark:text-white"
          />
          <input
            type="color"
            value={userColor}
            onChange={(e) => setUserColor(e.target.value)}
            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
          />
        </div>
        <button
          onClick={() => {
            if (userPrincipal && userRate && userDays) {
              const newScenario = {
                principal: Number(userPrincipal),
                rate: Number(userRate),
                days: Number(userDays),
                color: userColor || '#FF0000', // Default to red if no color is selected
              };
              setScenarios([...scenarios, newScenario]);
              setUserPrincipal('');
              setUserRate('');
              setUserDays('');
              setUserColor('#000000'); // Reset color picker
            }
          }}
          className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-lg"
        >
          Add Scenario
        </button>
      </div>

      {/* Scenarios Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center sm:text-left">Scenarios</h3>
        {scenarios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
                <h4 className="text-md font-semibold text-gray-800 dark:text-white">Scenario {index + 1}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Principal: {scenario.principal}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Rate: {scenario.rate}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Days: {scenario.days}</p>
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => calculateScenario(scenario)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
                  >
                    Simulate
                  </button>
                  <button
                    onClick={() => {
                      const updatedScenarios = scenarios.filter((_, i) => i !== index);
                      setScenarios(updatedScenarios);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">No scenarios added yet.</p>
        )}
      </div>

      {/* Export Section */}
      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={downloadCSV}
          className="flex-1 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
        >
          Export CSV
        </button>
        <button
          onClick={exportPDF}
          className="flex-1 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600"
        >
          Export PDF
        </button>
        <button
          onClick={exportToExcel}
          className="flex-1 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
        >
          Export Excel
        </button>
      </div>

      {/* Target Day Display */}
      {currentStep !== null && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
            Target of {currency} {target} will be hit on day {currentStep}.
          </p>
        </div>
      )}

      {/* Summary Report Section */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center sm:text-left">Summary Report</h2>
        <div className="text-gray-800 dark:text-gray-300">
          <p className="mb-2">
            <strong>Basic Calculation:</strong> Final Amount: {currency} {finalAmount.toFixed(2)}{' '}
            {currentStep !== null && `| Target Hit on Day: ${currentStep}`}
          </p>

          {scenarios.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-4">Scenarios:</h3>
              {scenarios.map((scenario, index) => {
                const scenarioData = calculateScenarioData(scenario);
                const scenarioFinalAmount = scenarioData[scenarioData.length - 1]?.amount || 0;
                const scenarioTargetDay = scenarioData.find((d) => d.amount >= Number(target))?.day || 'Not Reached';

                return (
                  <p key={index} className="mb-2">
                    <strong>Scenario {index + 1}:</strong> Final Amount: {currency} {scenarioFinalAmount.toFixed(2)}{' '}
                    | Target Hit on Day: {scenarioTargetDay}
                  </p>
                );
              })}
            </div>
          )}

          {scenarios.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Analysis:</h3>
              <p>
                The scenario that reaches the target fastest or generates the highest final amount is the most effective.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestCalculator;