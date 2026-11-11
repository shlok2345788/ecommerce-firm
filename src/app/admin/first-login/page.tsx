'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, AlertCircle, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validatePasswordStrength } from '@/lib/registrationValidators';

export default function FirstLoginPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = validatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!strength.valid) {
      setError(`Password requirements not met: ${strength.errors.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-200/90 shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-3 shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg">First-Time Password Setup</CardTitle>
          <CardDescription className="text-xs">
            As a newly approved store administrator, you must define a confidential password before accessing your store console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">
                Temporary Password Received via Email
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Temporary password from approval email"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">
                New Confidential Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                className="text-xs"
              />

              {/* Password Requirements Live Checklist */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md mt-2 space-y-1.5 text-[11px]">
                <p className="font-semibold text-zinc-600 mb-1">Password Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div className={`flex items-center gap-1.5 ${strength.rules.minLength ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {strength.rules.minLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.rules.hasUppercase ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {strength.rules.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.rules.hasLowercase ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {strength.rules.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.rules.hasNumber ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {strength.rules.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>One number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 sm:col-span-2 ${strength.rules.hasSpecial ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {strength.rules.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>One special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="text-xs"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !strength.valid || newPassword !== confirmPassword}
              className="w-full text-xs font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Activating Account...
                </>
              ) : (
                <>
                  Set Password & Access Console <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
