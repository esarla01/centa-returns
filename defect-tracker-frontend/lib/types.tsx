export type ReturnCase = {
  id: number;
  status: string;
  customer_name: string;
  arrival_date: string;
  assigned_user: string | null;
  receipt_method: string;
  items: {
    id: number;
    is_main_product: boolean;
    product_name: string;
    product_type: string;
    product_count: number;
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
    product_model: { id: number; name: string; };
    product_count: number;
    serial_number: string | null;
    is_main_product: boolean;
    fault_description?: string;
}

export interface FullReturnCase {
    id: number;
    status: string;
    arrival_date: string;
    receipt_method: string;
    fault_source: string;
    warranty_status: string;

    customer: { id: number; name: string; };
    assigned_user: { id: number; firstName: string; lastName: string; } | null;
    items: FullReturnCaseItem[];
    
    cost: number | null;
    payment_status: string | null;
    shipping_info: string | null;
    notes: string | null;
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

export type UserRole = 'Yönetici' | 'Yönetici Yardımcısı' | 'Kullanıcı';

export interface User {
  email: string; 
  firstName: string;
  lastName:string;
  role: UserRole;
  status: 'Active' | 'Inactive'; 
  lastLogin: string | null; 
  createdAt: string;
  avatarUrl?: string; 
  initials: string; 
};


