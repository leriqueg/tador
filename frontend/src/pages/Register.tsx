import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompactAuthFooter } from '../components/layout/AppFooter.tsx';
import { AuthHeader } from '../components/layout/MarketingHeader.tsx';
import Button from '../components/ui/Button.tsx';
import Icon from '../components/ui/Icon.tsx';
import PasswordRequirement from '../components/ui/PasswordRequirement.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import { useAuth } from '../lib/auth.tsx';
import { resolvePostAuthDestination } from '../lib/post-auth-redirect.ts';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const minLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, revísalas.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      const dest = await resolvePostAuthDestination();
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col text-on-surface font-sans relative overflow-x-hidden register-gradient">
      <AuthHeader />

      <main className="w-full max-w-md mx-auto px-md py-xl mt-16 z-10 flex-grow flex items-center">
        <div className="w-full">
          <div className="glass-card rounded-xl p-lg border border-white flex flex-col gap-lg">
            <div className="text-center space-y-xs">
              <h1 className="text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                ¡Qué bueno verte por aquí!
              </h1>
              <p className="text-on-surface-variant text-body-md">
                Empieza a organizar tu economía con claridad y calma.
              </p>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container p-md rounded-lg text-body-md">
                {error}
              </div>
            )}

            <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
              <TextInput
                label="Nombre completo"
                icon="person"
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Pérez"
              />

              <TextInput
                label="Email"
                icon="mail"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hola@ejemplo.com"
                required
              />

              <div className="flex flex-col gap-xs">
                <TextInput
                  label="Contraseña"
                  icon="lock"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <div className="flex flex-wrap gap-xs mt-xs">
                  <PasswordRequirement label="Mín. 8 caracteres" met={minLen} />
                  <PasswordRequirement label="Una mayúscula" met={hasUpper} />
                </div>
              </div>

              <TextInput
                label="Confirmar contraseña"
                icon="lock_reset"
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(confirmPassword && password !== confirmPassword)}
                required
              />

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                size="md"
                iconRight={loading ? undefined : 'arrow_forward'}
                className="mt-md shadow-lg shadow-primary/20 squishy-button"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="text-center mt-md pt-md border-t border-outline-variant/20">
              <Link
                to="/login"
                className="text-label-md text-on-surface-variant hover:text-primary transition-colors no-underline"
              >
                Ya tienes cuenta. Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="mt-lg grid grid-cols-2 gap-md">
            <div className="bg-surface-container/50 backdrop-blur-sm p-md rounded-lg flex flex-col items-center text-center gap-xs border border-white/50">
              <Icon name="security" className="text-secondary" />
              <span className="text-label-sm text-on-surface-variant">Datos cifrados y seguros</span>
            </div>
            <div className="bg-surface-container/50 backdrop-blur-sm p-md rounded-lg flex flex-col items-center text-center gap-xs border border-white/50">
              <Icon name="verified_user" className="text-secondary" />
              <span className="text-label-sm text-on-surface-variant">Control total de tus apuntes</span>
            </div>
          </div>
        </div>
      </main>

      <CompactAuthFooter />
    </div>
  );
}
