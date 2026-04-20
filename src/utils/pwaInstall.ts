export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let canInstallCallback: ((canInstall: boolean) => void) | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e as BeforeInstallPromptEvent;
  
  if (canInstallCallback) {
    canInstallCallback(true);
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (canInstallCallback) {
    canInstallCallback(false);
  }
});

export const onCanInstallChange = (callback: (canInstall: boolean) => void) => {
  canInstallCallback = callback;
  callback(deferredPrompt !== null);
};

export const promptInstall = async (): Promise<'accepted' | 'dismissed'> => {
  if (!deferredPrompt) {
    return 'dismissed';
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredPrompt = null;
    if (canInstallCallback) {
      canInstallCallback(false);
    }
  }
  
  return outcome;
};
