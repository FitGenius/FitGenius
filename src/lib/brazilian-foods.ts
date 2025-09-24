// Banco de dados de alimentos brasileiros comuns
// Baseado na Tabela Brasileira de Composição de Alimentos (TACO)

export interface BrazilianFood {
  name: string;
  brand?: string;
  category: string;
  servingSize: number; // gramas
  servingUnit: string;
  // Valores por 100g
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export const BRAZILIAN_FOODS: BrazilianFood[] = [
  // GRÃOS E CEREAIS
  {
    name: 'Arroz branco cozido',
    category: 'GRAINS_CEREALS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 128,
    carbs: 26.2,
    protein: 2.5,
    fat: 0.2,
    fiber: 1.6,
    sodium: 1
  },
  {
    name: 'Arroz integral cozido',
    category: 'GRAINS_CEREALS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 124,
    carbs: 25.8,
    protein: 2.6,
    fat: 1.0,
    fiber: 2.7,
    sodium: 1
  },
  {
    name: 'Feijão preto cozido',
    category: 'LEGUMES_NUTS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 77,
    carbs: 14.0,
    protein: 4.5,
    fat: 0.5,
    fiber: 8.4,
    sodium: 2
  },
  {
    name: 'Feijão carioca cozido',
    category: 'LEGUMES_NUTS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 76,
    carbs: 13.6,
    protein: 4.8,
    fat: 0.5,
    fiber: 8.5,
    sodium: 2
  },
  {
    name: 'Macarrão cozido',
    category: 'GRAINS_CEREALS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 111,
    carbs: 23.0,
    protein: 3.4,
    fat: 0.6,
    fiber: 1.8,
    sodium: 1
  },
  {
    name: 'Pão francês',
    category: 'GRAINS_CEREALS',
    servingSize: 50,
    servingUnit: 'g',
    calories: 300,
    carbs: 58.6,
    protein: 9.4,
    fat: 3.1,
    fiber: 6.2,
    sodium: 643
  },
  {
    name: 'Pão integral',
    category: 'GRAINS_CEREALS',
    servingSize: 50,
    servingUnit: 'g',
    calories: 253,
    carbs: 43.9,
    protein: 11.3,
    fat: 3.5,
    fiber: 6.9,
    sodium: 489
  },
  {
    name: 'Aveia em flocos',
    category: 'GRAINS_CEREALS',
    servingSize: 30,
    servingUnit: 'g',
    calories: 394,
    carbs: 66.6,
    protein: 13.9,
    fat: 8.5,
    fiber: 9.1,
    sodium: 5
  },

  // PROTEÍNAS
  {
    name: 'Frango peito sem pele grelhado',
    category: 'MEAT_FISH',
    servingSize: 100,
    servingUnit: 'g',
    calories: 159,
    carbs: 0,
    protein: 32.0,
    fat: 2.9,
    sodium: 58
  },
  {
    name: 'Carne bovina (patinho) grelhada',
    category: 'MEAT_FISH',
    servingSize: 100,
    servingUnit: 'g',
    calories: 219,
    carbs: 0,
    protein: 32.2,
    fat: 9.2,
    sodium: 50
  },
  {
    name: 'Ovo de galinha cozido',
    category: 'MEAT_FISH',
    servingSize: 50,
    servingUnit: 'g',
    calories: 155,
    carbs: 0.6,
    protein: 13.0,
    fat: 10.8,
    sodium: 140
  },
  {
    name: 'Filé de tilapia grelhado',
    category: 'MEAT_FISH',
    servingSize: 100,
    servingUnit: 'g',
    calories: 96,
    carbs: 0,
    protein: 20.1,
    fat: 1.7,
    sodium: 52
  },
  {
    name: 'Salmão grelhado',
    category: 'MEAT_FISH',
    servingSize: 100,
    servingUnit: 'g',
    calories: 231,
    carbs: 0,
    protein: 24.2,
    fat: 14.2,
    sodium: 59
  },

  // LÁCTEOS
  {
    name: 'Leite integral',
    category: 'DAIRY',
    servingSize: 200,
    servingUnit: 'ml',
    calories: 61,
    carbs: 4.6,
    protein: 2.9,
    fat: 3.2,
    sodium: 40
  },
  {
    name: 'Leite desnatado',
    category: 'DAIRY',
    servingSize: 200,
    servingUnit: 'ml',
    calories: 35,
    carbs: 4.9,
    protein: 2.9,
    fat: 0.1,
    sodium: 44
  },
  {
    name: 'Iogurte natural integral',
    category: 'DAIRY',
    servingSize: 100,
    servingUnit: 'g',
    calories: 51,
    carbs: 4.0,
    protein: 4.1,
    fat: 2.5,
    sodium: 44
  },
  {
    name: 'Queijo minas frescal',
    category: 'DAIRY',
    servingSize: 30,
    servingUnit: 'g',
    calories: 264,
    carbs: 2.9,
    protein: 17.4,
    fat: 20.8,
    sodium: 346
  },

  // VEGETAIS
  {
    name: 'Brócolis cozido',
    category: 'VEGETABLES',
    servingSize: 100,
    servingUnit: 'g',
    calories: 25,
    carbs: 4.0,
    protein: 3.1,
    fat: 0.3,
    fiber: 3.4,
    sodium: 8
  },
  {
    name: 'Couve-flor cozida',
    category: 'VEGETABLES',
    servingSize: 100,
    servingUnit: 'g',
    calories: 23,
    carbs: 4.3,
    protein: 2.3,
    fat: 0.3,
    fiber: 2.5,
    sodium: 15
  },
  {
    name: 'Cenoura crua',
    category: 'VEGETABLES',
    servingSize: 100,
    servingUnit: 'g',
    calories: 32,
    carbs: 7.7,
    protein: 1.1,
    fat: 0.2,
    fiber: 3.2,
    sodium: 65
  },
  {
    name: 'Tomate cru',
    category: 'VEGETABLES',
    servingSize: 100,
    servingUnit: 'g',
    calories: 15,
    carbs: 3.1,
    protein: 1.1,
    fat: 0.2,
    fiber: 1.2,
    sodium: 4
  },
  {
    name: 'Alface americana',
    category: 'VEGETABLES',
    servingSize: 100,
    servingUnit: 'g',
    calories: 11,
    carbs: 1.8,
    protein: 1.4,
    fat: 0.2,
    fiber: 1.5,
    sodium: 10
  },

  // FRUTAS
  {
    name: 'Banana nanica',
    category: 'FRUITS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 92,
    carbs: 23.8,
    protein: 1.4,
    fat: 0.1,
    fiber: 2.0,
    sugar: 12.2,
    sodium: 1
  },
  {
    name: 'Maçã com casca',
    category: 'FRUITS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 56,
    carbs: 15.2,
    protein: 0.3,
    fat: 0.1,
    fiber: 1.3,
    sugar: 10.4,
    sodium: 1
  },
  {
    name: 'Laranja pera',
    category: 'FRUITS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 37,
    carbs: 9.1,
    protein: 0.9,
    fat: 0.1,
    fiber: 4.0,
    sugar: 7.1,
    sodium: 1
  },
  {
    name: 'Mamão formosa',
    category: 'FRUITS',
    servingSize: 100,
    servingUnit: 'g',
    calories: 45,
    carbs: 11.6,
    protein: 0.8,
    fat: 0.1,
    fiber: 1.8,
    sugar: 7.8,
    sodium: 3
  },

  // OLEAGINOSAS E CASTANHAS
  {
    name: 'Amendoim torrado',
    category: 'LEGUMES_NUTS',
    servingSize: 30,
    servingUnit: 'g',
    calories: 544,
    carbs: 20.3,
    protein: 27.2,
    fat: 43.9,
    fiber: 8.0,
    sodium: 5
  },
  {
    name: 'Castanha do Pará',
    category: 'LEGUMES_NUTS',
    servingSize: 20,
    servingUnit: 'g',
    calories: 643,
    carbs: 15.1,
    protein: 14.5,
    fat: 63.5,
    fiber: 7.9,
    sodium: 2
  },

  // ÓLEOS E GORDURAS
  {
    name: 'Óleo de soja',
    category: 'OILS_FATS',
    servingSize: 10,
    servingUnit: 'ml',
    calories: 884,
    carbs: 0,
    protein: 0,
    fat: 100,
    sodium: 0
  },
  {
    name: 'Azeite de oliva',
    category: 'OILS_FATS',
    servingSize: 10,
    servingUnit: 'ml',
    calories: 884,
    carbs: 0,
    protein: 0,
    fat: 100,
    sodium: 0
  },
  {
    name: 'Manteiga',
    category: 'OILS_FATS',
    servingSize: 10,
    servingUnit: 'g',
    calories: 760,
    carbs: 0.1,
    protein: 0.6,
    fat: 84.0,
    sodium: 579
  },

  // BEBIDAS
  {
    name: 'Água',
    category: 'BEVERAGES',
    servingSize: 200,
    servingUnit: 'ml',
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    sodium: 0
  },
  {
    name: 'Suco de laranja natural',
    category: 'BEVERAGES',
    servingSize: 200,
    servingUnit: 'ml',
    calories: 37,
    carbs: 8.7,
    protein: 0.7,
    fat: 0.1,
    sugar: 7.3,
    sodium: 1
  }
];

// Função para buscar alimentos
export function searchFoods(query: string, limit: number = 10): BrazilianFood[] {
  const lowerQuery = query.toLowerCase();
  return BRAZILIAN_FOODS
    .filter(food => food.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

// Função para buscar por categoria
export function getFoodsByCategory(category: string): BrazilianFood[] {
  return BRAZILIAN_FOODS.filter(food => food.category === category);
}

// Função para seed do banco de dados
export function getFoodsForSeed(): Omit<BrazilianFood, 'id'>[] {
  return BRAZILIAN_FOODS.map(food => ({
    ...food,
    isVerified: true,
    isPublic: true,
    createdById: null
  }));
}