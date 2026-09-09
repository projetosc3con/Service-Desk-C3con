import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage('Senha alterada com sucesso!');
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao atualizar sua senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Senha de Acesso">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed">
          Defina uma nova senha segura para sua conta. É recomendado utilizar letras, números e caracteres especiais.
        </p>

        <Input
          type="password"
          label="Nova Senha"
          placeholder="Mínimo 6 caracteres"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading || !!successMessage}
        />

        <Input
          type="password"
          label="Confirmar Nova Senha"
          placeholder="Repita a nova senha"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading || !!successMessage}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={loading}
            disabled={!!successMessage}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Atualizar Senha
          </Button>
        </div>
      </form>
    </Modal>
  );
};
