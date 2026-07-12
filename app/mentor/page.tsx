"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabaseClient";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Eye,
  Search,
  Users,
} from "lucide-react";

type MentorStudent = {
  id: string;
  name: string;
  email: string;
  domain: string;
  skillLevel: string;
  skills: string[];
  avatarUrl: string | null;
  totalTasks: number;
  tasksCompleted: number;
  pendingReviews: number;
  progress: number;
  averageScore: number;
  lastActive: string | null;
};

type DashboardResponse = {
  success?: boolean;
  students: MentorStudent[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "No activity";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No activity";
  }

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
  }).format(date);
}

export default function MentorPage() {
  const [students, setStudents] = useState<
    MentorStudent[]
  >([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/mentor/dashboard",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load students"
        );
      }

      const dashboardData =
        result as DashboardResponse;

      const receivedStudents =
        Array.isArray(dashboardData.students)
          ? dashboardData.students
          : [];

      /*
       * Ensure that every student is displayed
       * only once, even if duplicate data is
       * accidentally returned by the API.
       */
      const uniqueStudentMap = new Map<
        string,
        MentorStudent
      >();

      for (const student of receivedStudents) {
        if (
          student.id &&
          !uniqueStudentMap.has(student.id)
        ) {
          uniqueStudentMap.set(
            student.id,
            student
          );
        }
      }

      setStudents(
        Array.from(uniqueStudentMap.values())
      );
    } catch (loadError) {
      console.error(
        "Mentor students loading error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load students"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return students;
    }

    return students.filter((student) => {
      const name =
        student.name?.toLowerCase() ?? "";

      const email =
        student.email?.toLowerCase() ?? "";

      const domain =
        student.domain?.toLowerCase() ?? "";

      const skillLevel =
        student.skillLevel?.toLowerCase() ??
        "";

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        domain.includes(searchValue) ||
        skillLevel.includes(searchValue)
      );
    });
  }, [search, students]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          Loading all students...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-destructive">
            {error}
          </p>

          <Button onClick={loadStudents}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          All Students
        </h1>

        <p className="mt-1 text-muted-foreground">
          View all registered students and open
          their individual progress records.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />

              All Students

              <Badge variant="secondary">
                {students.length}
              </Badge>
            </CardTitle>

            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email or domain..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Student
                  </TableHead>

                  <TableHead>
                    Domain
                  </TableHead>

                  <TableHead>
                    Skill Level
                  </TableHead>

                  <TableHead>
                    Average Score
                  </TableHead>

                  <TableHead>
                    Last Active
                  </TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.map(
                  (student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex min-w-[220px] items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {student.avatarUrl ? (
                              <AvatarImage
                                src={
                                  student.avatarUrl
                                }
                                alt={student.name}
                              />
                            ) : null}

                            <AvatarFallback>
                              {getInitials(
                                student.name ||
                                  "Student"
                              )}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-medium">
                              {student.name ||
                                "Unnamed Student"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {student.email ||
                                "Email unavailable"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {student.domain ||
                            "Not selected"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {student.skillLevel ||
                            "Not assessed"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {student.averageScore}%
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatDate(
                          student.lastActive
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                        >
                          <Link
                            href={`/mentor/students/${student.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />

                            View Progress
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}

                {filteredStudents.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {search
                        ? "No students match your search."
                        : "No students are available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}