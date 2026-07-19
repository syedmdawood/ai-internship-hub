"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Plus, Search, MoreHorizontal, Pencil, Power } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";

interface Domain {
  id: string;

  name: string;
}

interface Question {
  id: string;

  question_text: string;

  options: string[];

  correct_answer: string;

  difficulty_level: string;

  weight: number;

  explanation: string | null;

  is_active: boolean;

  domains: {
    id: string;
    name: string;
  };
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  const [domains, setDomains] = useState<Domain[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("all");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<Question | null>(null);

  const [form, setForm] = useState({
    domain_id: "",

    question_text: "",

    options: ["", "", "", ""],

    correct_answer: "",

    difficulty_level: "medium",

    weight: 1,

    explanation: "",

    is_active: true,
  });

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token;
  };

  const loadData = async () => {
    const token = await getToken();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [questionRes, domainRes] = await Promise.all([
      fetch("/api/admin/questions", {
        headers,
      }),

      fetch("/api/admin/domains", {
        headers,
      }),
    ]);

    const questionData = await questionRes.json();

    const domainData = await domainRes.json();

    if (questionRes.ok) {
      setQuestions(questionData.questions);
    }

    if (domainRes.ok) {
      setDomains(domainData.domains);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);

    setForm({
      domain_id: "",

      question_text: "",

      options: ["", "", "", ""],

      correct_answer: "",

      difficulty_level: "medium",

      weight: 1,

      explanation: "",

      is_active: true,
    });

    setOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);

    setForm({
      domain_id: q.domains.id,

      question_text: q.question_text,

      options: q.options,

      correct_answer: q.correct_answer,

      difficulty_level: q.difficulty_level,

      weight: q.weight,

      explanation: q.explanation || "",

      is_active: q.is_active,
    });

    setOpen(true);
  };

  const saveQuestion = async () => {
    const token = await getToken();

    const url = editing
      ? `/api/admin/questions/${editing.id}`
      : "/api/admin/questions";

    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      setOpen(false);

      loadData();
    } else {
      alert(data.error);
    }
  };

  const toggleStatus = async (q: Question) => {
    const token = await getToken();

    await fetch(
      `/api/admin/questions/${q.id}`,

      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          is_active: !q.is_active,
        }),
      },
    );

    loadData();
  };

  const filteredQuestions = questions.filter((q) => {
    const matchSearch = q.question_text
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchDifficulty =
      difficulty === "all" || q.difficulty_level === difficulty;

    return matchSearch && matchDifficulty;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-5 py-6">
        <h1 className="text-2xl font-bold text-slate-100">
          Assessment Questions
        </h1>

        <p className="text-sm text-slate-300">
          Manage AI skill assessment MCQs.
        </p>
      </div>

      <Card className="border-white/10 bg-white/4">
        <CardHeader>
          <div className="flex justify-between gap-3 flex-col sm:flex-row">
            <CardTitle className="text-slate-100">All Questions</CardTitle>

            <div className="flex gap-2">
              <Input
                placeholder="Search question"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border-white/20 text-white"
              />

              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-slate-900 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All</SelectItem>

                  <SelectItem value="easy">Easy</SelectItem>

                  <SelectItem value="medium">Medium</SelectItem>

                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={openCreate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className=" h-4 w-4" />
                Add MCQ
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>

                <TableHead>Domain</TableHead>

                <TableHead>Difficulty</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-md truncate text-slate-100">
                      {q.question_text}
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {q.domains?.name}
                    </TableCell>

                    <TableCell>
                      <Badge>{q.difficulty_level}</Badge>
                    </TableCell>

                    <TableCell>
                      <Badge>{q.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" className="bg-transparent hover:bg-primary">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => openEdit(q)}
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => toggleStatus(q)}
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Toggle Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit MCQ" : "Create MCQ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={form.domain_id}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  domain_id: v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Domain" />
              </SelectTrigger>

              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Question"
              value={form.question_text}
              onChange={(e) =>
                setForm({
                  ...form,
                  question_text: e.target.value,
                })
              }
            />

            {form.options.map((o, i) => (
              <Input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={(e) => {
                  const arr = [...form.options];

                  arr[i] = e.target.value;

                  setForm({
                    ...form,
                    options: arr,
                  });
                }}
              />
            ))}

            <Input
              placeholder="Correct Answer"
              value={form.correct_answer}
              onChange={(e) =>
                setForm({
                  ...form,
                  correct_answer: e.target.value,
                })
              }
            />
          </div>

          <DialogFooter>
            <Button
              onClick={saveQuestion}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
