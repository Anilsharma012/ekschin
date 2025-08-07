import React from 'react';
import { cn } from '../lib/utils';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: {
    x?: number;
    y?: number;
  };
  className?: string;
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

interface ResponsiveTabsProps {
  children: React.ReactNode;
  className?: string;
  stackOnMobile?: boolean;
}

// Main Dashboard Layout
export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      // Mobile-first responsive design
      "w-full",
      // Ensure proper spacing on mobile
      "pb-20 md:pb-6", // Extra bottom padding for mobile nav
      className
    )}>
      {children}
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className
}) => {
  const gridClasses = [
    // Base grid
    'grid',
    // Gap
    `gap-${gap}`,
    // Responsive columns
    `grid-cols-${cols.default || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
};

// Responsive Container
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = '7xl',
  padding = { x: 4, y: 6 },
  className
}) => {
  const containerClasses = [
    // Max width
    maxWidth !== 'full' && `max-w-${maxWidth}`,
    // Centering
    'mx-auto',
    // Padding
    `px-${padding.x || 4}`,
    `py-${padding.y || 6}`,
    // Mobile adjustments
    'sm:px-6 lg:px-8',
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(containerClasses, className)}>
      {children}
    </div>
  );
};

// Responsive Card
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={cn(
      // Base card styles
      'bg-white rounded-lg border shadow-sm',
      // Responsive padding
      paddingClasses[padding],
      // Hover effects
      hover && 'transition-shadow hover:shadow-lg',
      // Mobile-specific adjustments
      'w-full',
      className
    )}>
      {children}
    </div>
  );
};

// Responsive Tabs Container
export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  children,
  className,
  stackOnMobile = true
}) => {
  return (
    <div className={cn(
      'space-y-4 sm:space-y-6',
      stackOnMobile && 'flex flex-col',
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-friendly button group
export const ResponsiveButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical' | 'responsive';
}> = ({
  children,
  className,
  direction = 'responsive'
}) => {
  const directionClasses = {
    horizontal: 'flex flex-row space-x-2',
    vertical: 'flex flex-col space-y-2',
    responsive: 'flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'
  };

  return (
    <div className={cn(directionClasses[direction], className)}>
      {children}
    </div>
  );
};

// Mobile-optimized header
export const ResponsiveHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({
  title,
  subtitle,
  actions,
  className
}) => {
  return (
    <header className={cn(
      'bg-white shadow-sm border-b',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex-shrink-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Mobile-optimized stats grid
export const ResponsiveStatsGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      // Mobile: 2 columns, larger screens: 4 columns
      'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-6',
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-friendly modal/dialog wrapper
export const ResponsiveModal: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}> = ({
  children,
  isOpen,
  onClose,
  size = 'md',
  className
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-2xl',
    xl: 'max-w-xl sm:max-w-4xl',
    full: 'max-w-full'
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className={cn(
          'bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          // Mobile-specific adjustments
          'mx-2 sm:mx-4',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Mobile-optimized tab list
export const ResponsiveTabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      // Mobile: vertical tabs, larger screens: horizontal
      'flex flex-col sm:flex-row',
      'bg-gray-100 p-1 rounded-lg',
      'space-y-1 sm:space-y-0 sm:space-x-1',
      // Make scrollable on mobile if too many tabs
      'overflow-x-auto sm:overflow-x-visible',
      className
    )}>
      {children}
    </div>
  );
};

// Utility hook for responsive breakpoints
export const useResponsive = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize
  };
};

// Export all components as named exports for easy importing
export {
  ResponsiveGrid,
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveTabs,
  ResponsiveButtonGroup,
  ResponsiveHeader,
  ResponsiveStatsGrid,
  ResponsiveModal,
  ResponsiveTabsList,
  useResponsive
};
