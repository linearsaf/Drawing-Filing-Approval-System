"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { UserAvatar } from "@/components/app/user-avatar";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { AccountProfile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { getRoleLabel } from "@/lib/utils/permissions";

export default function AccountPage() {
  const { currentUser, refetchSession } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? <AccountContent onRefreshSession={refetchSession} /> : null}
    </AuthGuard>
  );
}

function AccountContent({ onRefreshSession }: { onRefreshSession: () => Promise<void> }) {
  const { currentUser } = useDemoApp();
  const avatarInputId = useId();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<AccountProfile>("/api/account");
        if (!cancelled) {
          setProfile(response);
          setEmail(response.email);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Informasi akun belum dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const previewImage = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return profile?.image ?? currentUser?.image ?? null;
  }, [avatarFile, currentUser?.image, profile?.image]);

  const hasEmailChanged = profile ? email.trim() !== profile.email : false;

  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(previewImage ?? "");
      }
    };
  }, [avatarFile, previewImage]);

  const syncProfile = async (nextProfile: AccountProfile) => {
    setProfile(nextProfile);
    setEmail(nextProfile.email);
    setAvatarFile(null);
    await onRefreshSession();
  };

  const handleUpdateEmail = async () => {
    setIsSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const nextProfile = await apiFetch<AccountProfile>("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ email })
      });

      await syncProfile(nextProfile);
      setSuccess("Email akun berhasil diperbarui.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Email akun gagal diperbarui."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      setError("Pilih file avatar terlebih dahulu.");
      setSuccess("");
      return;
    }

    setIsSavingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.set("avatar", avatarFile);

      const nextProfile = await apiFetch<AccountProfile>("/api/account/avatar", {
        method: "POST",
        body: payload
      });

      await syncProfile(nextProfile);
      setSuccess("Avatar akun berhasil diperbarui.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Avatar akun gagal diperbarui."));
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsSavingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const nextProfile = await apiFetch<AccountProfile>("/api/account/avatar", {
        method: "DELETE"
      });

      await syncProfile(nextProfile);
      setSuccess("Avatar akun berhasil dihapus.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Avatar akun gagal dihapus."));
    } finally {
      setIsSavingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="h-56 animate-pulse bg-white/70" />
        <Card className="h-80 animate-pulse bg-white/70" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Account Settings"
        description="Kelola identitas akun, avatar, email, dan akses keamanan dari satu halaman."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              className="h-24 w-24 border-white/10 bg-white/8 text-white"
              image={previewImage}
              labelClassName="text-2xl text-white"
              name={profile.name}
              username={profile.username}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">Identity</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{profile.name}</h2>
              <p className="mt-2 text-sm text-white/78">{getRoleLabel(profile.role)}</p>
              <p className="mt-1 text-sm text-white/68">@{profile.username}</p>
              <p className="mt-1 text-sm text-white/68">{profile.email}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Account Info</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Informasi akun</h2>
          <div className="mt-5 space-y-3">
            <InfoRow label="Role" value={getRoleLabel(profile.role)} />
            <InfoRow label="Status" value={profile.isActive ? "Active" : "Inactive"} />
            <InfoRow label="Created" value={formatDateTime(profile.createdAt)} />
            <InfoRow label="Updated" value={formatDateTime(profile.updatedAt)} />
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Profile Management</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Avatar dan email</h2>

          <div className="mt-6 space-y-7">
            <div className="rounded-[28px] border border-border/75 bg-panel/18 p-4 sm:p-5">
              <label className="mb-2 block text-sm font-semibold text-text">Avatar</label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="space-y-3">
                  <UserAvatar
                    className="h-20 w-20"
                    image={previewImage}
                    labelClassName="text-xl"
                    name={profile.name}
                    username={profile.username}
                  />
                  {avatarFile ? (
                    <div className="rounded-2xl border border-brand/18 bg-brand/8 px-3 py-2 text-xs font-medium text-brand">
                      Preview avatar baru aktif sebelum disimpan.
                    </div>
                  ) : null}
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    id={avatarInputId}
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                  <label
                    className="flex cursor-pointer flex-col gap-3 rounded-[26px] border border-dashed border-brand/25 bg-brand/5 px-4 py-3 transition hover:border-brand/40 hover:bg-brand/7 sm:flex-row sm:items-center sm:justify-between"
                    htmlFor={avatarInputId}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {avatarFile ? "Avatar siap diunggah" : "Pilih avatar baru"}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {avatarFile ? avatarFile.name : "JPG, PNG, WEBP, atau SVG"}
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-text shadow-inset">
                      Choose Image
                    </span>
                  </label>
                  <p className="text-xs leading-5 text-muted">
                    Format yang didukung: JPG, PNG, WEBP, SVG. Maksimal 3 MB.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                      className="w-full sm:w-auto"
                      disabled={isSavingAvatar || !avatarFile}
                      onClick={() => void handleUploadAvatar()}
                    >
                      {isSavingAvatar ? "Menyimpan..." : "Update Avatar"}
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={isSavingAvatar || (!profile.image && !avatarFile)}
                      onClick={() => void handleRemoveAvatar()}
                      variant="secondary"
                    >
                      Remove Avatar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/75 bg-panel/18 p-4 sm:p-5">
              <label className="mb-2 block text-sm font-semibold text-text">Email</label>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <Input
                  className="min-w-0"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Masukkan email aktif"
                  type="email"
                  value={email}
                />
                <Button
                  className="w-full md:min-w-[158px]"
                  disabled={isSavingProfile || email.trim() === profile.email}
                  onClick={() => void handleUpdateEmail()}
                >
                  {isSavingProfile ? "Menyimpan..." : "Update Email"}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                {hasEmailChanged
                  ? "Perubahan email siap disimpan ke akun aktif Anda."
                  : "Gunakan email aktif yang benar-benar dipakai untuk akses akun ini."}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Security</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Password dan sesi</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Kelola password akun dan gunakan opsi revoke session bila perlu mengakhiri akses di perangkat lain.
            </p>

            <div className="mt-5 rounded-2xl border border-border/75 bg-panel/25 px-4 py-4">
              <p className="text-sm font-semibold text-text">Password settings</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Buka halaman keamanan untuk memperbarui password dan mengelola sesi aktif Anda.
              </p>
              <div className="mt-4">
                <Link href="/account/password">
                  <Button variant="secondary">Open Password Settings</Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="bg-graphite text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">Read Only</p>
            <h2 className="mt-2 text-2xl font-semibold">Info akun saat ini</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <p>Nama, username, dan role ditampilkan sebagai referensi identitas akun aktif.</p>
              <p>Perubahan role dan status akun tetap dikelola melalui kontrol administratif aplikasi.</p>
              <p>Halaman ini difokuskan untuk self-service profile dasar dan keamanan akun.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/75 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="max-w-[18rem] text-right text-sm text-muted">{value}</p>
    </div>
  );
}
