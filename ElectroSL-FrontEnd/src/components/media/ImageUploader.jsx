
import React, { useState, useEffect } from 'react';

const ImageUploader = ({ onImageUpload }) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const newImages = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setImages((previous) => {
      const updated = [...previous, ...newImages];
      if (onImageUpload) {
        onImageUpload(updated.map((image) => image.file));
      }
      return updated;
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((previous) => {
      const removed = previous[index];
      URL.revokeObjectURL(removed.preview);

      const updated = previous.filter((_, i) => i !== index);

      if (onImageUpload) {
        onImageUpload(updated.map((image) => image.file));
      }

      return updated;
    });
  };

  return (
    <div className="image-uploader">
      <label className="upload-label">
        Upload Problem Images
      </label>

      <label className="custom-file-upload">
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={handleFileChange}
  />
  📁 Choose Images
</label>

<span className="selected-file-text">
  {images.length === 0
    ? 'No images selected'
    : `${images.length} image(s) selected`}
</span>

      <p className="upload-hint">
        You can select multiple images of the electrical problem.
      </p>

      <div className="image-preview-grid">
        {images.map((image, index) => (
          <div className="image-preview-item" key={image.preview}>
            <img src={image.preview} alt={`Problem ${index + 1}`} />

            <button
              type="button"
              onClick={() => removeImage(index)}
              className="remove-image-button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <p className="image-count">
          {images.length} image(s) selected
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
