const lockers = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,                 // 🔥 CHANGED (numeric ID)
  size: "Standard",
  price: 70
}));
