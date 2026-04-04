"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, buildQuery, getErrorMessage } from "@/lib/api-client";
import { AccessRequestStatus, UserRole } from "@/lib/types";
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

interface AccessRequestItem {
  id: string;
  name: string;
  email: string;
  username: string;
  requestedRole: UserRole;
  status: AccessRequestStatus;
  adminReviewNote: string | null;
  createdAt: string;
}

const defaultForm = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: "CONSUMER" as UserRole,
  isActive: true
};

const defaultPasswordForm = {
  newPassword: "",
  confirmPassword: "",
  revokeSessions: false
};

const defaultRequestForm = {
  name: "",
  email: "",
  username: "",
  requestedRole: "CONSUMER" as UserRole,
  adminReviewNote: ""
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const [selectedRequestId, setSelectedRequestId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingRequest, setIsSavingRequest] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [form, setForm] = useState(defaultForm);
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [requestForm, setRequestForm] = useState(defaultRequestForm);

  useEffect(() => {
    let cancelled = false;

    const loadPageData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [usersResponse, requestsResponse] = await Promise.all([
          apiFetch<{ items: UserItem[] }>("/api/admin/users"),
          apiFetch<{ items: AccessRequestItem[] }>(
            `/api/admin/access-requests${buildQuery({ status: "PENDING" })}`
          )
        ]);

        if (!cancelled) {
          setUsers(usersResponse.items);
          setAccessRequests(requestsResponse.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Data user management tidak dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      [user.name, user.email, user.username, user.role]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsers = users.filter((user) => user.isActive).length;
  const selectedRequest = accessRequests.find((request) => request.id === selectedRequestId) ?? null;

  const clearUserSelection = () => {
    setEditingId(undefined);
    setForm(defaultForm);
    setPasswordForm(defaultPasswordForm);
  };

  const clearRequestSelection = () => {
    setSelectedRequestId(undefined);
    setRequestForm(defaultRequestForm);
  };

  const reloadPageData = async () => {
    const [usersResponse, requestsResponse] = await Promise.all([
      apiFetch<{ items: UserItem[] }>("/api/admin/users"),
      apiFetch<{ items: AccessRequestItem[] }>(
        `/api/admin/access-requests${buildQuery({ status: "PENDING" })}`
      )
    ]);

    setUsers(usersResponse.items);
    setAccessRequests(requestsResponse.items);

    if (selectedRequestId && !requestsResponse.items.some((item) => item.id === selectedRequestId)) {
      clearRequestSelection();
    }
  };

  const populateForm = (user: UserItem) => {
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
    setPasswordForm(defaultPasswordForm);
  };

  const populateRequestForm = (request: AccessRequestItem) => {
    setSelectedRequestId(request.id);
    setError("");
    setSuccess("");
    setRequestForm({
      name: request.name,
      email: request.email,
      username: request.username,
      requestedRole: request.requestedRole,
      adminReviewNote: request.adminReviewNote ?? ""
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
          body: JSON.stringify(form)
        });
      }

      await reloadPageData();
      clearUserSelection();
      setSuccess(editingId ? "Data user berhasil diperbarui." : "User baru berhasil dibuat.");
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
      setPasswordForm(defaultPasswordForm);
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
        body: JSON.stringify({ isActive: !user.isActive })
      });
      await reloadPageData();
      setSuccess(`Status user ${user.name} berhasil diperbarui.`);
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Status user gagal diperbarui."));
    }
  };

  const handleRequestAction = async (action: "save" | "approve" | "reject") => {
    if (!selectedRequestId) {
      setError("Pilih permintaan akses yang ingin diproses.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setIsSavingRequest(true);

    try {
      if (action === "save") {
        await apiFetch(`/api/admin/access-requests/${selectedRequestId}`, {
          method: "PATCH",
          body: JSON.stringify(requestForm)
        });
      } else {
        await apiFetch(`/api/admin/access-requests/${selectedRequestId}/${action}`, {
          method: "POST",
          body: JSON.stringify(requestForm)
        });
      }

      await reloadPageData();

      if (action !== "save") {
        clearRequestSelection();
      }

      setSuccess(
        action === "save"
          ? "Draft review permintaan akses berhasil disimpan."
          : action === "approve"
            ? "Permintaan akses disetujui. Akun user telah dibuat dan email notifikasi diproses."
            : "Permintaan akses berhasil ditolak."
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          action === "save"
            ? "Permintaan akses gagal diperbarui."
            : action === "approve"
              ? "Permintaan akses gagal disetujui."
              : "Permintaan akses gagal ditolak."
        )
      );
    } finally {
      setIsSavingRequest(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Admin"
          title="User Management"
          description="Kelola user aktif dan review Request Access user baru dari satu workspace admin."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button onClick={clearRequestSelection} variant="secondary">
                Reset Review
              </Button>
              <Button onClick={clearUserSelection} variant="secondary">
                Create User
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
            <div className="space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                    Admin Control
                  </p>
                  <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
                    Kelola akun dan evaluasi user baru dari satu panel kerja.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                    Pengajuan publik masuk ke admin sebagai request pending. Admin dapat merapikan
                    data, menentukan role final, lalu approve atau reject langsung dari panel ini.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                    Pending Requests
                  </p>
                  <p className="mt-2 text-5xl font-semibold">{accessRequests.length}</p>
                  <p className="mt-1 text-sm text-white/65">request menunggu review</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <StatCard label="Total User" value={users.length} />
                <StatCard label="Active User" value={activeUsers} />
                <StatCard label="Request Pending" value={accessRequests.length} />
              </div>
            </div>
          </Card>

          <Card className="bg-white/75">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Ringkasan kerja admin</h2>
            <div className="mt-5 space-y-3">
              <SummaryRow label="Active User" value={String(activeUsers)} />
              <SummaryRow label="Inactive User" value={String(users.length - activeUsers)} />
              <SummaryRow label="Selected Request" value={selectedRequest?.name ?? "Belum ada"} />
              <SummaryRow label="User Form Mode" value={editingId ? "Edit User" : "Create User"} />
            </div>
          </Card>
        </div>

        {error ? (
          <Card className="border-danger/15 bg-white/70">
            <p className="text-sm font-medium text-danger">{error}</p>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-brand/15 bg-white/70">
            <p className="text-sm font-medium text-brand">{success}</p>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                    Pending Access Requests
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-text">Pengajuan user baru</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Pilih request untuk review detail, menyesuaikan data, lalu approve atau reject.
                  </p>
                </div>
                <div className="rounded-full border border-border bg-panel/35 px-4 py-2 text-sm font-semibold text-text">
                  {accessRequests.length} request visible
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {isLoading ? (
                  <LoadingRows count={3} heightClass="h-32" />
                ) : accessRequests.length === 0 ? (
                  <EmptyState
                    title="Belum ada Request Access baru"
                    copy="Request Access publik yang baru masuk akan visible di panel ini."
                  />
                ) : (
                  accessRequests.map((request) => (
                    <div
                      className={`rounded-[26px] border p-4 transition ${
                        selectedRequestId === request.id
                          ? "border-brand/40 bg-brand/5"
                          : "border-border bg-white hover:border-brand/25"
                      }`}
                      key={request.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-text">{request.name}</h3>
                            <RolePill role={request.requestedRole} />
                            <AccessRequestStatusPill status={request.status} />
                          </div>
                          <p className="mt-2 text-sm text-muted">
                            {request.email} / {request.username}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                            Request received {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <Button onClick={() => populateRequestForm(request)} variant="secondary">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">User Directory</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text">Daftar pengguna</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Cari user berdasarkan nama, email, username, role, dan status aktif.
                  </p>
                </div>
                <div className="rounded-full border border-border bg-panel/35 px-4 py-2 text-sm font-semibold text-text">
                  {filteredUsers.length} user visible
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
                <Field label="Cari user">
                  <Input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nama, email, username, atau role"
                    value={search}
                  />
                </Field>
                <Field label="Role">
                  <Select
                    onChange={(event) => setRoleFilter(event.target.value as "ALL" | UserRole)}
                    value={roleFilter}
                  >
                    <option value="ALL">Semua Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")
                    }
                    value={statusFilter}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                {isLoading ? (
                  <LoadingRows count={4} heightClass="h-28" />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState
                    title="Tidak ada user yang cocok"
                    copy="Coba ubah kata kunci atau filter role dan status untuk melihat akun lain."
                  />
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      className={`rounded-[26px] border p-4 transition ${
                        editingId === user.id
                          ? "border-brand/40 bg-brand/5"
                          : "border-border bg-white hover:border-brand/25"
                      }`}
                      key={user.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-text">{user.name}</h3>
                            <RolePill role={user.role} />
                            <StatusPill isActive={user.isActive} />
                          </div>
                          <p className="mt-2 text-sm text-muted">
                            {user.email} / {user.username}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                            Updated {formatDateTime(user.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => populateForm(user)} variant="secondary">
                            Edit User
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
          </div>

          <div className="space-y-6">
            <Card className={selectedRequest ? "border-border/90" : "bg-white/75"}>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Request Review</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">
                {selectedRequest ? "Review Request Access" : "Pilih request terlebih dahulu"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {selectedRequest
                  ? "Admin dapat menyesuaikan data calon user sebelum keputusan final diambil."
                  : "Panel review akan aktif setelah Anda memilih pengajuan akses dari daftar sebelah kiri."}
              </p>

              {selectedRequest ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile label="Request Received" value={formatDateTime(selectedRequest.createdAt)} />
                    <InfoTile label="Requested Role" value={getRoleLabel(selectedRequest.requestedRole)} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nama">
                      <Input
                        onChange={(event) =>
                          setRequestForm({ ...requestForm, name: event.target.value })
                        }
                        placeholder="Nama lengkap calon user"
                        value={requestForm.name}
                      />
                    </Field>
                    <Field label="Username">
                      <Input
                        onChange={(event) =>
                          setRequestForm({ ...requestForm, username: event.target.value })
                        }
                        placeholder="Username login"
                        value={requestForm.username}
                      />
                    </Field>
                  </div>

                  <Field label="Email">
                    <Input
                      onChange={(event) => setRequestForm({ ...requestForm, email: event.target.value })}
                      placeholder="email@company.com"
                      value={requestForm.email}
                    />
                  </Field>

                  <Field label="Final Role">
                    <Select
                      onChange={(event) =>
                        setRequestForm({ ...requestForm, requestedRole: event.target.value as UserRole })
                      }
                      value={requestForm.requestedRole}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Admin Review Note">
                    <Textarea
                      onChange={(event) =>
                        setRequestForm({ ...requestForm, adminReviewNote: event.target.value })
                      }
                      placeholder="Tambahkan catatan evaluasi atau alasan keputusan admin"
                      value={requestForm.adminReviewNote}
                    />
                  </Field>

                  <div className="rounded-2xl border border-border/70 bg-panel/25 px-4 py-3">
                    <p className="text-sm font-semibold text-text">Default password saat approve</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Sistem memakai nama final tanpa spasi lalu menambahkan{" "}
                      <span className="font-semibold text-text">123!</span>.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={isSavingRequest}
                      onClick={() => void handleRequestAction("save")}
                      variant="secondary"
                    >
                      {isSavingRequest ? "Memproses..." : "Simpan Review"}
                    </Button>
                    <Button disabled={isSavingRequest} onClick={() => void handleRequestAction("approve")}>
                      {isSavingRequest ? "Memproses..." : "Approve Request"}
                    </Button>
                    <Button
                      disabled={isSavingRequest}
                      onClick={() => void handleRequestAction("reject")}
                      variant="danger"
                    >
                      {isSavingRequest ? "Memproses..." : "Reject Request"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="border-border/90">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                {editingId ? "Edit User" : "Create User"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text">
                {editingId ? "Perbarui user terpilih" : "Buat user baru"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Kelola identitas, role, dan account status dari panel yang sama.
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nama">
                    <Input
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Nama lengkap"
                      value={form.name}
                    />
                  </Field>
                  <Field label="Username">
                    <Input
                      onChange={(event) => setForm({ ...form, username: event.target.value })}
                      placeholder="Username login"
                      value={form.username}
                    />
                  </Field>
                </div>

                <Field label="Email">
                  <Input
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="email@company.com"
                    value={form.email}
                  />
                </Field>

                {!editingId ? (
                  <Field label="Password Awal">
                    <Input
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="Minimal 8 karakter"
                      type="password"
                      value={form.password}
                    />
                  </Field>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
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
                  <Field label="Account Status">
                    <Select
                      onChange={(event) => setForm({ ...form, isActive: event.target.value === "true" })}
                      value={String(form.isActive)}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void handleSubmit()}>
                  {editingId ? "Update User" : "Create User"}
                </Button>
                <Button onClick={clearUserSelection} variant="secondary">
                  Reset Form
                </Button>
              </div>
            </Card>

            <Card className={editingId ? "border-border/90" : "bg-white/75"}>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Password Reset</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">
                {editingId ? "Reset password user" : "Pilih user terlebih dahulu"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {editingId
                  ? "Gunakan panel ini saat admin perlu menetapkan password baru untuk akun terpilih."
                  : "Panel reset password akan aktif setelah Anda memilih user dari daftar sebelah kiri."}
              </p>

              {editingId ? (
                <div className="mt-5 space-y-4">
                  <Field label="Password Baru">
                    <Input
                      onChange={(event) =>
                        setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                      }
                      placeholder="Masukkan password baru"
                      type="password"
                      value={passwordForm.newPassword}
                    />
                  </Field>
                  <Field label="Konfirmasi Password Baru">
                    <Input
                      onChange={(event) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                      }
                      placeholder="Ulangi password baru"
                      type="password"
                      value={passwordForm.confirmPassword}
                    />
                  </Field>

                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-panel/20 px-4 py-3">
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
                      <p className="text-sm font-semibold text-text">Akhiri seluruh session user</p>
                      <p className="text-xs leading-5 text-muted">
                        User akan diminta login ulang di perangkat lain setelah password diganti.
                      </p>
                    </div>
                  </label>

                  <Button
                    className="w-full"
                    disabled={isSavingPassword}
                    onClick={() => void handlePasswordUpdate()}
                    variant="secondary"
                  >
                    {isSavingPassword ? "Menyimpan Password..." : "Simpan Password Baru"}
                  </Button>
                </div>
              ) : null}
            </Card>
          </div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/75 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="text-right text-sm text-muted">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-panel/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border bg-panel/20 p-6 text-center">
      <p className="text-lg font-semibold text-text">{title}</p>
      <p className="mt-2 text-sm text-muted">{copy}</p>
    </div>
  );
}

function RolePill({ role }: { role: UserRole }) {
  return (
    <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
      {getRoleLabel(role)}
    </span>
  );
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
        isActive
          ? "border-[#49605a]/20 bg-sage/12 text-[#49605a]"
          : "border-danger/20 bg-danger/8 text-danger"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function AccessRequestStatusPill({ status }: { status: AccessRequestStatus }) {
  const labelMap: Record<AccessRequestStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected"
  };

  return (
    <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
      {labelMap[status]}
    </span>
  );
}

function LoadingRows({ count, heightClass }: { count: number; heightClass: string }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className={`${heightClass} animate-pulse rounded-[26px] border border-border bg-white/70`}
          key={index}
        />
      ))}
    </div>
  );
}
