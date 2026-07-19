"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Domain = {
  id: string;
  name: string;
  slug: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string | null;
  skill_level: string | null;
  current_skill_level: string | null;
  recommended_domain: string | null;
  primary_domain: string | null;
  secondary_domains: any;
  last_assessment_at: string | null;
  primary_domain_id: string | null;
  secondary_domain_id: string | null;
  set_password: boolean | null;
};

export default function Setting() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfilePage();
  }, []);

  async function loadProfilePage() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Unable to load user session.");
        return;
      }

      setEmail(user.email || "");
      setProfileId(user.id);

      const [profileRes, domainsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            bio,
            avatar_url,
            role,
            skill_level,
            current_skill_level,
            recommended_domain,
            primary_domain,
            secondary_domains,
            last_assessment_at,
            primary_domain_id,
            secondary_domain_id,
            set_password
          `,
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("domains")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);

      if (domainsRes.error) {
        console.error("domains load error", domainsRes.error);
        toast.error("Failed to load domains.");
      } else {
        setDomains(domainsRes.data || []);
      }

      if (profileRes.error) {
        console.error("profile load error", profileRes.error);
        toast.error("Failed to load profile.");
        return;
      }

      const profileData = profileRes.data as ProfileRow;
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setBio(profileData.bio || "");
    } catch (error) {
      console.error("loadProfilePage error", error);
      toast.error("Something went wrong while loading the profile.");
    } finally {
      setLoading(false);
    }
  }

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [fullName]);

  const primaryDomainName = useMemo(() => {
    if (!profile) return "-";

    if (profile.primary_domain_id) {
      const match = domains.find((d) => d.id === profile.primary_domain_id);
      if (match) return match.name;
    }

    return profile.primary_domain || profile.recommended_domain || "-";
  }, [profile, domains]);

  const secondaryDomainName = useMemo(() => {
    if (!profile) return "-";

    if (profile.secondary_domain_id) {
      const match = domains.find((d) => d.id === profile.secondary_domain_id);
      if (match) return match.name;
    }

    if (
      Array.isArray(profile.secondary_domains) &&
      profile.secondary_domains.length > 0
    ) {
      return profile.secondary_domains
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (item?.name) return item.name;
          return "";
        })
        .filter(Boolean)
        .join(", ");
    }

    return "-";
  }, [profile, domains]);

  const resolvedSkillLevel =
    profile?.current_skill_level || profile?.skill_level || "-";
  const resolvedRole = profile?.role || "student";

  async function handleSaveProfile() {
    if (!profileId) {
      toast.error("User not found.");
      return;
    }

    const cleanFullName = fullName.trim();

    if (!cleanFullName) {
      toast.error("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: cleanFullName,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (error) {
        console.error("profile update error", error);
        toast.error(error.message || "Failed to update profile.");
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: cleanFullName,
              bio: bio.trim() || null,
            }
          : prev,
      );

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("handleSaveProfile error", error);
      toast.error("Something went wrong while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Optional: update your profile table
      if (profileId) {
        await supabase
          .from("profiles")
          .update({
            set_password: true,
          })
          .eq("id", profileId);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and profile details.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>


              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={resolvedRole} disabled />
                </div>
              </div>

              

             

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Keep this UI for now. We can connect it later after core project
                flow is done.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Finish profile, task recommendation, submissions, and mentor
                workflow first.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Application Preferences
              </CardTitle>
              <CardDescription>
                This can stay static for now and be wired later only if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Language and timezone are not core to FR3, so it is better not
                to spend time here yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
