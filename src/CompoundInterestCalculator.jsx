import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './styles.css';

const periodOptions = [
  { label: 'Daily', days: 1 },
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Yearly', days: 365 }
];

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

  const calculate = () => {
    const newData = [];
    let amt = Number(principal);
    const r = Number(rate) / 100;
    const steps = Math.floor(Number(days) / periodDays);
    for (let i = 0; i <= steps; i++) {
      const currentDay = i * periodDays;
      newData.push({ period: i, day: currentDay, amount: parseFloat(amt.toFixed(2)) });
      amt = amt * (1 + r) + Number(contribution);
    }
    setData(newData);
    setFinalAmount(newData[newData.length - 1].amount);
    localStorage.setItem('compoundData', JSON.stringify({ principal, rate, days, periodDays, contribution, currency, target, data: newData, finalAmount: newData[newData.length - 1].amount }));
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

  const resetAll = () => {
    localStorage.removeItem('compoundData');
    setData([]);
    setFinalAmount(0);
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Bar dataKey="amount" fill="#82ca9d" />
          </BarChart>
        );
      case 'area':
      default:
        return (
          <AreaChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-2 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Compound Interest Calculator</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="number"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            placeholder="Principal"
            className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-900"
          />
          <input
            type="number"
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="Rate (%)"
            className="p-3 border rounded-lg bg-green-50 dark:bg-green-900"
          />
          <input
            type="number"
            value={days}
            onChange={e => setDays(e.target.value)}
            placeholder="Total Days"
            className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900"
          />
          <select
            value={periodDays}
            onChange={e => setPeriodDays(Number(e.target.value))}
            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            {periodOptions.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <input
            type="number"
            value={contribution}
            onChange={e => setContribution(e.target.value)}
            placeholder="Contribution per period"
            className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900 col-span-2"
          />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
          </select>
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Target Amount"
            className="p-3 border rounded-lg bg-red-50 dark:bg-red-900"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {['area','line','bar'].map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-4 py-2 rounded ${chartType===t ? 'bg-indigo-700 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={calculate} className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-lg">Calculate</button>
        <button onClick={resetAll} className="mt-2 w-full py-3 bg-red-500 text-white rounded-lg">Reset</button>
        {finalAmount > 0 && (
          <div className="mt-4 text-xl text-center text-gray-800 dark:text-white">
            Final Amount: {currency} {finalAmount.toLocaleString()}
          </div>
        )}
        <div className="flex justify-around mt-4 text-gray-800 dark:text-white">
          {/* Stats */}
          {data.length > 0 && (
            <>  
              <div><strong>Max:</strong> {currency} {Math.max(...data.map(d => d.amount))}</div>
              <div><strong>Min:</strong> {currency} {Math.min(...data.map(d => d.amount))}</div>
              <div><strong>Avg:</strong> {currency} {(data.reduce((sum, d) => sum + d.amount, 0) / data.length).toFixed(2)}</div>
              {target && data.find(d => d.amount >= Number(target)) && <div className="text-red-600">Target reached</div>}
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={downloadCSV} className="flex-1 py-2 bg-green-500 text-white rounded-lg">Export CSV</button>
          <button onClick={exportPDF} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg">Export PDF</button>
        </div>
        <button onClick={() => setShowTable(!showTable)} className="mt-2 text-sm text-indigo-600">
          {showTable ? 'Hide' : 'Show'} Table
        </button>
        {showTable && (
          <div className="mt-4 overflow-auto max-h-40 bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <table className="w-full text-sm text-gray-700 dark:text-gray-200">
              <thead>
                <tr><th>Period</th><th>Day</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {data.map(({period, day, amount}) => (
                  <tr key={period}>
                    <td>{period}</td>
                    <td>{day}</td>
                    <td>{currency} {amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.length > 0 && (
          <div ref={chartRef} className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
        <button onClick={() => setShowInfo(!showInfo)} className="mt-4 text-indigo-600 underline">
          What Is Compound Interest?
        </button>
        {showInfo && (
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm overflow-auto max-h-60">
            <p>
              Compound interest is interest that applies not only to the initial principal but also to the accumulated interest from previous periods. It allows your investments to grow faster over time compared to simple interest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundInterestCalculator;