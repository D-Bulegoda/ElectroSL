import React, { useState } from 'react';

const ImageUploader = ({ onImageUpload }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      if (onImageUpload) onImageUpload(file);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="font-semibold text-gray-700">Upload Problem Image / After Image</label>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {preview && (
        <img src={preview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-lg border" />
      )}
    </div>
  );
};

export default ImageUploader;