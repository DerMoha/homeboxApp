import {useCallback, useEffect, useState} from 'react';

interface UseBarcodeAutofillParams {
  routeBarcode?: string;
  currentBarcode?: string;
  setField: (field: string, value: string) => void;
  clearRouteBarcode: () => void;
}

export const useBarcodeAutofill = ({
  routeBarcode,
  currentBarcode,
  setField,
  clearRouteBarcode,
}: UseBarcodeAutofillParams) => {
  const [scannerVisible, setScannerVisible] = useState(false);

  const applyBarcode = useCallback(
    (barcode: string) => {
      const trimmedBarcode = barcode.trim();

      if (!trimmedBarcode) {
        return;
      }

      setField('barcode', trimmedBarcode);
    },
    [setField],
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
    setScannerVisible,
    handleBarcodeDetected,
  };
};
