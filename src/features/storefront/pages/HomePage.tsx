import React from 'react';
import { DynamicBlockRenderer } from '../blocks/DynamicBlockRenderer';

export const HomePage: React.FC = () => {
  return (
    <div className="pb-16">
      <DynamicBlockRenderer />
    </div>
  );
};

export default HomePage;
