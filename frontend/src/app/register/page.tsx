"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://ai-tutor-evaluator.onrender.com/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/candidate');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="glass-card p-10 rounded-3xl w-full max-w-md z-10">
        <h2 className="text-3xl font-bold text-foreground mb-2 text-center">Join Us</h2>
        <p className="text-muted-foreground text-center mb-8">Start your teaching evaluation journey.</p>
        
        {error && <div className="bg-destructive/20 text-destructive-foreground p-3 rounded-lg mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
             <label className="text-sm font-medium text-foreground">Full Name</label>
             <div className="relative">
               <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
               <input 
                 type="text" 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                 placeholder="John Doe"
                 required
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="teacher@example.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-foreground">Role</label>
             <select 
               value={role} 
               onChange={e => setRole(e.target.value)}
               className="w-full bg-card border border-border rounded-xl py-3 px-4 text-foreground hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:bg-secondary"
             >
               <option value="CANDIDATE">Tutor Candidate</option>
               <option value="ADMIN">Administrator</option>
             </select>
          </div>
          
          <button type="submit" className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 group transition-all mt-6">
            Create Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
