import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";
import { format, addDays, subDays } from "date-fns";


const getUserData = (date: string) => {
  const username = localStorage.getItem("username");
  
  fetch(`https://pubfitnessstudio.pythonanywhere.com/get_user_nutritions?username=${username}&date=${date}`, {
    method: "GET",
  })
  .then(response => {
    if (!response.ok) {
      console.log("Bad response");
      throw new Error("Bad response");
    }
    return response.json();
  })
  .then(data => {
    const firstDate = data.reduce((earliest, current) => {
      const currentDate = new Date(current.date);
      const earliestDate = new Date(earliest.date);
      return currentDate < earliestDate ? current : earliest;
    });
    
    localStorage.setItem("lastDate", firstDate.date);
    console.log("Last Date fetched: ", firstDate.date);

    if (data.length === 50) {
      localStorage.setItem("reachedLast", "False");
    } else {
      localStorage.setItem("reachedLast", "True");
    }

    const newMeals = data.map((row: any) => {
      return {
        date: row.date,
        breakfast: row.breakfast,
        lunch: row.lunch,
        snacks: row.snacks,
        dinner: row.dinner,
        calories: row.calories,
        carbs: row.carbs,
        proteins: row.proteins,
        fats: row.fats,
        water: row.water,
      };
    });

    let savedMeals = JSON.parse(localStorage.getItem("meals") || "[]");
    savedMeals = [...newMeals, ...savedMeals];
    localStorage.setItem("meals", JSON.stringify(savedMeals));
  })
  .catch(error => {
    console.log(error.message); // Capture and display the error
    alert("Unable to get User's Data!!");
  });
};


const userData = JSON.parse(localStorage.getItem("userProfile"));
const { caloriesGoal, proteinsGoal, fatsGoal, carbsGoal } = userData;

let nutritionData = {
  calories: 0,
  proteins: 0,
  fats: 0,
  carbs: 0,
  water: 0,
  bmi: 0,
  caloriesGoal: caloriesGoal,
  proteinsGoal: proteinsGoal,
  carbsGoal: fatsGoal,
  fatsGoal: carbsGoal,
};

nutritionData['bmi'] = userData.weight / ((userData.height * userData.height) / 10000);

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const date = format(currentDate, "yyyy-MM-dd");

  const reached_last = localStorage.getItem("reachedLast");
  if(reached_last == "False"){
    const checkDate = new Date(localStorage.getItem("lastDate"));
    if (checkDate > currentDate) {
      getUserData(date);
    }
  }
  
  const savedMeals = JSON.parse(localStorage.getItem("meals") || "[]");
  
  const index = savedMeals.findIndex(item => item.date === date);

  if(index!==-1){
    nutritionData.calories = savedMeals[index].calories;
    nutritionData.proteins = savedMeals[index].proteins;
    nutritionData.carbs = savedMeals[index].carbs;
    nutritionData.fats = savedMeals[index].fats;
    nutritionData['water'] = savedMeals[index].water;
  } else {
    nutritionData.calories = 0;
    nutritionData.proteins = 0;
    nutritionData.carbs = 0;
    nutritionData.fats = 0;
    nutritionData['water'] = 0;
  }
  
  const handlePrevDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  }
  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  }

  return (
    <Layout>
      <div className="p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM d, yyyy")}
          </h2>
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Calories</h3>
            <p className="text-2xl font-bold text-primary">
              {nutritionData.calories.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">kcal</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Proteins</h3>
            <p className="text-2xl font-bold text-secondary">
              {nutritionData.proteins.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">g</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Fats</h3>
            <p className="text-2xl font-bold text-brown-500">
              {nutritionData.fats.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">g</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Carbs</h3>
            <p className="text-2xl font-bold text-purple-500">
              {nutritionData.carbs.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">g</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Water</h3>
            <p className="text-2xl font-bold text-blue-500">
              {nutritionData.water}
              <span className="text-sm font-normal text-gray-500 ml-1">Liter</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">BMI</h3>
            <p className="text-2xl font-bold text-yellow-500">
              {nutritionData.bmi.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">kg/m<sup>2</sup></span>
            </p>
          </div>

          <h2 className="flex justify-end">Nutrition</h2>
          <h2>Goals</h2>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Calories ({nutritionData.caloriesGoal} kcal)</h3>
            <p className="text-2xl font-bold text-primary">
              {((nutritionData.calories) * 100 /(nutritionData.caloriesGoal)).toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Proteins ({nutritionData.proteinsGoal} g)</h3>
            <p className="text-2xl font-bold text-secondary">
              {((nutritionData.proteins) * 100 /(nutritionData.proteinsGoal)).toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Fats ({nutritionData.fatsGoal} g)</h3>
            <p className="text-2xl font-bold text-brown-500">
              {((nutritionData.fats) * 100 /(nutritionData.fatsGoal)).toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-gray-500 mb-2">Carbs ({nutritionData.carbsGoal} g)</h3>
            <p className="text-2xl font-bold text-purple-500">
              {((nutritionData.carbs) * 100 /(nutritionData.carbsGoal)).toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;