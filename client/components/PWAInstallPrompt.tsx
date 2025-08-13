import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode || isIOSInstalled) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setShowPrompt(false);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // iOS install instructions
  if (isIOS) {
    return showPrompt ? (
      <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-red-600 to-red-700 border-red-500 text-white shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <h3 className="font-semibold">App Install करें</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="text-white hover:bg-red-500 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="mb-2">होम स्क्रीन पर app add करने के लिए:</p>
            <div className="bg-red-800/30 p-2 rounded text-xs space-y-1">
              <p>1. नीचे Share बटन दबाएं 📤</p>
              <p>2. "Add to Home Screen" select करें</p>
              <p>3. "Add" दबाएं</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : null;
  }

  // Regular install prompt for Android/Chrome
  return showPrompt ? (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-red-600 to-red-700 border-red-500 text-white shadow-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <h3 className="font-semibold">App Install करें</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-white hover:bg-red-500 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm mb-3 opacity-90">
          Aashish Property app को अपने phone पर install करें। Faster access और better experience के लिए।
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleInstallClick}
            className="bg-white text-red-600 hover:bg-gray-100 font-medium flex-1"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install करें
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="text-white hover:bg-red-500 border border-red-400"
            size="sm"
          >
            बाद में
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-3 text-xs opacity-75">
          <div className="flex items-center gap-4">
            <span>📱 Offline काम करता है</span>
            <span>⚡ Fast loading</span>
            <span>🔔 Push notifications</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;
}

// Inline install button for header/navigation
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode || isIOSInstalled) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="text-red-600 border-red-300 hover:bg-red-50"
    >
      <Download className="h-4 w-4 mr-1" />
      Install App
    </Button>
  );
}
