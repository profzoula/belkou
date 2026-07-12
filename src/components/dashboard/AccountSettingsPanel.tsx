import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase/client";

function displayName(user: User) {
  return (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    ""
  );
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function authProviderLabel(user: User) {
  const provider =
    (user.app_metadata?.provider as string | undefined) ??
    user.identities?.[0]?.provider ??
    "email";

  if (provider === "google") return "Google";
  if (provider === "email") return "Email et mot de passe";
  return provider;
}

function usesPasswordAuth(user: User) {
  return user.identities?.some((identity) => identity.provider === "email") ?? false;
}

type AccountSettingsPanelProps = {
  user: User;
};

export function AccountSettingsPanel({ user }: AccountSettingsPanelProps) {
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const email = user.email ?? "";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const name = displayName(user);
  const canChangePassword = usesPasswordAuth(user);

  useEffect(() => {
    setFullName(displayName(user));
  }, [user.id, user.user_metadata?.full_name, user.user_metadata?.name]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed, name: trimmed },
    });
    setSavingProfile(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profil mis à jour.");
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    toast.success("Mot de passe mis à jour.");
  };

  return (
    <section className="surface rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Paramètres du compte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre profil et vos informations de connexion.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
          <Avatar className="h-12 w-12 border border-border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
            <AvatarFallback className="bg-foreground text-background text-sm font-semibold">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name || "Étudiant"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Profil</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ce nom apparaît dans le menu, le forum et vos avis de cours.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-full-name">Nom complet</Label>
            <Input
              id="account-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Votre nom"
              autoComplete="name"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={email} readOnly disabled className="bg-muted/40" />
            <p className="text-xs text-muted-foreground">
              L&apos;email de connexion ne peut pas être modifié ici.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Méthode de connexion</Label>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-foreground">
              {authProviderLabel(user)}
            </div>
          </div>

          <Button type="submit" disabled={savingProfile || fullName.trim() === name.trim()}>
            {savingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer le profil"
            )}
          </Button>
        </form>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sécurité</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {canChangePassword
                ? "Définissez un nouveau mot de passe pour votre compte BelKou."
                : "Votre compte est connecté via un fournisseur externe."}
            </p>
          </div>

          {canChangePassword ? (
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="account-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Au moins 6 caractères"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-password-confirm">Confirmer le mot de passe</Label>
                <Input
                  id="account-password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Répétez le mot de passe"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={savingPassword || !password || !confirmPassword}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mise à jour…
                  </>
                ) : (
                  "Changer le mot de passe"
                )}
              </Button>
            </form>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              Vous vous connectez avec {authProviderLabel(user)}. Le mot de passe est géré par ce
              service.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
