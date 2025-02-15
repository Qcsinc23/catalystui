import React, { useState } from 'react';

const InventoryPage = () => {
  const mockInventory = [
    {
      id: 1,
      name: 'Tables (Round)',
      category: 'Furniture',
      quantity: 25,
      minQuantity: 30,
      location: 'Warehouse A',
      lastUpdated: '2025-02-06',
      status: 'Low Stock',
      unitPrice: 150,
    },
    {
      id: 2,
      name: 'Chairs (Folding)',
      category: 'Furniture',
      quantity: 150,
      minQuantity: 100,
      location: 'Warehouse B',
      lastUpdated: '2025-02-05',
      status: 'In Stock',
      unitPrice: 45,
    },
    {
      id: 3,
      name: 'Tablecloths (White)',
      category: 'Linens',
      quantity: 200,
      minQuantity: 150,
      location: 'Warehouse A',
      lastUpdated: '2025-02-04',
      status: 'In Stock',
      unitPrice: 25,
    },
  ];

  const [inventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Get unique categories from inventory
  const categories = [...new Set(inventory.map(item => item.category))];

  // Filtering
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockLevelClass = (item) => {
    const ratio = item.quantity / item.minQuantity;
    if (ratio <= 0.5) return 'text-red-600 font-medium';
    if (ratio <= 1) return 'text-yellow-600 font-medium';
    return 'text-green-600 font-medium';
  };

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <div className="flex items-center space-x-4">
            {selectedItems.size > 0 && (
              <div className="flex items-center space-x-2">
                <button className="btn btn-secondary">
                  Update Stock
                </button>
                <button className="btn btn-danger">
                  Remove Selected ({selectedItems.size})
                </button>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/inventory/add'}
              className="btn btn-primary"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="search" className="form-label">Search</label>
                <input
                  type="text"
                  id="search"
                  className="form-input"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer">
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortConfig.key === 'name' && (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d={sortConfig.direction === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th>Category</th>
                  <th onClick={() => handleSort('quantity')} className="cursor-pointer">
                    <div className="flex items-center space-x-1">
                      <span>Quantity</span>
                      {sortConfig.key === 'quantity' && (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d={sortConfig.direction === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th>Min. Quantity</th>
                  <th>Location</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="font-medium text-gray-900">{item.name}</td>
                    <td>{item.category}</td>
                    <td className={getStockLevelClass(item)}>{item.quantity}</td>
                    <td>{item.minQuantity}</td>
                    <td>{item.location}</td>
                    <td>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button className="btn btn-icon btn-secondary">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                            />
                          </svg>
                        </button>
                        <button className="btn btn-icon btn-danger">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default InventoryPage;
