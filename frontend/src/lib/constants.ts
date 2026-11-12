export const PK_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
  "Hyderabad", "Gujranwala", "Sialkot", "Sargodha", "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura",
  "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat", "Sahiwal", "Wah Cantonment", "Mardan",
  "Kasur", "Okara", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kamoke", "Hafizabad", "Sadiqabad",
  "Mirpur Khas", "Burewala", "Kohat", "Khanewal", "Dera Ismail Khan", "Abbottabad", "Muzaffarabad",
  "Mirpur (AJK)", "Jhelum", "Gilgit", "Skardu", "Attock", "Vehari", "Mandi Bahauddin", "Chakwal",
  "Khushab", "Narowal", "Pakpattan", "Toba Tek Singh", "Muzaffargarh", "Layyah", "Haripur", "Mansehra",
  "Swabi", "Nowshera", "Charsadda", "Bannu", "Turbat", "Gwadar", "Khuzdar", "Thatta", "Badin", "Jacobabad",
  "Shikarpur", "Khairpur", "Dadu", "Other",
].sort((a, b) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export const SIZE_GUIDE = {
  headers: ["Size", "Chest (in)", "Waist (in)", "Hip (in)", "Length (in)"],
  rows: [
    ["XS", "32", "26", "35", "40"],
    ["S", "34", "28", "37", "41"],
    ["M", "36", "30", "39", "42"],
    ["L", "39", "33", "42", "43"],
    ["XL", "42", "36", "45", "44"],
    ["XXL", "45", "39", "48", "45"],
  ],
};
