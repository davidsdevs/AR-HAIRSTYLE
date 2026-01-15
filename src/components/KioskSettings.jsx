import React, { useState, useEffect } from 'react';
import { fetchBranches, getCurrentBranch } from '../lib/firebase';
import { Settings, MapPin, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const KioskSettings = ({ onClose }) => {
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBranchData();
  }, []);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      const [branchList, current] = await Promise.all([
        fetchBranches(),
        getCurrentBranch()
      ]);
      
      setBranches(branchList);
      setCurrentBranch(current);
      setError(null);
    } catch (err) {
      console.error('Error loading branch data:', err);
      setError('Failed to load branch information');
    } finally {
      setLoading(false);
    }
  };

  const formatOperatingHours = (hours) => {
    if (!hours) return 'Not set';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, index) => {
      const dayHours = hours[day];
      if (!dayHours) return null;
      
      return (
        <div key={day} className="flex justify-between text-sm">
          <span className="font-medium">{dayLabels[index]}:</span>
          <span>
            {dayHours.isOpen 
              ? `${dayHours.open} - ${dayHours.close}`
              : 'Closed'}
          </span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Kiosk Branch Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Current Branch Configuration */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Configuration</h3>
            
            {currentBranch ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{currentBranch.name}</h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Address</p>
                            <p className="text-gray-800">{currentBranch.address || 'Not set'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Phone className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Contact</p>
                            <p className="text-gray-800">{currentBranch.contact || 'Not set'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Mail className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Email</p>
                            <p className="text-gray-800">{currentBranch.email || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-gray-600">Operating Hours</p>
                        </div>
                        <div className="ml-7 space-y-1">
                          {formatOperatingHours(currentBranch.operatingHours)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Branch ID:</span> {currentBranch.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium mb-2">No Branch Configured</p>
                    <p className="text-yellow-700 text-sm mb-3">
                      This kiosk is not configured with a branch location. Please set the VITE_KIOSK_BRANCH_ID in your .env file.
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-sm">
                      VITE_KIOSK_BRANCH_ID=your_branch_id_here
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Available Branches */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Available Branches ({branches.length})
            </h3>
            
            {branches.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No active branches found</p>
            ) : (
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`border rounded-lg p-4 transition-all ${
                      currentBranch?.id === branch.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{branch.name}</h4>
                          {currentBranch?.id === branch.id && (
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {branch.address}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {branch.contact}
                          </p>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-mono">ID: {branch.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to Change Branch</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the Branch ID from the list above</li>
              <li>Open your .env file in the project root</li>
              <li>Update VITE_KIOSK_BRANCH_ID with the new branch ID</li>
              <li>Restart the application for changes to take effect</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KioskSettings;
