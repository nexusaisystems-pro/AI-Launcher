import { useDesktop } from "@/contexts/desktop-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DesktopAuth() {
  const { isDesktop, authUser, openLogin, logout } = useDesktop();

  // Only show in desktop mode
  if (!isDesktop) {
    return null;
  }

  // Not authenticated - show login button
  if (!authUser) {
    return (
      <Button
        onClick={openLogin}
        variant="default"
        size="sm"
        className="gap-2"
        data-testid="button-desktop-login"
      >
        <LogIn className="h-4 w-4" />
        Sign In with Replit
      </Button>
    );
  }

  // Authenticated - show user menu
  const initials = authUser.firstName && authUser.lastName
    ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
    : authUser.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          data-testid="button-desktop-user-menu"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={authUser.profileImageUrl} alt={authUser.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block" data-testid="text-desktop-username">
            {authUser.firstName || authUser.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Desktop Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span data-testid="text-desktop-email">{authUser.email}</span>
        </DropdownMenuItem>
        {authUser.role && (
          <DropdownMenuItem disabled>
            <span className="capitalize" data-testid="text-desktop-role">{authUser.role}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={logout}
          data-testid="button-desktop-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
