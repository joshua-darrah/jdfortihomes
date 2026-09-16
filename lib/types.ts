export type Listing = {
  id: string;
  title: string;
  description: string;
  property_type: string;
  location: string;
  city: string;
  region: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  monthly_rent: number;
  agent_fee: number | null;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  room_type: string;
  occupants: number;
  lease_term: string;
  amenities: string[];
  image_urls: string[];
  video_urls: string[];
  video_thumbnail_urls: string[];
  contact_name: string | null;
  contact_phone: string | null;
  media_rights_confirmed: boolean;
  media_rights_note: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  is_sponsored: boolean;
  visibility_starts_at: string | null;
  visibility_ends_at: string | null;
  agent_id?: string | null;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  listing_id: string;
  preferred_date: string;
  preferred_time: string;
  base_tour_fee: number;
  discount_rate: number;
  tour_fee: number;
  agent_fee: number | null;
  platform_commission_rate: number;
  platform_commission_amount: number;
  agent_payout_amount: number;
  created_at: string;
  listing?: Pick<Listing, "title" | "location" | "city">;
};

export type Booking = {
  id: string;
  reference: string;
  listing_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  tour_fee: number;
  agent_fee: number | null;
  platform_commission_rate: number;
  platform_commission_amount: number;
  agent_payout_amount: number;
  payment_method: string;
  payment_proof_path: string | null;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  consent_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  agent_id?: string | null;
  listing?: Pick<Listing, "title" | "location" | "city">;
  items?: BookingItem[];
};


export type Ad = {
  id: string;
  ad_type: "platform_promotion" | "sponsored_property";
  listing_id: string | null;
  advertiser_name: string | null;
  advertiser_contact: string | null;
  internal_notes: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  destination_url: string | null;
  placement: string;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
  agent_id?: string | null;
};


export type Agent = {
  id: string;
  user_id: string | null;
  agent_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type AgentPayout = {
  id: string;
  booking_id: string | null;
  booking_item_id: string | null;
  agent_id: string;
  listing_id: string | null;
  ad_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  agent?: Pick<Agent, "agent_code" | "full_name">;
};
