// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
function simpleEncrypt(data: string, key: string): string {
  const encoded = Array.from(data).map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
  }).join('');
  
  return btoa(encoded);
}

const getUserData = async (username: string, date: string) => {
  try {
    const response = await fetch(`https://pubfitnessstudio.pythonanywhere.com/get_user_nutritions?username=${username}&date=${date}`, {
      method: "GET",
    });

    if (!response.ok) {
      console.log("Bad response");
    }

    const data = await response.json();

    const firstDate = data.reduce((earliest, current) => {
      const currentDate = new Date(current.date);
      const earliestDate = new Date(earliest.date);
      return currentDate < earliestDate ? current : earliest;
    });
    localStorage.setItem("lastDate", firstDate.date);
    console.log("Last Date fetched: ", firstDate.date);

    if(data.length==50){
      localStorage.setItem("reachedLast", "False");
    } else {
      localStorage.setItem("reachedLast", "True");
    }

    const savedMeals = data.map((row: any) => {
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

    localStorage.setItem("meals", JSON.stringify(savedMeals));
    console.log(savedMeals); // For debugging, you can remove this line later
  } catch (error) {
    console.log(error.message); // Capture and display the error
    alert("Unable to get User's Data!!");
  }
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const profile = {
    name: "PubFit",
    dob: "2000-01-01",
    gender: "Male",
    image: "/placeholder.svg",
    height: 172,
    weight: 70,
    caloriesGoal: 2500,
    proteinsGoal: 150,
    carbsGoal: 250,
    fatsGoal: 70,
  };

  const userData = JSON.parse(localStorage.getItem("userProfile"));
  if(!userData){
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation (optional)
    if (!username || !password) {
    setError("Username and password are required");
    return;
    }

    try {
        const response = await fetch("https://pubfitnessstudio.pythonanywhere.com/web_login", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            username: username,
            password: password
            }),
        });

        const data = await response.json();

        if (data.status === "Login Successful") {
            const current_date = new Date().toLocaleDateString('en-CA');
            localStorage.setItem("QwEaSdZxC", simpleEncrypt(current_date, "QwEaSdZxC"));
            localStorage.setItem("deviceid", data.deviceid);
            localStorage.setItem("username", username);


            console.log("Getting user data");
            const date = format(current_date, "yyyy-MM-dd");
            console.log(username);
            await getUserData(username, date);

            navigate("/");
            window.location.reload();
        } else {
            setError(data.message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        setError("An error occurred. Please try again later.");
        alert(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
