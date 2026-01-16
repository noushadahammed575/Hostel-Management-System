import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { Users, UtensilsCrossed, DollarSign, TrendingUp } from 'lucide-react';

type DashboardStats = {
  totalMembers: number;
  totalMeals: number;
  totalBazarExpense: number;
  avgMealCost: number;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalMeals: 0,
    totalBazarExpense: 0,
    avgMealCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      const hostelId = (profile as any).id;

      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('hostel_id', hostelId);

      const { data: mealRecords } = await supabase
        .from('meal_records')
        .select('day_meal, night_meal, meal_id!inner(hostel_id)')
        .eq('meal_id.hostel_id', hostelId);

      const totalMeals = mealRecords?.reduce((sum, record) => {
        return sum + (record.day_meal ? 1 : 0) + (record.night_meal ? 1 : 0);
      }, 0) || 0;

      const { data: members } = await supabase
        .from('members')
        .select('bazar_amount')
        .eq('hostel_id', hostelId);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('hostel_id', hostelId);

      const totalBazar = members?.reduce((sum, m) => sum + Number(m.bazar_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalBazarExpense = totalBazar + totalExpenses;

      const avgMealCost = totalMeals > 0 ? totalBazarExpense / totalMeals : 0;

      setStats({
        totalMembers: membersCount || 0,
        totalMeals,
        totalBazarExpense,
        avgMealCost,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'Total Members',
      value: stats.totalMembers,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: UtensilsCrossed,
      label: 'Total Meals',
      value: stats.totalMeals,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: DollarSign,
      label: 'Total Expenses',
      value: `৳${stats.totalBazarExpense.toFixed(2)}`,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      icon: TrendingUp,
      label: 'Avg Meal Cost',
      value: `৳${stats.avgMealCost.toFixed(2)}`,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {(profile as any)?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-blue-300 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg  bg-yellow-200`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/admin/members'}
              className="bg-gray-400 w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
            >
              Add New Member
            </button>
            <button
              onClick={() => window.location.href = '/admin/meals'}
              className="bg-gray-300 w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
            >
              Create Meal Chart
            </button>
            <button
              onClick={() => window.location.href = '/admin/notices'}
              className="bg-gray-200 w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
            >
              Post Notice
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-sm">
            Your hostel management system is set up and ready to use. Start by adding members and
            creating meal charts.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
