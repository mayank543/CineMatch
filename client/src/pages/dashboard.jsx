import React from "react";

const Dashboard = () => {
  return (
    // 🟥 Main wrapper with relative positioning and gray background
    <div className="relative min-h-screen bg-gray-100 flex items-center justify-center p-6 overflow-hidden">
      {/* 🔺 Slanted red background with fade effect */}
      <div
        className="absolute top-0 left-0 w-full h-1/2 z-0"
        style={{
          clipPath: "polygon(0 98%, 100% 50%, 100% 0, 0 0)",
          background: "#b01e28",
        }}
      ></div>
      
      {/* 🟦 Foreground dashboard container */}
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-lg overflow-hidden z-10">
        
        
        {/* Container with inner clipped background */}
        <div className="relative bg-gray-100 px-6 py-8 rounded-b-3xl overflow-hidden">
          {/* 🔺 Inner slanted red background with fade effect */}
          <div
            className="absolute top-0 left-0 w-full h-1/2 z-0"
            style={{
              clipPath: "polygon(0 98%, 100% 50%, 100% 0, 0 0)",
              background: "linear-gradient(to bottom right , #b01e28 35%, rgba(176, 30, 40, 0) 100% )",
            }}
          ></div>
          
          {/* Content with relative positioning to appear above background */}
          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-start">
                <span className="text-sm text-gray-500">All Traffic</span>
                <span className="text-2xl font-semibold mt-2">347.93k</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-start">
                <span className="text-sm text-gray-500">Monthly Expense</span>
                <span className="text-2xl font-semibold mt-2">$227.25</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-start">
                <span className="text-sm text-gray-500">Earnings</span>
                <span className="text-2xl font-semibold mt-2">$527.93</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-md flex flex-col">
                <span className="text-sm text-gray-500 mb-2">Geographical</span>
                <img
                  src="/geographic-placeholder.png"
                  alt="Geo Chart"
                  className="w-full h-32 object-contain opacity-70"
                />
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md col-span-2 flex flex-col">
                <span className="text-sm text-gray-500 mb-2">This month earnings</span>
                <span className="text-green-600 text-lg font-bold">+4.25%</span>
                <img
                  src="/linechart-placeholder.png"
                  alt="Line Chart"
                  className="w-full h-32 mt-2 opacity-80"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md mt-6">
              <span className="text-sm text-gray-500 mb-2 block">Gender & Age</span>
              <img
                src="/gender-age-placeholder.png"
                alt="Gender & Age Chart"
                className="w-full h-24 object-contain opacity-80"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;