import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import MemberLayout from '../../components/member/MemberLayout';
import { UtensilsCrossed, DollarSign, TrendingUp, Wallet } from 'lucide-react';

type MemberStats = {
  totalMeals: number;
  mealCost: number;
  avgMealRate: number;
  bazarAmount: number;
};

export default function MemberDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<MemberStats>({
    totalMeals: 0,
    mealCost: 0,
    avgMealRate: 0,
    bazarAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      const memberId = (profile as any).id;
      const hostelId = (profile as any).hostel_id;

      const { data: memberMealRecords } = await supabase
        .from('meal_records')
        .select('day_meal, night_meal')
        .eq('member_id', memberId);

      const totalMeals =
        memberMealRecords?.reduce((sum, record) => {
          return sum + (record.day_meal ? 1 : 0) + (record.night_meal ? 1 : 0);
        }, 0) || 0;

      const { data: allMealRecords } = await supabase
        .from('meal_records')
        .select('day_meal, night_meal, meal_id!inner(hostel_id)')
        .eq('meal_id.hostel_id', hostelId);

      const totalHostelMeals =
        allMealRecords?.reduce((sum, record) => {
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

      const avgMealRate = totalHostelMeals > 0 ? totalBazarExpense / totalHostelMeals : 0;
      const mealCost = totalMeals * avgMealRate;

      setStats({
        totalMeals,
        mealCost,
        avgMealRate,
        bazarAmount: Number((profile as any).bazar_amount),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: UtensilsCrossed,
      label: 'Total Meals',
      value: stats.totalMeals,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: DollarSign,
      label: 'Meal Cost',
      value: `৳${stats.mealCost.toFixed(2)}`,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      label: 'Avg Meal Rate',
      value: `৳${stats.avgMealRate.toFixed(2)}`,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      icon: Wallet,
      label: 'Bazar Amount',
      value: `৳${stats.bazarAmount.toFixed(2)}`,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {(profile as any)?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Meals Consumed:</span>
              <span className="font-semibold text-gray-900">{stats.totalMeals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Meal Rate:</span>
              <span className="font-semibold text-gray-900">৳{stats.avgMealRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your Meal Cost:</span>
              <span className="font-semibold text-gray-900">৳{stats.mealCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bazar Contribution:</span>
              <span className="font-semibold text-gray-900">৳{stats.bazarAmount.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Balance:</span>
                <span
                  className={`font-bold ${
                    stats.bazarAmount - stats.mealCost >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  ৳{(stats.bazarAmount - stats.mealCost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = '/meals')}
              className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
            >
              Mark Today's Meals
            </button>
            <button
              onClick={() => (window.location.href = '/notices')}
              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
            >
              View Notices
            </button>
            <button
              onClick={() => (window.location.href = '/profile')}
              className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
