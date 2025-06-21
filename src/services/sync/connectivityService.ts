
import { supabase } from "@/integrations/supabase/client";

export const connectivityService = {
  async checkConnectivity(): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
};
