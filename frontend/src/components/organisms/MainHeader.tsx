import MainHeaderClient from './MainHeaderClient';

interface MainHeaderProps {
  user: any;
}

export default function MainHeader({ user }: MainHeaderProps) {
  return (
    <header className="h-16 bg-primary-purple text-white">
      <MainHeaderClient user={user} />
    </header>
  );
}