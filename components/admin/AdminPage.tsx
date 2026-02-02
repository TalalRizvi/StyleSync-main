import React, { useState, useEffect, useCallback } from 'react';
import type { Garment } from '../../types';
import * as adminApiService from '../../services/adminApiService';
import Logo from '../Logo';
import GarmentList from './GarmentList';
import GarmentForm from './GarmentForm';
import CostDashboard from './CostDashboard';

interface AdminPageProps {
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'garments' | 'costs'>('garments');

  const loadGarments = useCallback(async () => {
    try {
      const garments = await adminApiService.getGarments();
      setGarments(garments);
    } catch (error) {
      console.error("Failed to load garments:", error);
      alert("Failed to load garments from server");
    }
  }, []);

  useEffect(() => {
    loadGarments();
  }, [loadGarments]);

  const handleAddNew = () => {
    setEditingGarment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (garment: Garment) => {
    setEditingGarment(garment);
    setIsFormOpen(true);
  };

  const handleDelete = async (garmentId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await adminApiService.deleteGarment(garmentId);
      loadGarments();
    }
  };

  const handleSave = async (garmentData: Omit<Garment, "id"> | Garment) => {
    if ('id' in garmentData && garmentData.id) {
      await adminApiService.updateGarment(garmentData as Garment);
    } else {
      await adminApiService.addGarment(garmentData);
    }
    loadGarments();
    setIsFormOpen(false);
  };
  
  const brands = [...new Set(garments.map(g => g.brand))].sort();
  const filteredGarments = selectedBrand
    ? garments.filter(g => g.brand === selectedBrand)
    : garments;
  const pageTitle = selectedBrand ? `Brand: ${selectedBrand}` : 'All Garments';


  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col">
      <header className="py-4 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Logo className="h-10" />
           <div className="flex items-center space-x-4">
              <button onClick={() => window.location.hash = '#/'} className="text-sm font-medium text-primary hover:underline">Back to App</button>
              <button onClick={onLogout} className="text-sm font-medium text-gray-600 hover:underline">Logout</button>
           </div>
        </div>
      </header>

      <div className="flex-grow container mx-auto max-w-7xl w-full flex">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Navigation</h2>
            <nav className="flex flex-col space-y-1 mb-6">
                <button 
                    onClick={() => setActiveTab('garments')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${activeTab === 'garments' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    Garments
                </button>
                <button 
                    onClick={() => setActiveTab('costs')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${activeTab === 'costs' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    Cost Analytics
                </button>
            </nav>
            
            {activeTab === 'garments' && (
              <>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Brands</h2>
                <nav className="flex flex-col space-y-1">
                    <button 
                        onClick={() => setSelectedBrand(null)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${!selectedBrand ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        All Garments
                    </button>
                    {brands.map(brand => (
                        <button 
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${selectedBrand === brand ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            {brand}
                        </button>
                    ))}
                </nav>
              </>
            )}
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-8">
          {activeTab === 'garments' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
                >
                  Add New Garment
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <GarmentList
                    garments={filteredGarments}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
              </div>
            </>
          ) : (
            <CostDashboard />
          )}
        </main>
      </div>

      {isFormOpen && (
        <GarmentForm
          garmentToEdit={editingGarment}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
          initialBrand={selectedBrand || ''}
        />
      )}

      <footer className="py-4 text-center text-xs text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} Style Sync Admin</p>
      </footer>
    </div>
  );
};

export default AdminPage;
