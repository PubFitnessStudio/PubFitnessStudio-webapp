import * as XLSX from 'xlsx';

export interface FoodItem {
  food_name: string;
  energy_kcal: number;
  carb_g: number;
  protein_g: number;
  fat_g: number;
}

const fetchFoodDatabase = async (): Promise<FoodItem[]> => {
  try {
    // Fetch the Excel file from the public directory
    const response = await fetch("/data.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet contains the data
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

    // Map the JSON data to the FoodItem structure
    return jsonData.map((row) => ({
      food_name: row.food_name,
      energy_kcal: parseFloat(row.energy_kcal),
      carb_g: parseFloat(row.carb_g),
      protein_g: parseFloat(row.protein_g),
      fat_g: parseFloat(row.fat_g),
    }));
  } catch (error) {
    console.error("Error fetching food database:", error);
    return [];
  }
};

// Export the fetched food database as a Promise
export const FoodDatabase: Promise<FoodItem[]> = fetchFoodDatabase();