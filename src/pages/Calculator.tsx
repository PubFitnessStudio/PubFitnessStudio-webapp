import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { FoodDatabase, FoodItem } from "../utils/foodData";

interface MealItem extends FoodItem {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
}

const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const Calculator = () => {
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);

  //Report
  const [isExpanded, setIsExpanded] = useState(false);
  const userData = JSON.parse(localStorage.getItem("userProfile"));
  const r_height = userData.height;
  const r_weight = userData.weight;
  const r_gender = userData.gender;
  const r_age = calculateAge(userData.dob);

  const BMI_value = r_weight/(r_height*r_height/10000);
  const TBW_value = 0.6 * r_weight;
  const BMC_value = 0.04 * r_weight;

  let BMR_value, FAT_value, PM_value;

  if(r_gender === "Male"){
    BMR_value = (10*r_weight) + (6.25*r_height) - (5*r_age) + 5;
    FAT_value = (1.2*BMI_value) + (0.23*r_age) - 10.8 - 5.4;
    PM_value = 0.2 * (r_weight * (1 - FAT_value/100));
  } else {
    BMR_value = (10*r_weight) + (6.25*r_height) - (5*r_age) - 161;
    FAT_value = (1.2*BMI_value) + (0.23*r_age) - 5.4;
    PM_value = 0.2 * (r_weight * (1 - FAT_value/100));
  }

  // BMR calculator
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [result, setResult] = useState('');

  const getActivityFactor = (activity) => {
    switch (activity) {
        case 'Sedentary': return 1.2;
        case 'Lightly active': return 1.375;
        case 'Moderately active': return 1.55;
        case 'Very active': return 1.725;
        case 'Extra active': return 1.9;
        default: return 1.2;
    }
  };

  const getAdjustmentFactor = (adjustment) => {
    switch (adjustment) {
        case 'Mild weight loss': return -250;
        case 'Weight loss': return -500;
        case 'Extreme weight loss': return -1000;
        case 'Mild weight gain': return 250;
        case 'Extreme weight gain': return 500;
        default: return -250;
    }
  };

  const handleBMRSubmit = () => {
    if (!gender || !weight || !height || !age || !activity || !adjustment) {
      alert('Please fill out all fields correctly');
      return;
    }
    try {
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const ageNum = parseInt(age);

        const activityFactor = getActivityFactor(activity);
        const adjustmentFactor = getAdjustmentFactor(adjustment);

        let bmr;
        if (gender === 'Male') {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
        } else if (gender === 'Female') {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
        }

        const totalCalories = bmr * activityFactor;

        let weightGainLoss = `To maintain your weight consume '${totalCalories.toFixed(2)}' kcal. \n`;
        if (adjustmentFactor > 0) {
            weightGainLoss += `You need to consume Extra '${adjustmentFactor.toFixed(2)}' kcal to gain weight. \n`;
        } else {
            weightGainLoss += `You need to reduce your consumption by '${(-adjustmentFactor).toFixed(2)}' kcal to lose weight. \n`;
        }

        setResult(`${weightGainLoss}Your daily calorie needs to be: ${(totalCalories + adjustmentFactor).toFixed(2)} kcal`);
    } catch (error) {
        alert('Please fill out all fields correctly');
    }
  };

  // Calculator
  useEffect(() => {
    // Fetch the data when the component mounts
    FoodDatabase.then((data) => setFoodDatabase(data));
  }, []);

  const handleFoodSelect = (mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner', value: string) => {
    const selectedFood = foodDatabase.find(food => food.food_name === value);
    if (selectedFood) {
      setSelectedItems(prev => [...prev, {
        ...selectedFood,
        id: crypto.randomUUID(),
        mealType
      }]);
    }
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const getMealItems = (mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner') => {
    return selectedItems.filter(item => item.mealType === mealType);
  };

  const MealSection = ({ title, type }: { title: string; type: 'breakfast' | 'lunch' | 'snacks' | 'dinner' }) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
      <div className="relative">
        <input
          list={`${type}-list`}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Type to search food..."
          onChange={(e) => handleFoodSelect(type, e.target.value)}
        />
        <datalist id={`${type}-list`}
          className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-10"
          >
          {foodDatabase.map((food) => (
            <option key={food.food_name} value={food.food_name} />
          ))}
        </datalist>
      </div>
      
      <div className="space-y-2">
        {getMealItems(type).map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{item.food_name}</p>
              <p className="text-sm text-gray-600">
                Calories: {item.energy_kcal.toFixed(2)} kcal | Proteins: {item.protein_g.toFixed(2)}g | Carbs: {item.carb_g.toFixed(2)}g | Fats: {item.fat_g.toFixed(2)}g
              </p>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async () => {
    // Calculate totals
    console.log(selectedItems);
    if (selectedItems.length == 0) {
      alert('Please fill at least one field correctly');
      return;
    }
    const totals = selectedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.energy_kcal,
        proteins: acc.proteins + item.protein_g,
        carbs: acc.carbs + item.carb_g,
        fats: acc.fats + item.fat_g,
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    );

    // Save to localStorage
    const mealData = {
      date: new Date().toLocaleDateString('en-CA'),
      meals: selectedItems,
      water: waterIntake,
      totals,
    };

    const {calories, proteins, carbs, fats} = mealData.totals;
    const meals = mealData.meals; //'breakfast' | 'lunch' | 'snacks' | 'dinner'
    const breakfast = meals.filter(item => item.mealType === "breakfast").map(item => item.food_name).join(', ');
    const lunch = meals.filter(item => item.mealType === "lunch").map(item => item.food_name).join(', ');
    const snacks = meals.filter(item => item.mealType === "snacks").map(item => item.food_name).join(', ');
    const dinner = meals.filter(item => item.mealType === "dinner").map(item => item.food_name).join(', ');
    const upload_data = {
      date: new Date().toLocaleDateString('en-CA'),
      breakfast: breakfast,
      lunch: lunch,
      snacks: snacks,
      dinner: dinner,
      calories: calories,
      proteins: proteins,
      carbs: carbs,
      fats: fats,
      water: mealData.water
    }

    const deviceId = localStorage.getItem('deviceid');
    const username = localStorage.getItem('username');

    const userData = JSON.parse(localStorage.getItem('userProfile'));
    const goals = {
      caloriesGoal: userData.caloriesGoal,
      carbsGoal: userData.carbsGoal,
      proteinsGoal: userData.proteinsGoal,
      fatsGoal: userData.fatsGoal
    }

    try {
      console.log(JSON.stringify({
        upload_data: upload_data,
        deviceid: deviceId,
        username: username
      }));
      const response = await fetch("https://pubfitnessstudio.pythonanywhere.com/update_user_nutritions", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upload_data: upload_data,
          deviceid: deviceId,
          username: username
        }),
        });

        const data = await response.json();

        console.log(data);
        
        if (data.status === "Meal data uploaded successfully!") {
          console.log('Meal data uploaded successfully');
          alert('Meal data uploaded successfully');
        } else {
          console.error('Error uploading meal data');
          alert('Error uploading meal data');
        }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error');
    }

    const savedMeals = JSON.parse(localStorage.getItem("meals") || "[]");
    const index = savedMeals.findIndex(item => item.date === upload_data.date);

    if (index !== -1){
      savedMeals[index] = upload_data;
    } else {
      savedMeals.push(upload_data);
    }
    
    localStorage.setItem("meals", JSON.stringify(savedMeals));

    // Reset form
    setSelectedItems([]);
    setWaterIntake(0);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-8">

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Calorie Calculator
        </h1>

        <div className="space-y-8">
          <MealSection title="Breakfast" type="breakfast" />
          <MealSection title="Lunch" type="lunch" />
          <MealSection title="Snacks" type="snacks" />
          <MealSection title="Dinner" type="dinner" />
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700">Water Intake</h2>
            <input
              type="number"
              value={waterIntake}
              onChange={(e) => setWaterIntake(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter water intake in ml"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          SUBMIT MEAL DATA
        </button>

        <h1 id="report_heading" className="text-2xl font-bold text-center text-gray-800 p-3 border-2 border-black-600 rounded-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'REPORT' : 'CLICK TO VIEW REPORT'}
        </h1>
        {isExpanded && (
        <div className="space-y-8">
          <table className="min-w-full table-auto border-separate border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-gray-700 font-medium">Metric</th>
                <th className="px-6 py-3 text-left text-gray-700 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">BMI</td>
                <td className="px-6 py-4 text-gray-800" >{BMI_value.toFixed(2)} kg/m<sup>2</sup> </td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">BMR</td>
                <td className="px-6 py-4 text-gray-800">{BMR_value.toFixed(2)} Kcal/day</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">Fat %</td>
                <td className="px-6 py-4 text-gray-800">{FAT_value.toFixed(2)} %</td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">Total Body Water</td>
                <td className="px-6 py-4 text-gray-800">{TBW_value.toFixed(2)} Liter(s)</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">Protein Mass</td>
                <td className="px-6 py-4 text-gray-800">{PM_value.toFixed(2)} kg</td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-6 py-4 text-gray-800">Bone Mineral Content</td>
                <td className="px-6 py-4 text-gray-800">{BMC_value.toFixed(2)} kg</td>
              </tr>
            </tbody>
          </table>
        </div>
        )}

        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-center mb-6">BMR Calorie Calculator</h1>

          <div className="mb-4">
            <label htmlFor="gender" className="block text-lg font-semibold mb-2">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="weight" className="block text-lg font-semibold mb-2">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight (kg)"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="height" className="block text-lg font-semibold mb-2">Height (cm)</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Height (cm)"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="age" className="block text-lg font-semibold mb-2">Age (years)</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age (years)"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="activity" className="block text-lg font-semibold mb-2">Activity Level</label>
            <select
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">Select Activity Level</option>
              <option value="Sedentary">Sedentary</option>
              <option value="Lightly active">Lightly active</option>
              <option value="Moderately active">Moderately active</option>
              <option value="Very active">Very active</option>
              <option value="Extra active">Extra active</option>
            </select>
          </div>

          {/* Adjustment Select */}
          <div className="mb-4">
            <label htmlFor="adjustment" className="block text-lg font-semibold mb-2">Adjustment</label>
            <select
              id="adjustment"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">Select Adjustment Level</option>
              <option value="Mild weight loss">Mild weight loss</option>
              <option value="Weight loss">Weight loss</option>
              <option value="Extreme weight loss">Extreme weight loss</option>
              <option value="Mild weight gain">Mild weight gain</option>
              <option value="Extreme weight gain">Extreme weight gain</option>
            </select>
          </div>

          <button
            onClick={handleBMRSubmit}
            className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 mb-6"
          >
            Calculate
          </button>

          <div className="text-lg text-gray-700 mt-6">
            {result}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calculator;