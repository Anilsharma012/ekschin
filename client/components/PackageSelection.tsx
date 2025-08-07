import React from 'react';
import PackageDisplayWithSync from './PackageDisplayWithSync';

interface PackageSelectionProps {
  showUserPackages?: boolean;
  title?: string;
  className?: string;
}

const PackageSelection: React.FC<PackageSelectionProps> = (props) => {
  return (
    <PackageDisplayWithSync 
      showUserPackages={true}
      title="Select Package"
      {...props}
    />
  );
};

export default PackageSelection;
