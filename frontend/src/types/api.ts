export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  status: string;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  status: string;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: string | number;
  sale_price?: string | number | null;
  stock_quantity: number;
  active: boolean;
  is_default: boolean;
};

export type ProductImage = {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  status?: "active" | "inactive" | "draft";
  short_description?: string | null;
  description?: string | null;
  category?: Category | null;
  brand?: Brand | null;
  primary_image?: string | null;
  images?: ProductImage[];
  default_variant?: ProductVariant | null;
  variants?: ProductVariant[];
  price?: string | number | null;
  sale_price?: string | number | null;
  stock_quantity: number;
  related_products?: Product[];
  review_count?: number | null;
  average_rating?: number | null;
  updated_at?: string;
  reviews?: {
    id: number;
    rating: number;
    content?: string | null;
    user_name?: string | null;
    created_at: string;
  }[];
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  thumbnail?: string | null;
  status?: "draft" | "published";
  post_category_id?: number | null;
  category?: PostCategory | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  updated_at?: string;
};

export type PostCategory = {
  id: number;
  name: string;
  slug: string;
  status: "active" | "inactive";
  posts_count?: number;
};

export type Page = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  seo_title?: string | null;
  seo_description?: string | null;
  updated_at?: string;
};

export type Banner = {
  id: number;
  title: string;
  image: string;
  link?: string | null;
  sort_order: number;
  active: boolean;
};

export type Menu = {
  id: number;
  parent_id?: number | null;
  label: string;
  url: string;
  type: "custom" | "page" | "category" | "post";
  sort_order: number;
  active: boolean;
};

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: "new" | "processing" | "resolved";
  admin_note?: string | null;
};

export type Setting = {
  id: number;
  key: string;
  value?: string | null;
  type: "string" | "number" | "boolean" | "json";
};

export type StockDocument = {
  id: number;
  type: "import" | "export";
  code: string;
  supplier?: string | null;
  reason?: string | null;
  note?: string | null;
  items?: {
    id: number;
    quantity: number;
    unit_cost?: string | number | null;
    variant?: ProductVariant & { product?: Product };
  }[];
  created_at: string;
};

export type InventoryMovement = {
  id: number;
  quantity_change: number;
  balance_after: number;
  reason: string;
  variant?: ProductVariant & { product?: Product };
  created_at: string;
};

export type Address = {
  id: number;
  recipient_name: string;
  phone: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  address_line: string;
  is_default: boolean;
};

export type WishlistItem = {
  id: number;
  product_id: number;
  product?: Product;
};

export type HomePayload = {
  banners: { id: number; title: string; image: string; link?: string | null }[];
  categories: Category[];
  new_products: Product[];
  best_selling_products: Product[];
  featured_products: Product[];
  latest_posts: Post[];
};

export type PaginatedMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type QuoteLine = {
  variant_id: number;
  product_id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  image?: string | null;
  unit_price: number;
  quantity: number;
  stock_quantity: number;
  subtotal: number;
};

export type CartQuote = {
  items: QuoteLine[];
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  grand_total: number;
  shipping_method?: ShippingMethod | null;
  promotion?: { id?: number; code: string; type: string } | null;
};

export type Promotion = {
  id: number;
  code: string;
  type: "fixed" | "percent";
  applies_to?: "all" | "products" | "categories" | "brands";
  value: string | number;
  min_order_amount: string | number;
  max_discount_amount?: string | number | null;
  first_order_only?: boolean;
  free_shipping?: boolean;
  min_quantity?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  active: boolean;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  used_count: number;
  usages_count?: number;
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "admin" | "manager" | "staff" | "member";
  status: "active" | "locked";
  orders_count?: number;
  created_at?: string;
};

export type AuthPayload = {
  user: User;
};

export type Order = {
  id: number;
  code: string;
  status: "pending" | "confirmed" | "shipping" | "completed" | "canceled";
  payment_status: string;
  payment_method: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_method_id?: number | null;
  shipping_method_name?: string | null;
  shipping_carrier?: string | null;
  tracking_code?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  grand_total: string | number;
  created_at: string;
  items_count?: number;
  items?: {
    id: number;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
  }[];
  histories?: {
    id: number;
    from_status?: string | null;
    to_status: string;
    note?: string | null;
    created_at: string;
  }[];
};

export type ShippingMethod = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  fee: string | number;
  base_fee?: string | number;
  free_shipping_threshold?: string | number | null;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  active?: boolean;
  sort_order?: number;
};

export type ReturnRequest = {
  id: number;
  code: string;
  reason: string;
  description?: string | null;
  status: "requested" | "approved" | "rejected" | "received" | "completed" | "canceled";
  refund_status: "none" | "pending" | "refunded" | "failed";
  admin_note?: string | null;
  order?: Order;
  items?: {
    id: number;
    quantity: number;
    reason?: string | null;
    condition_note?: string | null;
    order_item?: NonNullable<Order["items"]>[number];
  }[];
  created_at?: string;
};

export type CustomerNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
};
