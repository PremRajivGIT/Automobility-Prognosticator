import { useState } from 'react';
import { Upload, Clock, Download, AlertCircle } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [timeInterval, setTimeInterval] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !timeInterval) {
      setError('Please provide both a CSV file and time interval');
      return;
    }

    setLoading(true);
    setResponse(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timeInterval', timeInterval.toString());

    try {
      const res = await fetch('https://1f49-49-37-149-146.ngrok-free.app/predict', {  // 'http://localhost:5000/predict'  // http://127.0.0.1:5000/predict
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (res.status === 200) {
        // Reorder the data to put timestamp first
        const reorderedData = data.map(row => {
          // const { timestamp, ...rest } = row;
          // return { timestamp, ...rest };
          return row;
        });
        setResponse({ data: reorderedData, status: 200 });
      } else {
        setResponse({ message: data.message, status: res.status });
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!response?.data) return;
    
    const headers = Object.keys(response.data[0]);
    const csvContent = [
      headers.join(','),
      ...response.data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Traffic Prediction
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700 transition-all duration-300 hover:shadow-2xl hover:border-gray-600">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CSV File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {file ? file.name : 'Choose file'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time Interval</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={timeInterval}
                      onChange={(e) => setTimeInterval(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter time interval"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Predict'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {response && (
            response.status === 200 ? (
              <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Predictions</h2>
                  <button
                    onClick={downloadCSV}
                    className="flex items-center px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-700 border-b border-gray-600">
                        {Object.keys(response.data[0]).map((header) => (
                          <th key={header} className="px-6 py-3 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider border-x border-gray-600">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {response.data.map((row, i) => (
                        <tr key={i} className="transition-colors duration-150 hover:bg-gray-700">
                          {Object.values(row).map((value, j) => (
                            <td key={j} className="px-6 py-4 text-sm border-x border-gray-600">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700">
                <div className="flex items-center justify-center flex-col">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                    Response Status: {response.status}
                  </h3>
                  <p className="text-yellow-200 text-center">
                    {response.message || 'An unexpected error occurred'}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

// import { useState } from 'react';
// import { Upload, Clock, Download, AlertCircle } from 'lucide-react';

// function App() {
//   const [file, setFile] = useState(null);
//   const [timeInterval, setTimeInterval] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [response, setResponse] = useState(null);
//   const [error, setError] = useState('');

//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setFile(e.target.files[0]);
//       setError('');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file || !timeInterval) {
//       setError('Please provide both a CSV file and time interval');
//       return;
//     }

//     setLoading(true);
//     setResponse(null);
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('timeInterval', timeInterval.toString());

//     try {
//       const res = await fetch('http://localhost:5000/predict', {
//         method: 'POST',
//         body: formData,
//       });
      
//       const data = await res.json();
//       if (res.status === 200) {
//         setResponse({ data: data, status: 200 });
//       } else {
//         setResponse({ message: data.message, status: res.status });
//       }
//     } catch (err) {
//       setError('Failed to connect to the server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadCSV = () => {
//     if (!response?.data) return;
    
//     const headers = Object.keys(response.data[0]);
//     const csvContent = [
//       headers.join(','),
//       ...response.data.map(row => headers.map(header => row[header]).join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'predictions.csv';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
//       <div className="container mx-auto px-4 py-8">
//         <div className="max-w-2xl mx-auto">
//           <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
//             CSV Prediction Tool
//           </h1>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="bg-gray-800 p-6 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700 transition-all duration-300 hover:shadow-2xl hover:border-gray-600">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">CSV File</label>
//                   <div className="relative">
//                     <input
//                       type="file"
//                       accept=".csv"
//                       onChange={handleFileChange}
//                       className="hidden"
//                       id="file-upload"
//                     />
//                     <label
//                       htmlFor="file-upload"
//                       className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
//                     >
//                       <Upload className="w-5 h-5 mr-2" />
//                       {file ? file.name : 'Choose file'}
//                     </label>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">Time Interval</label>
//                   <div className="relative">
//                     <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       value={timeInterval}
//                       onChange={(e) => setTimeInterval(e.target.value)}
//                       className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                       placeholder="Enter time interval"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? 'Processing...' : 'Predict'}
//               </button>
//             </div>
//           </form>

//           {error && (
//             <div className="mt-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-center">
//               <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
//               <p className="text-red-200">{error}</p>
//             </div>
//           )}

//           {response && (
//             response.status === 200 ? (
//               <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold">Predictions</h2>
//                   <button
//                     onClick={downloadCSV}
//                     className="flex items-center px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
//                   >
//                     <Download className="w-4 h-4 mr-2" />
//                     Download CSV
//                   </button>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr>
//                         {Object.keys(response.data[0]).map((header) => (
//                           <th key={header} className="px-4 py-2 text-left border-b border-gray-700">
//                             {header}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {response.data.map((row, i) => (
//                         <tr key={i} className="hover:bg-gray-700 transition-colors duration-150">
//                           {Object.values(row).map((value, j) => (
//                             <td key={j} className="px-4 py-2 border-b border-gray-700">
//                               {value}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             ) : (
//               <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-50 border border-gray-700">
//                 <div className="flex items-center justify-center flex-col">
//                   <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
//                   <h3 className="text-xl font-semibold text-yellow-400 mb-2">
//                     Response Status: {response.status}
//                   </h3>
//                   <p className="text-yellow-200 text-center">
//                     {response.message || 'An unexpected error occurred'}
//                   </p>
//                 </div>
//               </div>
//             )
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;