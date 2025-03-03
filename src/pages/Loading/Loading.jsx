import React from 'react';
import Loading from '../../components/common/Loading';

/**
 * Loading page component
 */
const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loading size="xl" className="mb-4" />
        <h2 className="text-xl font-medium">Loading...</h2>
      </div>
    </div>
  );
};

export default LoadingPage;