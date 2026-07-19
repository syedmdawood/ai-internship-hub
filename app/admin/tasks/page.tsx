"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Plus, Search, MoreHorizontal, Pencil, Power, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Switch } from "@/components/ui/switch";

type Domain = {
  id: string;

  name: string;
};

type Task = {
  id: string;

  title: string;

  description: string;

  difficulty_level: string;

  estimated_minutes: number;

  tags: string[];

  deliverable_type: string;

  evaluation_type: string;

  evaluation_criteria: any;

  is_active: boolean;

  domains: {
    id: string;
    name: string;
  };
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [domains, setDomains] = useState<Domain[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [domainFilter, setDomainFilter] = useState("all");

  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "",

    description: "",

    domain_id: "",

    difficulty_level: "medium",

    estimated_minutes: 60,

    tags: [] as string[],

    deliverable_type: "general",

    evaluation_type: "general",

    evaluation_criteria: {
      correctness: 0,

      quality: 0,

      structure: 0,
    },

    instructions: "",

    is_active: true,
  });

  const [tagInput, setTagInput] = useState("");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token;
  };

  const loadData = async () => {
    const token = await getToken();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [taskRes, domainRes] = await Promise.all([
      fetch("/api/admin/tasks", {
        headers,
      }),

      fetch("/api/admin/domains", {
        headers,
      }),
    ]);

    const taskData = await taskRes.json();

    const domainData = await domainRes.json();

    if (taskRes.ok) {
      setTasks(taskData.tasks);
    }

    if (domainRes.ok) {
      setDomains(domainData.domains);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",

      description: "",

      domain_id: "",

      difficulty_level: "medium",

      estimated_minutes: 60,

      tags: [],

      deliverable_type: "general",

      evaluation_type: "general",

      evaluation_criteria: {
        correctness: 0,

        quality: 0,

        structure: 0,
      },

      instructions: "",

      is_active: true,
    });

    setTagInput("");
  };

  const openCreate = () => {
    setEditing(null);

    resetForm();

    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);

    setForm({
      title: task.title,

      description: task.description,

      domain_id: task.domains.id,

      difficulty_level: task.difficulty_level,

      estimated_minutes: task.estimated_minutes,

      tags: task.tags || [],

      deliverable_type: task.deliverable_type,

      evaluation_type: task.evaluation_type,

      evaluation_criteria: task.evaluation_criteria || {},

      instructions: "",

      is_active: task.is_active,
    });

    setOpen(true);
  };

  function addTag() {
    const value = tagInput.trim();

    if (!value) return;

    setForm({
      ...form,

      tags: [...form.tags, value],
    });

    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm({
      ...form,

      tags: form.tags.filter((t) => t !== tag),
    });
  }

  const saveTask = async () => {
    const token = await getToken();

    const url = editing ? `/api/admin/tasks/${editing.id}` : "/api/admin/tasks";

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

  const toggleStatus = async (task: Task) => {
    const token = await getToken();

    await fetch(
      `/api/admin/tasks/${task.id}`,

      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          is_active: !task.is_active,
        }),
      },
    );

    loadData();
  };

  const filteredTasks = tasks.filter((task) => {
    const searchMatch = task.title.toLowerCase().includes(search.toLowerCase());

    const domainMatch =
      domainFilter === "all" || task.domains.id === domainFilter;

    const difficultyMatch =
      difficultyFilter === "all" || task.difficulty_level === difficultyFilter;

    return searchMatch && domainMatch && difficultyMatch;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-5 py-6">
        <h1 className="text-2xl font-bold text-slate-100">Task Management</h1>

        <p className="text-sm text-slate-300">
          Create and manage internship tasks for students.
        </p>
      </div>

      <Card className="border-white/10 bg-white/4">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-slate-100">All Tasks</CardTitle>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

                <Input
                  placeholder="Search task"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-900 border-white/20 text-white"
                />
              </div>

              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="bg-slate-900 text-white border-white/20">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>

                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={difficultyFilter}
                onValueChange={setDifficultyFilter}
              >
                <SelectTrigger className="bg-slate-900 text-white border-white/20">
                  <SelectValue placeholder="Difficulty" />
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
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>

                <TableHead>Domain</TableHead>

                <TableHead>Difficulty</TableHead>

                <TableHead>Deliverable</TableHead>

                <TableHead>Evaluation</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading...</TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-slate-100 font-medium">
                      {task.title}
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {task.domains?.name}
                    </TableCell>

                    <TableCell>
                      <Badge>{task.difficulty_level}</Badge>
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {task.deliverable_type}
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {task.evaluation_type}
                    </TableCell>

                    <TableCell>
                      <Badge>{task.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            className="bg-transparent hover:bg-primary"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => openEdit(task)}
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => toggleStatus(task)}
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
        <DialogContent className="bg-slate-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />

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
              placeholder="Task description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <Textarea
              placeholder="Instructions"
              value={form.instructions}
              onChange={(e) =>
                setForm({
                  ...form,
                  instructions: e.target.value,
                })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.difficulty_level}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    difficulty_level: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>

                  <SelectItem value="medium">Medium</SelectItem>

                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Minutes"
                value={form.estimated_minutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_minutes: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <p className="mb-2 text-sm">Tags</p>

              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />

                <Button type="button" onClick={addTag}>
                  Add
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} className="flex gap-1">
                    {tag}

                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Select
              value={form.deliverable_type}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  deliverable_type: v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Deliverable Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="github">GitHub / Code</SelectItem>

                <SelectItem value="figma">Figma</SelectItem>

                <SelectItem value="document">Document</SelectItem>

                <SelectItem value="text">Text</SelectItem>

                <SelectItem value="image">Image</SelectItem>

                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={form.evaluation_type}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  evaluation_type: v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Evaluation Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="code">Code Evaluation</SelectItem>

                <SelectItem value="writing">Writing Evaluation</SelectItem>

                <SelectItem value="design">Design Evaluation</SelectItem>

                <SelectItem value="general">General Evaluation</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-3">
              <p className="text-sm">Evaluation Criteria</p>

              <Input
                placeholder="Correctness %"
                value={form.evaluation_criteria.correctness}
                onChange={(e) =>
                  setForm({
                    ...form,

                    evaluation_criteria: {
                      ...form.evaluation_criteria,

                      correctness: Number(e.target.value),
                    },
                  })
                }
              />

              <Input
                placeholder="Quality %"
                value={form.evaluation_criteria.quality}
                onChange={(e) =>
                  setForm({
                    ...form,

                    evaluation_criteria: {
                      ...form.evaluation_criteria,

                      quality: Number(e.target.value),
                    },
                  })
                }
              />

              <Input
                placeholder="Structure %"
                value={form.evaluation_criteria.structure}
                onChange={(e) =>
                  setForm({
                    ...form,

                    evaluation_criteria: {
                      ...form.evaluation_criteria,

                      structure: Number(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Active</span>

              <Switch
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,

                    is_active: v,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={saveTask}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
