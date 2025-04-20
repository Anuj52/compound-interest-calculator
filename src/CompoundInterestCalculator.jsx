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
import { FaSun, FaMoon } from 'react-icons/fa';

const periodOptions = [
  { label: 'Daily', days: 1 },
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Yearly', days: 365 }
];

const lineStyles = ['0', '5 5', '10 5', '5 10']; // Solid, dashed, dotted, etc.

const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€'
};

const CustomTooltip = ({ active, payload, principal, periodDays, contribution, currency }) => {
  if (active && payload && payload.length) {
    const { day, amount } = payload[0].payload;
    const interest = amount - (Number(principal) + (day / periodDays) * Number(contribution));
    return (
      <div className="bg-white p-2 rounded shadow text-xs">
        <div><strong>Day:</strong> {day}</div>
        <div><strong>Amount:</strong> {currency} {amount.toFixed(2)}</div>
        <div><strong>Interest:</strong> {currency} {interest.toFixed(2)}</div>
      </div>
    );
  }
  return null;
};

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
  const [interestEarned, setInterestEarned] = useState(0);
  const [inputError, setInputError] = useState('');
  const chartRef = useRef(null);
  const [doubleDay, setDoubleDay] = useState(null);
  const [showGoal, setShowGoal] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [requiredRate, setRequiredRate] = useState('');
  const [requiredPrincipal, setRequiredPrincipal] = useState('');
  const [inflation, setInflation] = useState(0);
  const [realFinalAmount, setRealFinalAmount] = useState(0);

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

  
  useEffect(() => {
    calculate();
    // eslint-disable-next-line
  }, [principal, rate, days, periodDays, contribution, target]);

  const calculate = () => {
    // Validate inputs
    if (!principal || !rate || !days || !periodDays) {
      setInputError("Please fill in all required fields.");
      return;
    }

    if (periodDays <= 0) {
      setInputError("Invalid period selected. Please select a valid period.");
      return;
    }

    setInputError(''); // Clear any previous errors

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

    if (targetDay !== null && !showGoal) {
      setShowGoal(true);
      setTimeout(() => setShowGoal(false), 3000); // Hide after 3 seconds
    }

    const totalContributions = Number(principal) + steps * Number(contribution);
    const interestEarned = (newData[newData.length - 1]?.amount || 0) - totalContributions;
    setInterestEarned(interestEarned);
  };

  useEffect(() => {
    if (principal > 0 && rate > 0) {
      // Rule of 72: 72 / rate = years to double
      const yearsToDouble = 72 / Number(rate);
      const daysToDouble = Math.round(yearsToDouble * 365);
      setDoubleDay(daysToDouble);
    } else {
      setDoubleDay(null);
    }
  }, [principal, rate]);

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

  const downloadChartImage = () => {
    if (!chartRef.current) return;
    html2canvas(chartRef.current).then(canvas => {
      const link = document.createElement('a');
      link.download = 'compound_interest_chart.png';
      link.href = canvas.toDataURL();
      link.click();
    });
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
        <Tooltip
          content={
            <CustomTooltip
              principal={principal}
              periodDays={periodDays}
              contribution={contribution}
              currency={currency}
            />
          }
        />
        <CartesianGrid stroke="#ccc" />

        {/* Line Graph */}
        {data.length > 0 && (
          <Line
            type="monotone"
            dataKey="amount"
            data={data}
            stroke="blue"
            strokeWidth={2}
            isAnimationActive={true}
          />
        )}
      </LineChart>
    );
  };

  const handleReverseCalculation = () => {
    // Calculate required rate if principal is given
    if (principal && target && days && periodDays) {
      const n = Math.floor(Number(days) / periodDays);
      const reqRate = Math.pow(Number(target) / Number(principal), 1 / n) - 1;
      setRequiredRate((reqRate * 100).toFixed(2));
      setRequiredPrincipal('');
    }
    // Calculate required principal if rate is given
    else if (rate && target && days && periodDays) {
      const n = Math.floor(Number(days) / periodDays);
      const reqPrincipal = Number(target) / Math.pow(1 + Number(rate) / 100, n);
      setRequiredPrincipal(reqPrincipal.toFixed(2));
      setRequiredRate('');
    }
  };

  useEffect(() => {
    if (finalAmount && inflation && days) {
      const years = Number(days) / 365;
      const realAmount = finalAmount / Math.pow(1 + inflation / 100, years);
      setRealFinalAmount(realAmount);
    } else {
      setRealFinalAmount(finalAmount);
    }
  }, [finalAmount, inflation, days]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-purple-600 to-blue-500'} shadow-lg`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white text-center sm:text-left">
          Compound Interest Calculator
        </h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="mt-4 sm:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center sm:text-left">Input Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Only show these if not in reverse mode */}
          {!reverseMode && (
            <>
              <div className="relative">
                <input
                  type="number"
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  placeholder="Principal"
                  className="p-3 border rounded-lg w-full"
                />
                <button
                  onClick={() => setPrincipal(1000)}
                  className="absolute right-2 top-2 text-xs bg-gray-200 px-2 py-1 rounded"
                  title="Reset"
                >⟲</button>
              </div>
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
            </>
          )}
          {/* Show these if in reverse mode */}
          {reverseMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="number"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="Target Amount"
                className="p-3 border rounded-lg bg-red-50 dark:bg-red-900 text-gray-800 dark:text-white"
              />
              <input
                type="number"
                value={days}
                onChange={e => setDays(e.target.value)}
                placeholder="Total Days"
                className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900 text-gray-800 dark:text-white"
              />
              <input
                type="number"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                placeholder="Principal (leave blank to calculate)"
                className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-900 text-gray-800 dark:text-white"
              />
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="Rate (%) (leave blank to calculate)"
                className="p-3 border rounded-lg bg-green-50 dark:bg-green-900 text-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>
        {inputError && (
          <div className="text-red-500 text-sm mt-2">{inputError}</div>
        )}
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

        {/* Principal Slider */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-700 dark:text-gray-200">Principal: {currency} {principal}</label>
          <input
            type="range"
            min="100"
            max="100000"
            step="100"
            value={principal}
            onChange={e => setPrincipal(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Rate Slider */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-700 dark:text-gray-200">Rate: {rate}%</label>
          <input
            type="range"
            min="1"
            max="30"
            step="0.1"
            value={rate}
            onChange={e => setRate(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Days Slider */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-700 dark:text-gray-200">Days: {days}</label>
          <input
            type="range"
            min="1"
            max="3650"
            step="1"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={reverseMode}
            onChange={() => setReverseMode(!reverseMode)}
            id="reverseMode"
          />
          <label htmlFor="reverseMode" className="text-gray-700 dark:text-gray-200 text-sm">
            Reverse Calculation Mode (Find required rate or principal)
          </label>
        </div>

        {reverseMode && (
          <>
            <button
              onClick={handleReverseCalculation}
              className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-lg"
            >
              Calculate Required Value
            </button>
            {requiredRate && (
              <div className="mt-2 text-green-700 dark:text-green-400">
                Required Rate: <strong>{requiredRate}%</strong>
              </div>
            )}
            {requiredPrincipal && (
              <div className="mt-2 text-green-700 dark:text-green-400">
                Required Principal: <strong>{currency} {requiredPrincipal}</strong>
              </div>
            )}
          </>
        )}

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

      {/* About Section */}
      <div className="mb-8 mt-4 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">About Compound Interest Calculator</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Compounding interest, as opposed to simple interest, is the situation where your wealth increases exponentially because you earn interest on your total investments, including both your principal and the interest it accrues. This makes compound interest a powerful tool for growing your savings and investments over time.
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-2">
          <li>Determine accurate returns over any time frame.</li>
          <li>Plan your investments by identifying the required corpus for your goals.</li>
          <li>Customize calculations for different compounding periods (daily, weekly, monthly, yearly).</li>
          <li>See total and yearly returns, helping you plan for withdrawals or future needs.</li>
          <li>Stay updated with market-aligned rates and government regulations.</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          <strong>How does it work?</strong> Enter your principal, interest rate, compounding period, and investment duration. The calculator uses the standard formula:
        </p>
        <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 mb-2 text-sm text-gray-800 dark:text-gray-200">
          <strong>A = P (1 + r/n)<sup>nt</sup></strong>
          <br />
          Where:<br />
          <span className="ml-2">A = Final amount</span><br />
          <span className="ml-2">P = Principal amount</span><br />
          <span className="ml-2">r = Annual interest rate</span><br />
          <span className="ml-2">n = Number of times interest is compounded per year</span><br />
          <span className="ml-2">t = Number of years</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          This calculator is designed for ease of use, reliability, and accuracy. Adjust your parameters and instantly see how your investment grows—making financial planning simple and transparent!
        </p>
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

      {scenarios.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white dark:bg-gray-900 rounded shadow text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">Scenario</th>
                <th className="px-2 py-1">Principal</th>
                <th className="px-2 py-1">Rate (%)</th>
                <th className="px-2 py-1">Days</th>
                <th className="px-2 py-1">Final Amount</th>
                <th className="px-2 py-1">Target Day</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, idx) => {
                const scenarioData = calculateScenarioData(scenario);
                const scenarioFinalAmount = scenarioData[scenarioData.length - 1]?.amount || 0;
                const scenarioTargetDay = scenarioData.find((d) => d.amount >= Number(target))?.day || 'Not Reached';
                return (
                  <tr key={idx}>
                    <td className="px-2 py-1">{idx + 1}</td>
                    <td className="px-2 py-1">{currencySymbols[currency]} {scenario.principal}</td>
                    <td className="px-2 py-1">{scenario.rate}</td>
                    <td className="px-2 py-1">{scenario.days}</td>
                    <td className="px-2 py-1">{currencySymbols[currency]} {scenarioFinalAmount.toFixed(2)}</td>
                    <td className="px-2 py-1">{scenarioTargetDay}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
        <button
          onClick={downloadChartImage}
          className="flex-1 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600"
        >
          Download Chart Image
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

      {/* Progress Bar */}
      {finalAmount > 0 && target && (
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div
            className="bg-indigo-500 h-4 rounded-full progress-animated"
            style={{
              width: `${Math.min((finalAmount / Number(target)) * 100, 100)}%`
            }}
          ></div>
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
          <p className="mb-2">
            <strong>Total Interest Earned:</strong> {currency} {interestEarned.toFixed(2)}
          </p>
          {doubleDay && (
            <p className="mb-2">
              <strong>Estimated Days to Double Investment:</strong> {doubleDay} days
            </p>
          )}
          <p className="mb-2">
            <strong>Inflation-Adjusted Final Amount:</strong> {currency} {realFinalAmount.toFixed(2)}
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

      {/* Add a toggle button: */}
      <button
        onClick={() => setShowTable(!showTable)}
        className="mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
      >
        {showTable ? 'Hide Table' : 'Show Table'}
      </button>

      {/* Below your chart, show the table if showTable is true: */}
      {showTable && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white dark:bg-gray-900 rounded shadow text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">Period</th>
                <th className="px-2 py-1">Day</th>
                <th className="px-2 py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1">{idx + 1}</td>
                  <td className="px-2 py-1">{row.day}</td>
                  <td className="px-2 py-1">{currency} {row.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
        >
          {showInfo ? 'Hide Growth Breakdown' : 'Show Growth Breakdown'}
        </button>
        {showInfo && (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow text-sm">
            <div><strong>Total Principal:</strong> {currency} {Number(principal).toFixed(2)}</div>
            <div><strong>Total Contributions:</strong> {currency} {(Math.floor(Number(days) / periodDays) * Number(contribution)).toFixed(2)}</div>
            <div><strong>Total Interest Earned:</strong> {currency} {interestEarned.toFixed(2)}</div>
            <div><strong>Final Amount:</strong> {currency} {finalAmount.toFixed(2)}</div>
          </div>
        )}
      </div>
      {showGoal && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition">
          🎉 Congratulations! Your investment target will be reached on day {currentStep}.
        </div>
      )}
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-gray-700 dark:text-gray-200">Inflation Rate (%)</label>
        <input
          type="number"
          value={inflation}
          onChange={e => setInflation(Number(e.target.value))}
          placeholder="e.g. 6"
          className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900 text-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
};

export default CompoundInterestCalculator;