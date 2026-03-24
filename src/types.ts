export type Platform = string; // Eased from strict union to allow dynamic supplier categories

export interface Service {
  id: string;
  name: string;
  platform: Platform;
  type?: string; 
  category: string;
  description: string;
  pricePer1000: number;
  minOrder: number;
  maxOrder: number;
  deliveryTime: string;
  rating: number;
  reviews: number;
  icon?: any;
  features?: string[];
  stock_quantity?: number | null;
  availability?: boolean;
  supplier_id?: string | null;
}

export interface CartItem {
  service: Service;
  quantity: number;
  targetUrl: string;
}

export interface Order {
  id: string;
  serviceName: string;
  platform: Platform;
  quantity: number;
  status: 'Pending' | 'Processing' | 'In Progress' | 'Completed' | 'Cancelled';
  date: string;
  total: number;
  progress?: number;
}
