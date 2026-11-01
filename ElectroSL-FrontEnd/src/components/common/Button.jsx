import React from 'react';

const Button = ({ text, onClick, type = 'button' }) => {
  return (
    <button 
      type={type} 
      onClick={onClick}
      className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
    >
      {text}
    </button>
  );
};

export default Button;