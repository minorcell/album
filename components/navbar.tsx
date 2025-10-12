import Link from "next/link"

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export async function Navbar() {
  const session = await auth()
  const userRole = session?.user?.role ?? "guest"
  const isAuthenticated = Boolean(session?.user)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-base font-semibold md:text-lg"
          style={{ fontFamily: "var(--font-brand)", letterSpacing: "0.3em" }}
        >
          <span className="uppercase text-primary">CODEPAINT STUDIO ALBUM</span>
        </Link>

        <nav className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
          <NavbarLinks isAuthenticated={isAuthenticated} userRole={userRole} />
        </nav>

        <div className="flex items-center gap-2">
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
  )
}

function NavbarLinks({
  isAuthenticated,
  userRole,
  orientation = "horizontal",
}: {
  isAuthenticated: boolean
  userRole: string
  orientation?: "horizontal" | "vertical"
}) {
  const baseClass =
    orientation === "horizontal"
      ? "flex items-center gap-1 transition hover:text-primary"
      : "flex items-center gap-2 text-muted-foreground transition hover:text-primary"

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    orientation === "vertical" ? (
      <SheetClose asChild>{children}</SheetClose>
    ) : (
      <>{children}</>
    )
  return (
    <>
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
      {userRole === "admin" && (
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
  )
}
