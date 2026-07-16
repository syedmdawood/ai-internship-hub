"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Users, ListTodo, CheckCircle, TrendingUp, Award } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type ReportData = {
  overview: {
    students: number;
    mentors: number;
    totalTasks: number;
    completedTasks: number;
    averageScore: number;
    averageMentorScore: number;
  };

  taskStatus: {
    name: string;
    value: number;
  }[];

  domainPerformance: {
    domain: string;
    averageScore: number;
  }[];

  studentRanking: {
    name: string;
    completedTasks: number;
    averageScore: number;
    domain: string;
  }[];

  improvementTrend: {
    month: string;
    score: number;
  }[];
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        return;
      }

      const res = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        console.log(result.error);
      }
    } catch (error) {
      console.error("Reports error", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-300">Loading reports...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-400">Failed to load reports.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div
        className="
        rounded-2xl
        border border-white/10
        bg-linear-to-r
        from-slate-900/95
        via-slate-900/85
        to-cyan-900/35
        px-5 py-6
      "
      >
        <h1
          className="
          text-2xl
          font-bold
          text-slate-100
        "
        >
          Reports & Analytics
        </h1>

        <p
          className="
          text-sm
          text-slate-300
          mt-1
        "
        >
          Student progress tracking and platform performance insights.
        </p>
      </div>

      {/* Summary Cards */}

      <div
        className="
        grid
        gap-4
        sm:grid-cols-2
        lg:grid-cols-5
      "
      >
        <StatsCard
          title="Students"
          value={data.overview.students}
          icon={<Users />}
        />

        <StatsCard
          title="Total Tasks"
          value={data.overview.totalTasks}
          icon={<ListTodo />}
        />

        <StatsCard
          title="Completed"
          value={data.overview.completedTasks}
          icon={<CheckCircle />}
        />

        <StatsCard
          title="AI Score"
          value={`${data.overview.averageScore}%`}
          icon={<TrendingUp />}
        />

        <StatsCard
          title="Mentor Score"
          value={`${data.overview.averageMentorScore}%`}
          icon={<Award />}
        />
      </div>

      {/* Charts */}

      <div
        className="
        grid
        gap-6
        lg:grid-cols-2
      "
      >
        {/* Task Status */}

        <Card
          className="
          border-white/10
          bg-white/5
        "
        >
          <CardHeader>
            <CardTitle className="text-slate-100">
              Task Completion Status
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.taskStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                  >
                    {data.taskStatus.map((_, index) => (
                      <Cell key={index} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Domain Performance */}

        <Card
          className="
          border-white/10
          bg-white/5
        "
        >
          <CardHeader>
            <CardTitle className="text-slate-100">Domain Performance</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.domainPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="domain" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="averageScore" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Trend */}

      <Card
        className="
        border-white/10
        bg-white/5
      "
      >
        <CardHeader>
          <CardTitle className="text-slate-100">
            Skill Improvement Trend
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.improvementTrend}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Line dataKey="score" name="AI Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}

      <Card
        className="
        border-white/10
        bg-white/5
      "
      >
        <CardHeader>
          <CardTitle className="text-slate-100">
            Top Student Performance
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {data.studentRanking.map((student, index) => (
              <div
                key={index}
                className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    rounded-xl
                    bg-slate-900/60
                    p-4
                  "
              >
                <div>
                  <p
                    className="
                      font-semibold
                      text-slate-100
                    "
                  >
                    #{index + 1} {student.name}
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-400
                    "
                  >
                    {student.domain}
                  </p>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  <Badge>Tasks: {student.completedTasks}</Badge>

                  <Badge variant="outline">
                    Score: {student.averageScore}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <Card
      className="
border-white/10
bg-white/5
"
    >
      <CardContent
        className="
p-5
flex
items-center
justify-between
"
      >
        <div>
          <p
            className="
text-sm
text-slate-400
"
          >
            {title}
          </p>

          <p
            className="
text-2xl
font-bold
text-slate-100
"
          >
            {value}
          </p>
        </div>

        <div
          className="
text-cyan-300
"
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
