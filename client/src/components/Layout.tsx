import { Outlet, Link, NavLink } from 'react-router-dom';
import { Bot, GitBranch, ListTodo, PlusCircle, ArrowDownToLine, LogOut } from 'lucide-react';
import type { GithubUser } from '../types';

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export default function Layout({ user, onLogout }: { user: GithubUser | null; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LuwiAI</h1>
              <p className="text-xs text-gray-500">Coding Agent</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/" icon={Bot} label="Dashboard" />
          <NavItem to="/repositories" icon={GitBranch} label="Repositories" />
          <NavItem to="/jobs" icon={ListTodo} label="Jobs" />
          <NavItem to="/jobs/new" icon={PlusCircle} label="New Job" />
          <NavItem to="/install" icon={ArrowDownToLine} label="Install" />
        </nav>

        <div className="p-4 border-t border-gray-800">
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-9 h-9 rounded-full ring-2 ring-gray-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user.name || user.login}
                </p>
                <p className="text-xs text-gray-500 truncate">@{user.login}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}