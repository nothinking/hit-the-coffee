import Link from "next/link";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";

export function GNB() {
  return (
    <nav className="w-full border-b bg-background">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">Coffee Order</span>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/shops" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2">Shops</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/register-shop" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2">Register Shop</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
} 