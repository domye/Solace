import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '@/hooks';
import { LoadingButton, InputField } from '@/components';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码至少需要8个字符');
      return;
    }

    try {
      await registerMutation.mutateAsync({ username, email, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <div className="card-base card-hover-lift w-full max-w-md p-6 md:p-8 fade-in-up">
      {/* 头部 */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] mx-auto mb-4 flex items-center justify-center breathing">
          <Icon icon="material-symbols:person-add-rounded" className="text-3xl text-white" />
        </div>
        <h1 className="text-90 text-2xl font-bold">创建账户</h1>
        <p className="text-50 text-sm mt-1">立即加入我们</p>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm text-center">
          {error}
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="用户名"
          value={username}
          onChange={setUsername}
          placeholder="您的用户名"
          required
        />

        <InputField
          label="邮箱"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          required
        />

        <InputField
          label="密码"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="至少8个字符"
          required
        />

        <InputField
          label="确认密码"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="重复输入密码"
          required
        />

        <LoadingButton
          type="submit"
          loading={registerMutation.isPending}
          className="w-full py-3 bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white rounded-[var(--radius-medium)] font-medium hover:shadow-lg transition-shadow ripple"
        >
          创建账户
        </LoadingButton>
      </form>

      {/* 底部 */}
      <div className="text-center mt-6 text-50 text-sm">
        已有账户？{' '}
        <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">
          立即登录
        </Link>
      </div>
    </div>
  );
}