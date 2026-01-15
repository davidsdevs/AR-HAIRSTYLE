import React, { useState, useEffect } from 'react';
import { getCurrentBranch } from '../lib/firebase';
import { MapPin, AlertCircle } from 'lucide-react';

const BranchInfo = ({ className = '' }) => {
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranch();
  }, []);

  const loadBranch = async () => {
    try {
      const currentBranch = await getCurrentBranch();
      setBranch(currentBranch);
    } catch (error) {
      console.error('Error loading branch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!branch) {
    return (
      <div className={`flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">No branch configured</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{branch.name}</span>
    </div>
  );
};

export default BranchInfo;
