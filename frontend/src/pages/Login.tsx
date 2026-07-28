import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthFooter } from '../components/layout/AppFooter.tsx';
import { MinimalHeader } from '../components/layout/MarketingHeader.tsx';
import Button from '../components/ui/Button.tsx';
import Icon from '../components/ui/Icon.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import { useAuth } from '../lib/auth.tsx';
import { resolvePostAuthDestination } from '../lib/post-auth-redirect.ts';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const dest = await resolvePostAuthDestination();
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-on-surface warm-gradient">
      <MinimalHeader />

      <main className="flex-grow flex items-center justify-center px-gutter pt-20 pb-12">
        <div className="w-full max-w-[440px] bg-white rounded-lg card-shadow p-lg md:p-xl flex flex-col gap-xl border border-surface-container-high">
          <div className="flex flex-col gap-xs text-center md:text-left">
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              {t('login.title')}
            </h1>
            <p className="text-body-md text-on-surface-variant">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-md rounded-lg text-body-md">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
            <TextInput
              label={t('login.email')}
              icon="mail"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              required
            />

            <TextInput
              label={t('login.password')}
              icon="lock"
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              labelAction={
                <span className="text-label-sm text-secondary hover:text-primary transition-all cursor-pointer">
                  {t('login.forgotPassword')}
                </span>
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              }
            />

            <Button type="submit" disabled={loading} fullWidth size="lg" iconRight={loading ? undefined : 'arrow_forward'}>
              {loading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-md">
            <div className="w-full h-px bg-surface-variant" />
            <p className="text-body-md text-on-surface-variant">
              {t('login.noAccount')}{' '}
              <Link
                to="/register"
                className="text-secondary font-bold hover:text-primary hover:underline underline-offset-4 transition-all"
              >
                {t('login.register')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AuthFooter />

      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
