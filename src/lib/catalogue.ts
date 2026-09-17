export type Product = {
  id: string;
  name: string;
  price: number;
};

export const catalogue: Product[] = [
  { id: "prod-001", name: "Enamel Mug", price: 12.5 },
  { id: "prod-002", name: "Canvas Tote", price: 18.0 },
  { id: "prod-003", name: "Wool Beanie", price: 22.75 },
];

