"use client";

import { FormSubmission } from "@/db/schema";

interface StatsCardsProps {
  submissions: FormSubmission[];
}

export default function StatsCards({ submissions }: StatsCardsProps) {
  // Calculate statistics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayCount = submissions.filter(
    (s) => new Date(s.submittedAt) >= today
  ).length;

  const weekCount = submissions.filter(
    (s) => new Date(s.submittedAt) >= weekAgo
  ).length;

  const monthCount = submissions.filter(
    (s) => new Date(s.submittedAt) >= monthAgo
  ).length;

  const totalCount = submissions.length;

  // Get unique projects
  const uniqueProjects = new Set(
    submissions.map((s) => s.jobNumber).filter(Boolean)
  );
  const projectCount = uniqueProjects.size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Submissions */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">Total Reports</h3>
          <span className="text-2xl">📊</span>
        </div>
        <div className="text-3xl font-bold">{totalCount}</div>
        <p className="text-xs opacity-75 mt-1">All time</p>
      </div>

      {/* This Month */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">This Month</h3>
          <span className="text-2xl">📅</span>
        </div>
        <div className="text-3xl font-bold">{monthCount}</div>
        <p className="text-xs opacity-75 mt-1">Last 30 days</p>
      </div>

      {/* This Week */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">This Week</h3>
          <span className="text-2xl">📆</span>
        </div>
        <div className="text-3xl font-bold">{weekCount}</div>
        <p className="text-xs opacity-75 mt-1">Last 7 days</p>
      </div>

      {/* Today */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">Today</h3>
          <span className="text-2xl">🔔</span>
        </div>
        <div className="text-3xl font-bold">{todayCount}</div>
        <p className="text-xs opacity-75 mt-1">Since midnight</p>
      </div>

      {/* Active Projects */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">Projects</h3>
          <span className="text-2xl">🏗️</span>
        </div>
        <div className="text-3xl font-bold">{projectCount}</div>
        <p className="text-xs opacity-75 mt-1">Active job sites</p>
      </div>
    </div>
  );
}
