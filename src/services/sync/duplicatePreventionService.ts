
import { supabase } from "@/integrations/supabase/client";
import { Product } from "../inventoryService";
import { Customer } from "@/types/customer";

export class DuplicatePreventionService {
  private static instance: DuplicatePreventionService;
  
  static getInstance(): DuplicatePreventionService {
    if (!DuplicatePreventionService.instance) {
      DuplicatePreventionService.instance = new DuplicatePreventionService();
    }
    return DuplicatePreventionService.instance;
  }

  async checkProductDuplicates(product: Product): Promise<{ isDuplicate: boolean; existingId?: string; conflicts: string[] }> {
    const conflicts: string[] = [];

    try {
      console.log('DuplicatePreventionService: Checking product duplicates for:', product.name);

      // Check by SKU if provided
      if (product.sku) {
        const { data: skuMatch, error: skuError } = await supabase
          .from('products')
          .select('id, name')
          .eq('sku', product.sku)
          .neq('id', product.id);

        if (skuError) {
          console.error('DuplicatePreventionService: SKU check error:', skuError);
        } else if (skuMatch && skuMatch.length > 0) {
          conflicts.push(`SKU '${product.sku}' already exists for product: ${skuMatch[0].name}`);
          return { isDuplicate: true, existingId: skuMatch[0].id, conflicts };
        }
      }

      // Check by name and category combination
      const { data: nameMatch, error: nameError } = await supabase
        .from('products')
        .select('id, name, category, sku')
        .eq('name', product.name)
        .eq('category', product.category || '')
        .neq('id', product.id);

      if (nameError) {
        console.error('DuplicatePreventionService: Name check error:', nameError);
      } else if (nameMatch && nameMatch.length > 0) {
        conflicts.push(`Product '${product.name}' in category '${product.category}' already exists`);
        return { isDuplicate: true, existingId: nameMatch[0].id, conflicts };
      }

      console.log('DuplicatePreventionService: No duplicates found');
      return { isDuplicate: false, conflicts: [] };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('DuplicatePreventionService: Product duplicate check failed:', error);
      conflicts.push(`Duplicate check failed: ${errorMsg}`);
      return { isDuplicate: false, conflicts };
    }
  }

  async checkCustomerDuplicates(customer: Customer): Promise<{ isDuplicate: boolean; existingId?: string; conflicts: string[] }> {
    const conflicts: string[] = [];

    try {
      console.log('DuplicatePreventionService: Checking customer duplicates for:', customer.phone);

      // Check by phone number (primary identifier)
      const { data: phoneMatch, error: phoneError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('phone', customer.phone)
        .neq('id', customer.id);

      if (phoneError) {
        console.error('DuplicatePreventionService: Phone check error:', phoneError);
      } else if (phoneMatch && phoneMatch.length > 0) {
        conflicts.push(`Phone number '${customer.phone}' already exists for customer: ${phoneMatch[0].name}`);
        return { isDuplicate: true, existingId: phoneMatch[0].id, conflicts };
      }

      // Check for similar names with same phone pattern (fuzzy matching)
      if (customer.name && customer.name.length > 3) {
        const { data: nameMatch, error: nameError } = await supabase
          .from('customers')
          .select('id, name, phone')
          .ilike('name', `%${customer.name}%`)
          .neq('id', customer.id)
          .limit(5);

        if (nameError) {
          console.error('DuplicatePreventionService: Name similarity check error:', nameError);
        } else if (nameMatch && nameMatch.length > 0) {
          for (const match of nameMatch) {
            // Check if phone numbers are similar (last 4 digits)
            if (this.arePhonesRelated(customer.phone, match.phone)) {
              conflicts.push(`Similar customer found: ${match.name} (${match.phone})`);
            }
          }
        }
      }

      console.log('DuplicatePreventionService: Customer duplicate check completed');
      return { isDuplicate: false, conflicts };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('DuplicatePreventionService: Customer duplicate check failed:', error);
      conflicts.push(`Duplicate check failed: ${errorMsg}`);
      return { isDuplicate: false, conflicts };
    }
  }

  private arePhonesRelated(phone1: string, phone2: string): boolean {
    // Extract digits only
    const clean1 = phone1.replace(/\D/g, '');
    const clean2 = phone2.replace(/\D/g, '');
    
    // Check if last 4 digits are the same
    if (clean1.length >= 4 && clean2.length >= 4) {
      const suffix1 = clean1.slice(-4);
      const suffix2 = clean2.slice(-4);
      return suffix1 === suffix2;
    }
    
    return false;
  }

  async deduplicateLocalStorage(): Promise<{ fixed: number; errors: string[] }> {
    const errors: string[] = [];
    let fixed = 0;

    try {
      console.log('DuplicatePreventionService: Starting local storage deduplication...');

      // Deduplicate products
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const uniqueProducts = new Map<string, any>();
      
      for (const product of products) {
        const key = `${product.name}-${product.category || 'default'}`;
        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, product);
        } else {
          console.log(`DuplicatePreventionService: Removing duplicate product: ${product.name}`);
          fixed++;
        }
      }
      
      if (fixed > 0) {
        localStorage.setItem('products', JSON.stringify(Array.from(uniqueProducts.values())));
      }

      // Deduplicate customers
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const uniqueCustomers = new Map<string, any>();
      
      for (const customer of customers) {
        if (!uniqueCustomers.has(customer.phone)) {
          uniqueCustomers.set(customer.phone, customer);
        } else {
          console.log(`DuplicatePreventionService: Removing duplicate customer: ${customer.phone}`);
          fixed++;
        }
      }
      
      if (uniqueCustomers.size < customers.length) {
        localStorage.setItem('customers', JSON.stringify(Array.from(uniqueCustomers.values())));
      }

      console.log(`DuplicatePreventionService: Deduplication completed. Fixed: ${fixed}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Local storage deduplication failed: ${errorMsg}`);
      console.error('DuplicatePreventionService: Deduplication error:', error);
    }

    return { fixed, errors };
  }
}

export const duplicatePreventionService = DuplicatePreventionService.getInstance();
