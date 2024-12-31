import { useState } from "react";
import Layout from "../components/Layout";
import { Camera } from "lucide-react";

interface UserProfile {
  name: string;
  dob: string;
  gender: string;
  image: string;
  height: number;
  weight: number;
  caloriesGoal: number;
  proteinsGoal: number;
  carbsGoal: number;
  fatsGoal: number;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGoalEditing, setIsGoalEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
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
  });

  const userData = JSON.parse(localStorage.getItem("userProfile"));

  if(!userData){
    localStorage.setItem("userProfile", JSON.stringify(profile));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = URL.createObjectURL(file);
        setProfile((prev) => ({
          ...prev,
          image: imageUrl, //reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // Save to local storage
    localStorage.setItem("userProfile", JSON.stringify(profile));
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGoalEditing(false);
    // Save to local storage
    localStorage.setItem("userProfile", JSON.stringify(profile));
  };

  return (
    <Layout>
      <div className="p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={profile.image}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={profile.dob}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Name</h3>
                <p className="font-medium">{profile.name}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Age</h3>
                <p className="font-medium">{calculateAge(profile.dob)} years</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Gender</h3>
                <p className="font-medium">{profile.gender}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Height</h3>
                <p className="font-medium">{profile.height} cm</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Weight</h3>
                <p className="font-medium">{profile.weight} kg</p>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Goal Form */}
          {isGoalEditing ? (
            <form onSubmit={handleGoalSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calories Goal</label>
                <input
                  type="number"
                  name="caloriesGoal"
                  value={profile.caloriesGoal}
                  onChange={handleGoalInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proteins Goal</label>
                <input
                  type="number"
                  name="proteinsGoal"
                  value={profile.proteinsGoal}
                  onChange={handleGoalInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carbs Goal</label>
                <input
                  type="number"
                  name="carbsGoal"
                  value={profile.carbsGoal}
                  onChange={handleGoalInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fats Goal</label>
                <input
                  type="number"
                  name="fatsGoal"
                  value={profile.fatsGoal}
                  onChange={handleGoalInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save Goals
                </button>
                <button
                  type="button"
                  onClick={() => setIsGoalEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6">
              <h3 className="text-sm text-gray-500">Calories Goal</h3>
              <p className="font-medium">{profile.caloriesGoal} kcal</p>

              <h3 className="text-sm text-gray-500">Proteins Goal</h3>
              <p className="font-medium">{profile.proteinsGoal} g</p>

              <h3 className="text-sm text-gray-500">Carbs Goal</h3>
              <p className="font-medium">{profile.carbsGoal} g</p>

              <h3 className="text-sm text-gray-500">Fats Goal</h3>
              <p className="font-medium">{profile.fatsGoal} g</p>

              <button
                onClick={() => setIsGoalEditing(true)}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors mt-4"
              >
                Edit Goals
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
