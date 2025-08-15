export type ReturnCase = {
  id: number;
  status: string;
  customer: {
    id: number;
    name: string;
  };
  arrival_date: string;
  receipt_method: string;
  notes: string | null;
      performed_services: string | null;
    yedek_parca: number;
    bakim: number;
    iscilik: number;
    cost: number;
    shipping_info: string | null;
  tracking_number: string | null;
  shipping_date: string | null;
  payment_status: string | null;
  items: {
    id: number;
    product_model: {
      id: number;
      name: string;
      product_type: string;
    };
    product_count: number;
    production_date: string | null;
    is_main_product: boolean;
    warranty_status: string;
    fault_responsibility: string;
    resolution_method: string;
    attached_to_item_id: number | null;
  }[];
};

export interface ReturnCaseItemSummary {
  product_name: string;
  count: number;
  is_main_product: boolean;
}

export interface FullReturnCaseItem {
    id: number;
    product_model: { 
      id: number; 
      name: string; 
      product_type: string;
    };
    product_count: number;
    production_date: string | null;
    has_control_unit: boolean;
    warranty_status: string;
    fault_responsibility: string;
    resolution_method: string;
    service_type: string | null;
    cable_check: boolean;
    profile_check: boolean;
    packaging: boolean;
    yapilan_islemler: string | null;
}

export interface FullReturnCase {
    id: number;
    status: string;
    arrival_date: string;
    receipt_method: string;
    customer: { id: number; name: string; };
    items: FullReturnCaseItem[];
    
    notes: string | null;
    payment_status: string | null;
    performed_services: string | null;
    yedek_parca: number;
    bakim: number;
    iscilik: number;
    cost: number;
    shipping_info: string | null;
    tracking_number: string | null;
    shipping_date: string | null;
}

export type ProductType = 'Aşırı Yük Sensörü' | 'Kapı Dedektörü' | 'Kontrol Ünitesi';

export interface ProductModel {
  id: number;
  name: string;
  product_type: ProductType;
}

export interface Customer {
  id: number;
  name: string;
  representative: string;
  contact_info: string;
  address: string;
  created_at: string; 
}

export interface User {
  email: string; 
  firstName: string;
  lastName:string;
  role: string;
  lastLogin: string | null; 
  createdAt: string | null;
  invitedAt: string | null;
  invitedBy: string | null;
  isInvited: boolean;
  isActive: boolean;
};


