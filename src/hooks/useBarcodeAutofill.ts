import {useCallback, useEffect, useState} from 'react';
import {barcodeService} from '../services/barcodeService';

interface UseBarcodeAutofillParams {
  routeBarcode?: string;
  currentName?: string;
  currentDescription?: string;
  currentBarcode?: string;
  setField: (field: string, value: string) => void;
  clearRouteBarcode: () => void;
}

export const useBarcodeAutofill = ({
  routeBarcode,
  currentName,
  currentDescription,
  currentBarcode,
  setField,
  clearRouteBarcode,
}: UseBarcodeAutofillParams) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  const applyBarcode = useCallback(
    async (barcode: string) => {
      const trimmedBarcode = barcode.trim();

      if (!trimmedBarcode) {
        return;
      }

      setField('barcode', trimmedBarcode);
      setIsLookingUpBarcode(true);

      try {
        const result = await barcodeService.lookupBarcode(trimmedBarcode);
        if (result.success && result.product) {
          if (!currentName?.trim() && result.product.name) {
            setField('name', result.product.name);
          }

          if (!currentDescription?.trim() && result.product.description) {
            setField('description', result.product.description);
          }
        }
      } catch {
        // Barcode value still applies even when lookup fails.
      } finally {
        setIsLookingUpBarcode(false);
      }
    },
    [currentDescription, currentName, setField],
  );

  useEffect(() => {
    if (!routeBarcode || routeBarcode === currentBarcode) {
      return;
    }

    applyBarcode(routeBarcode);
    clearRouteBarcode();
  }, [applyBarcode, clearRouteBarcode, currentBarcode, routeBarcode]);

  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      setScannerVisible(false);
      applyBarcode(barcode);
    },
    [applyBarcode],
  );

  return {
    scannerVisible,
    isLookingUpBarcode,
    setScannerVisible,
    handleBarcodeDetected,
  };
};
