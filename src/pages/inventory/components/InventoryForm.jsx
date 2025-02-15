import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const InventoryForm = ({ item, onSubmit, onCancel }) => {
  const initialFormData = {
    name: '',
    category: '',
    quantity: '',
    minQuantity: '',
    location: '',
    unitPrice: '',
    description: '',
    supplier: '',
    sku: '',
    notes: '',
    ...item
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...initialFormData, ...item });
    }
  }, [item]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    if (!formData.minQuantity) {
      newErrors.minQuantity = 'Minimum quantity is required';
    } else if (isNaN(formData.minQuantity) || parseInt(formData.minQuantity) < 0) {
      newErrors.minQuantity = 'Please enter a valid minimum quantity';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Storage location is required';
    }

    if (!formData.unitPrice) {
      newErrors.unitPrice = 'Unit price is required';
    } else if (isNaN(formData.unitPrice) || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Please enter a valid unit price';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        submit: 'Failed to save inventory item. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="alert alert-error" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="form-label">Item Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="category" className="form-label">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            className={`form-input ${errors.category ? 'form-input-error' : ''}`}
            value={formData.category}
            onChange={handleChange}
          />
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="quantity" className="form-label">Current Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="0"
            className={`form-input ${errors.quantity ? 'form-input-error' : ''}`}
            value={formData.quantity}
            onChange={handleChange}
          />
          {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        </div>

        <div>
          <label htmlFor="minQuantity" className="form-label">Minimum Quantity</label>
          <input
            type="number"
            id="minQuantity"
            name="minQuantity"
            min="0"
            className={`form-input ${errors.minQuantity ? 'form-input-error' : ''}`}
            value={formData.minQuantity}
            onChange={handleChange}
          />
          {errors.minQuantity && <p className="form-error">{errors.minQuantity}</p>}
        </div>

        <div>
          <label htmlFor="unitPrice" className="form-label">Unit Price ($)</label>
          <input
            type="number"
            id="unitPrice"
            name="unitPrice"
            min="0"
            step="0.01"
            className={`form-input ${errors.unitPrice ? 'form-input-error' : ''}`}
            value={formData.unitPrice}
            onChange={handleChange}
          />
          {errors.unitPrice && <p className="form-error">{errors.unitPrice}</p>}
        </div>

        <div>
          <label htmlFor="sku" className="form-label">SKU</label>
          <input
            type="text"
            id="sku"
            name="sku"
            className={`form-input ${errors.sku ? 'form-input-error' : ''}`}
            value={formData.sku}
            onChange={handleChange}
          />
          {errors.sku && <p className="form-error">{errors.sku}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="form-label">Storage Location</label>
        <input
          type="text"
          id="location"
          name="location"
          className={`form-input ${errors.location ? 'form-input-error' : ''}`}
          value={formData.location}
          onChange={handleChange}
        />
        {errors.location && <p className="form-error">{errors.location}</p>}
      </div>

      <div>
        <label htmlFor="supplier" className="form-label">Supplier</label>
        <input
          type="text"
          id="supplier"
          name="supplier"
          className="form-input"
          value={formData.supplier}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          name="description"
          rows="3"
          className="form-textarea"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="notes" className="form-label">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          className="form-textarea"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

InventoryForm.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    category: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minQuantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    location: PropTypes.string,
    unitPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    description: PropTypes.string,
    supplier: PropTypes.string,
    sku: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default InventoryForm;