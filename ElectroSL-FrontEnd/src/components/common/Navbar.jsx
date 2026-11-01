import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
      <div className="text-2xl font-bold tracking-wider">
        ⚡ ElectroSL
      </div>
      <div className="space-x-6">
        <a href="/" className="hover:text-yellow-400 transition-colors">Home</a>
        <a href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</a>
        <a href="/login" className="bg-yellow-500 text-blue-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400">
          Login
        </a>
      </div>
    </nav>
  );
};

export default Navbar;