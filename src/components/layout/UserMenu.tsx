
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const getInitials = () => {
    const first = profile?.first_name || '';
    const last = profile?.last_name || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Usuário';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-notion-gray-100 transition-notion">
          <Avatar className="h-8 w-8 bg-notion-gray-200">
            <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
            <AvatarFallback className="bg-notion-gray-200 text-notion-gray-700 text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border-notion-gray-200 shadow-notion-lg" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-notion-body-sm font-medium text-notion-gray-900">{getDisplayName()}</p>
            <p className="text-notion-caption text-notion-gray-600">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-notion-gray-200" />
        <DropdownMenuItem
          className="cursor-pointer hover:bg-notion-gray-100 transition-notion text-notion-gray-700"
          onClick={() => navigate('/profile')}
        >
          <span className="material-icons mr-2 text-sm">person</span>
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-notion-gray-200" />
        <DropdownMenuItem
          className="cursor-pointer text-notion-danger hover:bg-notion-danger-light transition-notion"
          onClick={handleSignOut}
        >
          <span className="material-icons mr-2 text-sm">logout</span>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
