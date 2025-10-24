import React from 'react';
import { TrophySpin } from 'react-loading-indicators';

const Loading = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <TrophySpin color="#7592ff" size="medium" />
    </div>
  );
};

export default Loading;
