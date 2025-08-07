import React from 'react';
import PackageDisplayWithSync from './PackageDisplayWithSync';

interface PackageSelectionProps {
  propertyId?: string;
  onPackageSelect?: (packageId: string) => void;
  showUserPackages?: boolean;
  title?: string;
  className?: string;
}

const PackageSelection: React.FC<PackageSelectionProps> = ({
  propertyId,
  onPackageSelect,
  showUserPackages = false,
  title = "Select Package",
  className,
  ...props
}) => {
  return (
    <PackageDisplayWithSync
      propertyId={propertyId}
      onPackageSelect={onPackageSelect}
      showUserPackages={showUserPackages}
      showAvailablePackages={true}
      title={title}
      className={className}
      {...props}
    />
  );
};

export default PackageSelection;
