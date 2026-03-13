export type Platform = 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Facebook';

export interface Service {
  id: string;
  name: string;
  platform: Platform;
  category: string;
  description: string;
  pricePer1000: number;
  minOrder: number;
  maxOrder: number;
  deliveryTime: string;
  rating: number;
  reviews: number;
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
