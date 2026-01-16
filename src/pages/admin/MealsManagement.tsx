import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, Meal, Member } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Calendar } from 'lucide-react';

export default function MealsManagement() {
  const { profile } = useAuth();
  const [meals, setMeals] = useState<(Meal & { records?: any[] })[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingMeal, setViewingMeal] = useState<string | null>(null);
  const [mealRecords, setMealRecords] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchMeals();
      fetchMembers();
    }
  }, [profile]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('hostel_id', (profile as any).id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('hostel_id', (profile as any).id)
        .order('date', { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMealChart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: existingMeal } = await supabase
        .from('meals')
        .select('id')
        .eq('hostel_id', (profile as any).id)
        .eq('date', selectedDate)
        .maybeSingle();

      if (existingMeal) {
        alert('Meal chart already exists for this date');
        return;
      }

      const { data: newMeal, error: mealError } = await supabase
        .from('meals')
        .insert({
          hostel_id: (profile as any).id,
          date: selectedDate,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      const mealRecordsToInsert = members.map((member) => ({
        meal_id: newMeal.id,
        member_id: member.id,
        day_meal: false,
        night_meal: false,
      }));

      const { error: recordsError } = await supabase
        .from('meal_records')
        .insert(mealRecordsToInsert);

      if (recordsError) throw recordsError;

      await fetchMeals();
      setShowModal(false);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const viewMealDetails = async (mealId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .select(`
          *,
          member:members(name, email)
        `)
        .eq('meal_id', mealId);

      if (error) throw error;
      setMealRecords(data || []);
      setViewingMeal(mealId);
    } catch (error) {
      console.error('Error fetching meal records:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meals Management</h1>
          <p className="text-gray-600 mt-1">Create and manage daily meal charts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create Meal Chart
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day Meals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Night Meals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Meals
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meals.map((meal) => (
                <MealRow key={meal.id} meal={meal} onView={viewMealDetails} />
              ))}
            </tbody>
          </table>
        </div>

        {meals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No meal charts found. Create one to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create Meal Chart</h2>
            <form onSubmit={handleCreateMealChart}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Meal Details</h2>
            <div className="space-y-2">
              {mealRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{record.member.name}</p>
                    <p className="text-sm text-gray-500">{record.member.email}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Day:</span>
                      <span className={record.day_meal ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {record.day_meal ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Night:</span>
                      <span className={record.night_meal ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {record.night_meal ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setViewingMeal(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function MealRow({ meal, onView }: { meal: Meal; onView: (mealId: string) => void }) {
  const [stats, setStats] = useState({ dayMeals: 0, nightMeals: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [meal.id]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .select('day_meal, night_meal')
        .eq('meal_id', meal.id);

      if (error) throw error;

      const dayMeals = data?.filter((r) => r.day_meal).length || 0;
      const nightMeals = data?.filter((r) => r.night_meal).length || 0;

      setStats({ dayMeals, nightMeals, total: dayMeals + nightMeals });
    } catch (error) {
      console.error('Error fetching meal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <tr>
        <td colSpan={5} className="px-6 py-4 text-center">
          <div className="animate-pulse">Loading...</div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {new Date(meal.date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{stats.dayMeals}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{stats.nightMeals}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">{stats.total}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onView(meal.id)}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}
