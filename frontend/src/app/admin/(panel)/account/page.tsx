"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AButton, AField, AInput, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { PasswordInput, PasswordStrength } from "@/components/store/auth-ui";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";
import { changePasswordSchema, phoneSchema } from "@/lib/validation";
import { adminDemoMode } from "@/lib/admin/live";

type PwValues = z.infer<typeof changePasswordSchema>;
const profileSchema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), phone: phoneSchema.or(z.literal("")) });
type ProfileValues = z.infer<typeof profileSchema>;

export default function AdminAccountPage() {
  const router = useRouter();
  const { user, profile, role, signOut } = useAuth();
  return (
    <>
      <PageHeader title="My account" description="Your profile and login security." />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-xl font-bold uppercase text-white">{(user?.name ?? "A").slice(0, 1)}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-xs font-semibold capitalize text-emerald dark:text-[#6fb7a3]">
                <ShieldCheck className="size-3" /> {adminDemoMode ? "Demo" : role}
              </p>
            </div>
          </Card>
          <ProfileCard key={profile?.uid ?? "p"} name={profile?.name ?? user?.name ?? ""} phone={profile?.phone ?? ""} />
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold"><LogOut className="size-4 text-accent" /> Session</h3>
            <p className="mt-1 text-sm text-muted-foreground">You stay signed in on this device until you sign out. Always sign out on shared computers.</p>
            <AButton
              variant="subtle"
              className="mt-4 text-sale"
              onClick={async () => {
                await signOut();
                router.replace("/admin/login");
              }}
            >
              <LogOut /> Sign out
            </AButton>
          </Card>
        </div>
        <PasswordCard />
      </div>
    </>
  );
}

function ProfileCard({ name, phone }: { name: string; phone: string }) {
  const { updateProfile } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name, phone } });
  const submit = async (v: ProfileValues) => {
    try {
      await updateProfile({ name: v.name, phone: v.phone });
      reset(v);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><UserRound className="size-4 text-accent" /> Profile</span>} />
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 p-5 sm:grid-cols-2" noValidate>
        <AField label="Full name" htmlFor="a-name" error={errors.name?.message}><AInput id="a-name" {...register("name")} invalid={!!errors.name} /></AField>
        <AField label="Phone" htmlFor="a-phone" error={errors.phone?.message}><AInput id="a-phone" {...register("phone")} placeholder="0300 1234567" invalid={!!errors.phone} /></AField>
        <div className="sm:col-span-2"><AButton type="submit" loading={isSubmitting} disabled={!isDirty}>Save profile</AButton></div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { user, changePassword, resetPassword } = useAuth();
  const [linkSent, setLinkSent] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<PwValues>({ resolver: zodResolver(changePasswordSchema) });
  const googleOnly = !!user && !user.providers.includes("password") && user.providers.includes("google.com");

  const submit = async (v: PwValues) => {
    try {
      await changePassword(v.current, v.password);
      reset({ current: "", password: "", confirm: "" });
      toast.success(adminDemoMode ? "Password updated (demo)" : "Password changed successfully", { description: "Use your new password next time you sign in." });
    } catch (e) {
      const code = (e as { code?: string }).code;
      toast.error(code === "auth/invalid-credential" || code === "auth/wrong-password" ? "Current password is incorrect." : authErrorMessage(e));
    }
  };

  const sendLink = async () => {
    if (!user) return;
    try {
      await resetPassword(user.email);
      setLinkSent(true);
      toast.success("Email sent", { description: `Check ${user.email} for a link to set a new password.` });
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };

  return (
    <Card id="password" className="h-fit scroll-mt-24">
      <CardHeader title={<span className="flex items-center gap-2"><KeyRound className="size-4 text-accent" /> Change password</span>} description="Use at least 8 characters with letters and numbers. A strong password keeps your store safe." />
      {googleOnly ? (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">You sign in with Google, so there&apos;s no password on this account yet. We can email you a link to set one — then you can also sign in with email & password.</p>
          <AButton variant="subtle" className="mt-4" onClick={sendLink} disabled={linkSent}><Mail /> {linkSent ? "Link sent" : "Email me a link"}</AButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4 p-5" noValidate>
          <AField label="Current password" htmlFor="pw-cur" error={errors.current?.message}>
            <PasswordInput id="pw-cur" autoComplete="current-password" className="h-10 rounded-lg text-sm" invalid={!!errors.current} {...register("current")} />
          </AField>
          <AField label="New password" htmlFor="pw-new" error={errors.password?.message}>
            <PasswordInput id="pw-new" autoComplete="new-password" className="h-10 rounded-lg text-sm" invalid={!!errors.password} {...register("password")} />
            <PasswordStrength value={watch("password") ?? ""} />
          </AField>
          <AField label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm?.message}>
            <PasswordInput id="pw-confirm" autoComplete="new-password" className="h-10 rounded-lg text-sm" invalid={!!errors.confirm} {...register("confirm")} />
          </AField>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <AButton type="submit" loading={isSubmitting}><KeyRound /> Update password</AButton>
            <button type="button" onClick={sendLink} className="text-[13px] font-semibold text-accent hover:underline">Forgot current password?</button>
          </div>
        </form>
      )}
    </Card>
  );
}
