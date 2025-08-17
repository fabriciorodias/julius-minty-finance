
import { useLocalStorage } from './useLocalStorage';

export interface ReconciliationSettings {
  alertThresholdHours: number;
}

const DEFAULT_SETTINGS: ReconciliationSettings = {
  alertThresholdHours: 48,
};

export function useReconciliationSettings() {
  const [settings, setSettings] = useLocalStorage<ReconciliationSettings>(
    'reconciliation-settings',
    DEFAULT_SETTINGS
  );

  const updateSettings = (newSettings: Partial<ReconciliationSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const getThresholdInDays = () => {
    return Math.round(settings.alertThresholdHours / 24 * 10) / 10;
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
    getThresholdInDays,
  };
}
