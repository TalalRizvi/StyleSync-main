import React, { useState, useEffect, useRef } from 'react';
import type { Garment, SizeChart } from '../../types';
import * as catalogService from '../../services/catalogService';
import UploadIcon from '../icons/UploadIcon';

interface GarmentFormProps {
  garmentToEdit: Garment | null;
  onSave: (garment: Omit<Garment, 'id'> | Garment) => void;
  onClose: () => void;
  initialBrand?: string;
}

type SizeChartEntry = {
  id: number;
  size: string;
  // Upper
  chest: string;
  sleeve: string;
  length: string;
  shoulder: string;
  // Lower
  waist: string;
  inseam: string;
  hip: string;
};

const GarmentForm: React.FC<GarmentFormProps> = ({ garmentToEdit, onSave, onClose, initialBrand }) => {
  const initialFormState = {
    name: '',
    brand: '',
    bodyPlacement: 'upper' as 'upper' | 'lower',
    type: '',
    color: '',
    imageUrl: '',
    backImageUrl: '',
    sideImageUrl: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const [sizeChart, setSizeChart] = useState<SizeChartEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const sideFileInputRef = useRef<HTMLInputElement>(null);
  
  // Style constants
  const inputBaseClass = "block w-full rounded-md border-2 border-transparent bg-primary py-2 px-3 text-sm font-semibold text-white shadow-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-primary-focus";
  const labelBaseClass = "block text-sm font-medium text-gray-700";
  const initialSizeEntry: SizeChartEntry = { id: 0, size: '', chest: '', sleeve: '', length: '', shoulder: '', waist: '', inseam: '', hip: '' };


  // Effect for initial form setup
  useEffect(() => {
    if (garmentToEdit) {
      // Setup for editing an existing garment
      setFormData({
        name: garmentToEdit.name,
        brand: garmentToEdit.brand,
        bodyPlacement: garmentToEdit.bodyPlacement,
        type: garmentToEdit.type,
        color: garmentToEdit.color,
        imageUrl: garmentToEdit.imageUrl,
        backImageUrl: (garmentToEdit as any).backImageUrl || '',
        sideImageUrl: (garmentToEdit as any).sideImageUrl || '',
        description: garmentToEdit.description || '',
      });
      const chartData = Object.entries(garmentToEdit.sizeChart).map(([size, m], index) => ({
        id: Date.now() + index,
        size,
        chest: m.chest || '',
        sleeve: m.sleeve || '',
        length: m.length || '',
        shoulder: m.shoulder || '',
        waist: m.waist || '',
        inseam: m.inseam || '',
        hip: m.hip || '',
      }));
      setSizeChart(chartData.length > 0 ? chartData : [{ ...initialSizeEntry, id: Date.now() }]);
    } else {
      setFormData(prev => ({ ...initialFormState, brand: initialBrand || '' }));
    }
  }, [garmentToEdit, initialBrand]);

  // Effect for auto-populating size chart on brand/placement change for NEW garments
  useEffect(() => {
    if (garmentToEdit) {
      return;
    }

    const allGarments = catalogService.getGarments();
    const lastMatchingGarment = [...allGarments]
        .reverse()
        .find(g => g.brand === formData.brand && g.bodyPlacement === formData.bodyPlacement);

    const inheritedSizeChart = lastMatchingGarment ? lastMatchingGarment.sizeChart : null;
    
    if (inheritedSizeChart && Object.keys(inheritedSizeChart).length > 0) {
        const chartData = Object.entries(inheritedSizeChart).map(([size, m], index) => ({
            ...initialSizeEntry,
            id: Date.now() + index,
            size,
            chest: m.chest || '',
            sleeve: m.sleeve || '',
            length: m.length || '',
            shoulder: m.shoulder || '',
            waist: m.waist || '',
            inseam: m.inseam || '',
            hip: m.hip || '',
        }));
        setSizeChart(chartData);
    } else {
        setSizeChart([{ ...initialSizeEntry, id: Date.now() }]);
    }
  }, [garmentToEdit, formData.brand, formData.bodyPlacement]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, backImageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, sideImageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };


  const handleSizeChartChange = (index: number, field: keyof Omit<SizeChartEntry, 'id'>, value: string) => {
    const newSizeChart = [...sizeChart];
    newSizeChart[index][field] = value;
    setSizeChart(newSizeChart);
  };
  
  const addSize = () => {
    setSizeChart(prev => [...prev, { ...initialSizeEntry, id: Date.now() }]);
  };

  const removeSize = (id: number) => {
    setSizeChart(prev => prev.filter(s => s.id !== id));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
        alert("Please provide an image for the garment.");
        return;
    }
    const formattedSizeChart: SizeChart = sizeChart.reduce((acc, curr) => {
        if (curr.size.trim()) {
            const measurements: SizeChart[string] = {};
            if (formData.bodyPlacement === 'upper') {
                if (curr.chest.trim()) measurements.chest = curr.chest.trim();
                if (curr.sleeve.trim()) measurements.sleeve = curr.sleeve.trim();
                if (curr.length.trim()) measurements.length = curr.length.trim();
                if (curr.shoulder.trim()) measurements.shoulder = curr.shoulder.trim();
            } else {
                if (curr.waist.trim()) measurements.waist = curr.waist.trim();
                if (curr.inseam.trim()) measurements.inseam = curr.inseam.trim();
                if (curr.hip.trim()) measurements.hip = curr.hip.trim();
            }
            
            if (Object.keys(measurements).length > 0 || sizeChart.length === 1) {
                 acc[curr.size.trim()] = measurements;
            }
        }
        return acc;
    }, {} as SizeChart);
    
    const finalGarment = {
        ...formData,
        sizeChart: formattedSizeChart
    };

    if (garmentToEdit) {
        onSave({ ...finalGarment, id: garmentToEdit.id });
    } else {
        onSave(finalGarment);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all">
        <header className="p-6 border-b bg-gray-50 rounded-t-lg flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{garmentToEdit ? 'Edit Garment' : 'Add New Garment'}</h2>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Image Section */}
                <section>
                    <label className={`${labelBaseClass} mb-2`}>Garment Image</label>
                     <div className="flex items-center gap-4">
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <UploadIcon className="w-10 h-10 text-gray-400"/>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                                Upload Image
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-sm text-gray-500">or</span>
                                </div>
                            </div>
                            
                            <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="Paste image URL" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900 placeholder:text-gray-400"/>
                        </div>
                    </div>
                </section>

                {/* Back Image Section */}
                <section className="pt-6 border-t">
                    <label className={`${labelBaseClass} mb-2`}>Back Image (Optional)</label>
                     <div className="flex items-center gap-4">
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">
                            {formData.backImageUrl ? (
                                <img src={formData.backImageUrl} alt="Back Preview" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <UploadIcon className="w-10 h-10 text-gray-400"/>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                             <button type="button" onClick={() => backFileInputRef.current?.click()} className="w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                                Upload Back Image
                            </button>
                            <input type="file" ref={backFileInputRef} onChange={handleBackImageUpload} accept="image/*" className="hidden"/>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-sm text-gray-500">or</span>
                                </div>
                            </div>
                            
                            <input type="url" name="backImageUrl" id="backImageUrl" value={formData.backImageUrl} onChange={handleInputChange} placeholder="Paste back image URL" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900 placeholder:text-gray-400"/>
                        </div>
                    </div>
                </section>

                {/* Side Image Section */}
                <section className="pt-6 border-t">
                    <label className={`${labelBaseClass} mb-2`}>Side Image (Optional)</label>
                     <div className="flex items-center gap-4">
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed">
                            {formData.sideImageUrl ? (
                                <img src={formData.sideImageUrl} alt="Side Preview" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <UploadIcon className="w-10 h-10 text-gray-400"/>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                             <button type="button" onClick={() => sideFileInputRef.current?.click()} className="w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                                Upload Side Image
                            </button>
                            <input type="file" ref={sideFileInputRef} onChange={handleSideImageUpload} accept="image/*" className="hidden"/>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-sm text-gray-500">or</span>
                                </div>
                            </div>
                            
                            <input type="url" name="sideImageUrl" id="sideImageUrl" value={formData.sideImageUrl} onChange={handleInputChange} placeholder="Paste side image URL" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900 placeholder:text-gray-400"/>
                        </div>
                    </div>
                </section>

                {/* Details Section */}
                <section className="pt-6 border-t">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">Item Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className={labelBaseClass}>Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={`${inputBaseClass} mt-1`}/>
                        </div>
                        <div>
                            <label htmlFor="brand" className={labelBaseClass}>Brand</label>
                            <input type="text" name="brand" id="brand" value={formData.brand} onChange={handleInputChange} required className={`${inputBaseClass} mt-1`}/>
                        </div>
                        <div>
                            <label htmlFor="bodyPlacement" className={labelBaseClass}>Body Placement</label>
                            <select id="bodyPlacement" name="bodyPlacement" value={formData.bodyPlacement} onChange={handleInputChange} className={`${inputBaseClass} mt-1`}>
                                <option value="upper">Upper</option>
                                <option value="lower">Lower</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="type" className={labelBaseClass}>Type (e.g., T-shirt)</label>
                            <input type="text" name="type" id="type" value={formData.type} onChange={handleInputChange} required className={`${inputBaseClass} mt-1`}/>
                        </div>
                         <div className="md:col-span-1">
                            <label htmlFor="color" className={labelBaseClass}>Color</label>
                            <input type="text" name="color" id="color" value={formData.color} onChange={handleInputChange} required className={`${inputBaseClass} mt-1`}/>
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="description" className={labelBaseClass}>Description (Optional)</label>
                             <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900 placeholder:text-gray-400" placeholder="e.g., oversized fit, silk material..."></textarea>
                             <p className="mt-1 text-xs text-gray-500">This helps the AI understand special features of the garment.</p>
                        </div>
                    </div>
                </section>

                {/* Size Chart Section */}
                <section className="pt-6 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Size Chart</h3>
                    <p className="text-sm text-gray-500 mb-4">Enter the available sizes and their measurements in inches. The chart is auto-filled from the last item with the same brand and placement.</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-x-4 px-2 pb-1">
                             <label className="col-span-2 text-xs font-medium text-gray-500">Size</label>
                             {formData.bodyPlacement === 'upper' ? (
                                <>
                                  <label className="col-span-2 text-xs font-medium text-gray-500">Chest</label>
                                  <label className="col-span-2 text-xs font-medium text-gray-500">Sleeve</label>
                                  <label className="col-span-2 text-xs font-medium text-gray-500">Length</label>
                                  <label className="col-span-2 text-xs font-medium text-gray-500">Shoulder</label>
                                </>
                             ) : (
                                <>
                                  <label className="col-span-3 text-xs font-medium text-gray-500">Waist</label>
                                  <label className="col-span-3 text-xs font-medium text-gray-500">Inseam</label>
                                  <label className="col-span-3 text-xs font-medium text-gray-500">Hip</label>
                                </>
                             )}
                        </div>
                     {sizeChart.map((entry, index) => (
                         <div key={entry.id} className="grid grid-cols-12 items-center gap-x-4">
                            <div className="col-span-2">
                                <input type="text" placeholder="e.g., M" value={entry.size} onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)} className={inputBaseClass}/>
                            </div>
                            {formData.bodyPlacement === 'upper' ? (
                                <>
                                    <div className="col-span-2">
                                        <input type="text" placeholder="38-40" value={entry.chest} onChange={(e) => handleSizeChartChange(index, 'chest', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                    <div className="col-span-2">
                                        <input type="text" placeholder="34" value={entry.sleeve} onChange={(e) => handleSizeChartChange(index, 'sleeve', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                    <div className="col-span-2">
                                        <input type="text" placeholder="28" value={entry.length} onChange={(e) => handleSizeChartChange(index, 'length', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                     <div className="col-span-2">
                                        <input type="text" placeholder="18" value={entry.shoulder} onChange={(e) => handleSizeChartChange(index, 'shoulder', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-3">
                                        <input type="text" placeholder="32-34" value={entry.waist} onChange={(e) => handleSizeChartChange(index, 'waist', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                    <div className="col-span-3">
                                        <input type="text" placeholder="32" value={entry.inseam} onChange={(e) => handleSizeChartChange(index, 'inseam', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                    <div className="col-span-3">
                                        <input type="text" placeholder="40" value={entry.hip} onChange={(e) => handleSizeChartChange(index, 'hip', e.target.value)} className={inputBaseClass}/>
                                    </div>
                                </>
                            )}
                            <div className="col-span-1 flex-shrink-0">
                                {sizeChart.length > 1 && (
                                    <button type="button" onClick={() => removeSize(entry.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" aria-label="Remove size">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                            </div>
                         </div>
                     ))}
                     </div>
                     <button type="button" onClick={addSize} className="mt-4 text-sm font-medium text-primary hover:text-primary-hover">
                         + Add Size
                     </button>
                </section>
            </main>

            <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3 flex-shrink-0 rounded-b-lg">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">Save Garment</button>
            </footer>
        </form>
      </div>
    </div>
  );
};

export default GarmentForm;