"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  Users,
  Search,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import InviteMentorDialog from "@/components/admin/invite-mentor-dialog";
import InviteAdminDialog from "@/components/admin/invite-admin-dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserProfile = {
  id: string;

  email: string;

  role: string;

  created_at: string;

  last_sign_in_at: string | null;

  profile: any;
};

export default function AdminUsersPage() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);

  const [activeTab, setActiveTab] = useState<"students" | "mentors" | "admins">(
    "students",
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  // delete popup states
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [deleting, setDeleting] = useState(false);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token;
  }

  async function loadUsers() {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) return;

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setStudents(data.students || []);

        setMentors(data.mentors || []);

        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent() {
    if (!selectedUser) return;

    try {
      setDeleting(true);

      const token = await getToken();

      if (!token) {
        return;
      }

      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);

        return;
      }

      setDeleteOpen(false);

      setSelectedUser(null);

      await loadUsers();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const currentUsers =
    activeTab === "students"
      ? students
      : activeTab === "mentors"
        ? mentors
        : admins;

  const filteredUsers = currentUsers.filter((user) => {
    const name = user.profile?.full_name || "";

    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10">
            <Users className="h-5 w-5 text-cyan-300" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              User Management
            </h1>

            <p className="text-sm text-slate-300">
              Manage students, mentors and administrators.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-slate-100">Users</CardTitle>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-900 border-white/20 text-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              variant={activeTab === "students" ? "default" : "outline"}
              onClick={() => setActiveTab("students")}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Students
            </Button>

            <Button
              variant={activeTab === "mentors" ? "default" : "outline"}
              onClick={() => setActiveTab("mentors")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Mentors
            </Button>

            <Button
              variant={activeTab === "admins" ? "default" : "outline"}
              onClick={() => setActiveTab("admins")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admins
            </Button>
          </div>

          <div className="mb-6 flex justify-end">
            {activeTab === "mentors" && (
              <InviteMentorDialog onSuccess={loadUsers} />
            )}

            {activeTab === "admins" && (
              <InviteAdminDialog onSuccess={loadUsers} />
            )}
          </div>

          {loading ? (
            <p className="text-slate-300">Loading users...</p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-white/10 bg-slate-900/60">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {user.profile?.full_name || "No Name"}
                        </h3>

                        <p className="text-sm text-slate-400">{user.email}</p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created: {formatDate(user.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{user.role}</Badge>

                        {activeTab === "students" && user.profile && (
                          <>
                            {user.profile.primary_domain && (
                              <Badge variant="outline">
                                {user.profile.primary_domain}
                              </Badge>
                            )}

                            {user.profile.skill_level && (
                              <Badge variant="outline">
                                {user.profile.skill_level}
                              </Badge>
                            )}
                          </>
                        )}

                        {activeTab === "mentors" && user.profile && (
                          <>
                            <Badge variant="outline">
                              {user.profile.accepting_students
                                ? "Accepting Students"
                                : "Closed"}
                            </Badge>

                            <Badge variant="outline">
                              Max: {user.profile.max_students}
                            </Badge>
                          </>
                        )}

                        {activeTab === "students" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-center text-slate-400 py-10">
                  No users found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student Account?</AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {selectedUser?.profile?.full_name || "this student"}
              </span>
              ?
              <br />
              This action cannot be undone. All student data will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={deleteStudent}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
