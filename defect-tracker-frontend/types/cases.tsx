// src/types/case.ts

export interface Case {
    id: number;
    arrival_date: string;
    name: string;
  
    representative: string | null;
    contact: string | null;
    address: string | null;
    note: string | null;
  
    warranty_status_photosensor: 'Valid' | 'Expired' | 'Unknown' | null;
    photosensor_height_count: number | null;
    photosensor_power_count: number | null;
  
    warranty_status_overload: 'Valid' | 'Expired' | 'Unknown' | null;
    overload_lc1_count: number | null;
  
    performed_service: string | null;
    cost: number | null;
  
    payment_details: 'Paid' | 'Unpaid' | 'Pending' | null;
    status: 'Open' | 'In Progress' | 'Closed' | null;
  
    shipping_company: string | null;
    shipping_date: string | null;
    shipping_addresses: string | null;
    shipping_information: string | null;
  
    created_at: string | null;
    updated_at: string | null;
  }
  