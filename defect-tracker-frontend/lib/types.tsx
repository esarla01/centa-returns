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

// New interface for service definitions
export interface ServiceDefinition {
  id: number;
  service_name: string;
  product_type: string;
}

// Service management interface
export interface ServiceModel {
  id: number;
  service_name: string;
  product_type: string;
}

// New interface for return case item services
export interface ReturnCaseItemService {
  id: number;
  service_definition_id: number;
  service_name: string;
  is_performed: boolean;
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
    cable_check: boolean;
    profile_check: boolean;
    packaging: boolean;
    // Remove yapilan_islemler and add services
    services: ReturnCaseItemService[];
}

export interface FullReturnCase {
    id: number;
    status: string;
    arrival_date: string;
    receipt_method: string;
    customer: { 
        id: number; 
        name: string; 
        contact_info?: string;
        address?: string;
    };
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

export type ProductType = 'Aşırı Yük Sensörü' | 'Fotosel' | 'Kontrol Ünitesi';

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
  emailNotificationsEnabled: boolean;
};

export interface UserActionLog {
  id: number;
  user_email: string;
  user_name: string;
  return_case_id: number;
  action_type: string;
  additional_info: string | null;
  created_at: string;
}

// New interface for service selection in forms
export interface ServiceSelection {
  service_definition_id: number;
  is_performed: boolean;
}

// New interface for editable product with services
export interface EditableProduct {
  id: number;
  product_model: ProductModel;
  product_count: number;
  production_date: string;
  warranty_status: string;
  fault_responsibility: string;
  resolution_method: string;
  has_control_unit: boolean;
  cable_check: boolean;
  profile_check: boolean;
  packaging: boolean;
  // Replace yapilan_islemler with services
  services: ServiceSelection[];
  isNew?: boolean;
}


