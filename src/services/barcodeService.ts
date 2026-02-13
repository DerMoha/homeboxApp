import axios from 'axios';
import {logger} from '../utils/logger';

export interface BarcodeProduct {
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  image?: string;
  barcode: string;
  source: string;
}

export interface BarcodeLookupResult {
  success: boolean;
  product?: BarcodeProduct;
  error?: string;
}

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';
const UPC_DATABASE_API = 'https://api.upcdatabase.org/product';

class BarcodeService {
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    if (!barcode || barcode.trim() === '') {
      return {success: false, error: 'Invalid barcode'};
    }

    const cleanBarcode = barcode.trim();

    const openFoodResult = await this.lookupOpenFoodFacts(cleanBarcode);
    if (openFoodResult.success && openFoodResult.product) {
      return openFoodResult;
    }

    return {
      success: false,
      error: 'Product not found in any database',
    };
  }

  private async lookupOpenFoodFacts(
    barcode: string,
  ): Promise<BarcodeLookupResult> {
    try {
      const response = await axios.get(`${OPEN_FOOD_FACTS_API}/${barcode}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'HomeboxApp/1.0',
        },
      });

      if (response.data?.status === 1 && response.data?.product) {
        const product = response.data.product;

        const name =
          product.product_name ||
          product.product_name_en ||
          product.generic_name ||
          'Unknown Product';

        const brand = product.brands || product.brand_owner || undefined;

        const category =
          product.categories?.split(',')?.[0]?.trim() || undefined;

        return {
          success: true,
          product: {
            name: name.trim(),
            description: product.generic_name?.trim() || undefined,
            brand: brand?.trim(),
            category: category?.trim(),
            image: product.image_url || product.image_front_url || undefined,
            barcode,
            source: 'Open Food Facts',
          },
        };
      }

      return {success: false, error: 'Product not found'};
    } catch (error) {
      logger.warn('Open Food Facts lookup failed', {barcode, error});
      return {success: false, error: 'Lookup failed'};
    }
  }
}

export const barcodeService = new BarcodeService();
