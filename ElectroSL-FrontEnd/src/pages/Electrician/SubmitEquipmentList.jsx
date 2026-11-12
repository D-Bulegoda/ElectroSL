
import React, { useState } from 'react';

export default function SubmitEquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const equipmentOptions = [
    { name: 'Electrical Wire', price: 150 },
    { name: 'Switch', price: 250 },
    { name: 'Socket', price: 350 },
    { name: 'LED Bulb', price: 500 },
    { name: 'Circuit Breaker', price: 1200 },
    { name: 'Electrical Tape', price: 100 },
  ];

  const addEquipment = () => {
    if (!selectedItem || Number(quantity) < 1) return;

    const item = equipmentOptions.find(
      (equipment) => equipment.name === selectedItem
    );

    setEquipment([
      ...equipment,
      {
        name: item.name,
        price: item.price,
        quantity: Number(quantity),
      },
    ]);

    setSelectedItem('');
    setQuantity(1);
    setSubmitted(false);
  };

  const removeEquipment = (index) => {
    setEquipment(equipment.filter((_, i) => i !== index));
    setSubmitted(false);
  };

  const total = equipment.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (equipment.length > 0) {
      setSubmitted(true);
    }
  };

  return (
    <div className="equipment-page">
      <h1>Submit Equipment List</h1>
      <p>Add the materials required to complete the customer's job.</p>

      <div className="equipment-card">
        <h2>Job Information</h2>
        <p><strong>Job ID:</strong> #JOB001</p>
        <p><strong>Customer:</strong> Nimal Perera</p>

        <div className="equipment-inputs">
          <label>Select Equipment</label>

          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Choose equipment</option>

            {equipmentOptions.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} - LKR {item.price}
              </option>
            ))}
          </select>

          <label>Quantity</label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <button type="button" onClick={addEquipment}>
            + Add Equipment
          </button>
        </div>

        <h2>Equipment Summary</h2>

        {equipment.length === 0 ? (
          <p>No equipment added yet.</p>
        ) : (
          <div className="equipment-list">
            {equipment.map((item, index) => (
              <div className="equipment-row" key={index}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.quantity} × LKR {item.price}
                  </p>
                </div>

                <div>
                  <strong>
                    LKR {(item.quantity * item.price).toLocaleString()}
                  </strong>

                  <button
                    type="button"
                    onClick={() => removeEquipment(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3>Total: LKR {total.toLocaleString()}</h3>

        <button
          className="equipment-submit"
          onClick={handleSubmit}
          disabled={equipment.length === 0}
        >
          Submit Equipment List
        </button>

        {submitted && (
          <p className="equipment-success">
            Equipment list submitted successfully!
          </p>
        )}
      </div>
    </div>
  );
}
