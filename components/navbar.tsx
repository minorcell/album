import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from '@/components/user-menu';
import { auth } from '@/lib/auth';
import { BRAND_FULL } from '@/lib/config';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export async function Navbar() {
  const session = await auth();
  const userRole = session?.user?.role ?? 'guest';
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-base font-semibold md:text-lg"
          style={{ fontFamily: 'var(--font-brand)', letterSpacing: '0.3em' }}
        >
          <span className="text-primary uppercase">{BRAND_FULL}</span>
        </Link>

        <nav className="text-muted-foreground hidden items-center gap-3 text-sm md:flex">
          <NavbarLinks isAuthenticated={isAuthenticated} userRole={userRole} />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <UserMenu session={session!} />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">登录</Link>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-4 text-sm font-medium">
                <NavbarLinks
                  isAuthenticated={isAuthenticated}
                  userRole={userRole}
                  orientation="vertical"
                />
                {!isAuthenticated && (
                  <SheetClose asChild>
                    <Button asChild variant="outline">
                      <Link href="/login">登录</Link>
                    </Button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavbarLinks({
  isAuthenticated,
  userRole,
  orientation = 'horizontal',
}: {
  isAuthenticated: boolean;
  userRole: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  const baseClass =
    orientation === 'horizontal'
      ? 'flex items-center gap-1 transition hover:text-primary'
      : 'flex items-center gap-2 text-muted-foreground transition hover:text-primary';

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    orientation === 'vertical' ? <SheetClose asChild>{children}</SheetClose> : <>{children}</>;
  return (
    <>
      <Wrapper>
        <Link className={baseClass} href="/files">
          文件
        </Link>
      </Wrapper>
      <Wrapper>
        <Link className={baseClass} href="/">
          相册
        </Link>
      </Wrapper>
      {isAuthenticated && (
        <Wrapper>
          <Link className={baseClass} href="/profile">
            资料
          </Link>
        </Wrapper>
      )}
      {userRole === 'admin' && (
        <Wrapper>
          <Link className={baseClass} href="/admin">
            控制台
          </Link>
        </Wrapper>
      )}
      <Wrapper>
        <Link className={baseClass} href="/help">
          帮助
        </Link>
      </Wrapper>
    </>
  );
}
