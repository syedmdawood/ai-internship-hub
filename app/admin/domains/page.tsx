"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Plus, Search, MoreHorizontal, Pencil, Power } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";

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

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Domain {
  id: string;

  name: string;

  description: string | null;

  slug: string;

  is_active: boolean;

  created_at: string;
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<Domain | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token;
  };

  const loadDomains = async () => {
    try {
      const token = await getToken();

      const res = await fetch("/api/admin/domains", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const openCreate = () => {
    setEditing(null);

    setForm({
      name: "",
      description: "",
      is_active: true,
    });

    setOpen(true);
  };

  const openEdit = (domain: Domain) => {
    setEditing(domain);

    setForm({
      name: domain.name,

      description: domain.description || "",

      is_active: domain.is_active,
    });

    setOpen(true);
  };

  const saveDomain = async () => {
    const token = await getToken();

    const url = editing
      ? `/api/admin/domains/${editing.id}`
      : "/api/admin/domains";

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

      loadDomains();
    } else {
      alert(data.error);
    }
  };

  const toggleStatus = async (domain: Domain) => {
    const token = await getToken();

    await fetch(`/api/admin/domains/${domain.id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        is_active: !domain.is_active,
      }),
    });

    loadDomains();
  };

  const filteredDomains = domains.filter((domain) =>
    domain.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-5 py-6">
        <h1 className="text-2xl font-bold text-slate-100">Domain Management</h1>

        <p className="text-sm text-slate-300">
          Manage freelancing domains used for assessment and tasks.
        </p>
      </div>

      <Card className="border-white/10 bg-white/4">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <CardTitle className="text-slate-100">All Domains</CardTitle>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

                <Input
                  placeholder="Search domains"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-900 border-white/15 text-white"
                />
              </div>

              <Button
                onClick={openCreate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>

                <TableHead>Description</TableHead>

                <TableHead>Slug</TableHead>

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
                filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium text-slate-100">
                      {domain.name}
                    </TableCell>

                    <TableCell className="text-slate-300 max-w-xs truncate">
                      {domain.description || "-"}
                    </TableCell>

                    <TableCell className="text-slate-400">
                      {domain.slug}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          domain.is_active
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-red-400/10 text-red-300"
                        }
                      >
                        {domain.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => openEdit(domain)}
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => toggleStatus(domain)}
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {domain.is_active ? "Deactivate" : "Activate"}
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
            <DialogTitle>
              {editing ? "Edit Domain" : "Create Domain"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Domain name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="bg-slate-800 border-white/20"
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="bg-slate-800 border-white/20"
            />

            <div className="flex items-center justify-between">
              <span>Active</span>

              <Switch
                checked={form.is_active}
                onCheckedChange={(value) =>
                  setForm({
                    ...form,
                    is_active: value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={saveDomain}
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
