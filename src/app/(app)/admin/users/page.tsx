"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { getRoleLabel } from "@/lib/utils/permissions";

const roles: UserRole[] = ["ADMIN", "DRAFTER", "DRAFT_LEADER", "APPROVER_L1", "HEAD", "CONSUMER"];

interface UserItem {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "CONSUMER" as UserRole,
    isActive: true
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    revokeSessions: false
  });

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch<{ items: UserItem[] }>("/api/admin/users");
      setUsers(response.items);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Data user tidak dapat dimuat."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const resetForm = () => {
    setEditingId(undefined);
    setForm({
      name: "",
      email: "",
      username: "",
      password: "",
      role: "CONSUMER",
      isActive: true
    });
    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
      revokeSessions: false
    });
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await apiFetch(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            username: form.username,
            role: form.role,
            isActive: form.isActive
          })
        });
      } else {
      await apiFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            username: form.username,
            password: form.password,
            role: form.role,
            isActive: form.isActive
          })
        });
      }

      await loadUsers();
      const successMessage = editingId
        ? "Data user berhasil diperbarui."
        : "User baru berhasil dibuat.";
      resetForm();
      setSuccess(successMessage);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Data user gagal disimpan."));
    }
  };

  const handlePasswordUpdate = async () => {
    if (!editingId) {
      setError("Pilih user yang ingin diubah password-nya.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setIsSavingPassword(true);

    try {
      await apiFetch(`/api/admin/users/${editingId}/password`, {
        method: "PATCH",
        body: JSON.stringify(passwordForm)
      });

      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
        revokeSessions: false
      });
      setSuccess("Password user berhasil diperbarui.");
    } catch (passwordError) {
      setError(getErrorMessage(passwordError, "Password user gagal diperbarui."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const toggleUserActive = async (user: UserItem) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !user.isActive
        })
      });
      await loadUsers();
      setSuccess(`Status user ${user.name} berhasil diperbarui.`);
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Status user gagal diperbarui."));
    }
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Admin"
          title="User Management"
          description="Kelola data pengguna, peran, status aktif, dan password user."
        />

        {error ? (
          <Card className="border-danger/15">
            <p className="text-sm font-medium text-danger">{error}</p>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-brand/15">
            <p className="text-sm font-medium text-brand">{success}</p>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">User List</p>
            <div className="mt-5 space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted">Memuat data user...</p>
              ) : (
                users.map((user) => (
                  <div className="rounded-3xl border border-border bg-white p-4" key={user.id}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-text">{user.name}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {user.email} • {user.username}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                          {getRoleLabel(user.role)} • Updated {formatDateTime(user.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setEditingId(user.id);
                            setError("");
                            setSuccess("");
                            setForm({
                              name: user.name,
                              email: user.email,
                              username: user.username,
                              password: "",
                              role: user.role,
                              isActive: user.isActive
                            });
                            setPasswordForm({
                              newPassword: "",
                              confirmPassword: "",
                              revokeSessions: false
                            });
                          }}
                          variant="secondary"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => void toggleUserActive(user)}
                          variant={user.isActive ? "danger" : "secondary"}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
              Create / Edit User
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Nama">
                <Input
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  value={form.name}
                />
              </Field>
              <Field label="Email">
                <Input
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  value={form.email}
                />
              </Field>
              <Field label="Username">
                <Input
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  value={form.username}
                />
              </Field>
              {!editingId ? (
                <Field label="Password">
                  <Input
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    type="password"
                    value={form.password}
                  />
                </Field>
              ) : null}
              <Field label="Role">
                <Select
                  onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
                  value={form.role}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  onChange={(event) => setForm({ ...form, isActive: event.target.value === "true" })}
                  value={String(form.isActive)}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </Field>

              {editingId ? (
                <div className="rounded-3xl border border-border bg-panel/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                    Ubah Password User
                  </p>
                  <div className="mt-4 space-y-4">
                    <Field label="Password Baru">
                      <Input
                        onChange={(event) =>
                          setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                        }
                        type="password"
                        value={passwordForm.newPassword}
                      />
                    </Field>
                    <Field label="Konfirmasi Password Baru">
                      <Input
                        onChange={(event) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                        }
                        type="password"
                        value={passwordForm.confirmPassword}
                      />
                    </Field>
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3">
                      <input
                        checked={passwordForm.revokeSessions}
                        className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
                        onChange={(event) =>
                          setPasswordForm({
                            ...passwordForm,
                            revokeSessions: event.target.checked
                          })
                        }
                        type="checkbox"
                      />
                      <div>
                        <p className="text-sm font-semibold text-text">Akhiri seluruh sesi user</p>
                        <p className="text-xs text-muted">
                          User akan diminta login ulang di perangkat lain setelah password diubah.
                        </p>
                      </div>
                    </label>
                    <Button
                      disabled={isSavingPassword}
                      onClick={() => void handlePasswordUpdate()}
                      variant="secondary"
                    >
                      {isSavingPassword ? "Menyimpan Password..." : "Simpan Password Baru"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void handleSubmit()}>
                {editingId ? "Update User" : "Create User"}
              </Button>
              <Button onClick={resetForm} variant="secondary">
                Reset Form
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
      {children}
    </label>
  );
}
