import Link from "next/link";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { ShoppingCart } from "lucide-react";

export function GNB() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 shadow-lg border-b border-blue-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight group-hover:text-blue-100 transition-colors">
            주문취합앱
          </span>
        </Link>
        
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2 text-white hover:text-blue-100 hover:bg-white/10 rounded-lg transition-all duration-200 font-medium">
                  홈
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/quick-order" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-200 font-medium border border-orange-400 hover:border-orange-500">
                  🚀 빠른 주문
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/shops" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2 text-white hover:text-blue-100 hover:bg-white/10 rounded-lg transition-all duration-200 font-medium">
                  매장목록
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/register-shop" legacyBehavior passHref>
                <NavigationMenuLink className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium border border-white/20 hover:border-white/30">
                  매장 등록
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
} 