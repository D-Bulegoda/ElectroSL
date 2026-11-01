import React from 'react';

const DraggableComponents = () => {
  const components = ['16A MCB', 'Two-Way Switch', '13A Socket', 'Earth Wire', 'Live Wire'];

  return (
    <div className="bg-gray-100 p-4 rounded-lg h-full">
      <h3 className="font-bold text-gray-700 mb-4">Toolbox</h3>
      <div className="space-y-2">
        {components.map((item, index) => (
          <div 
            key={index}
            className="p-3 bg-white border border-gray-300 rounded shadow-sm cursor-grab hover:bg-blue-50"
            draggable
          >
            🔌 {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraggableComponents;