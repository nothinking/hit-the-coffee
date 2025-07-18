import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Clock, Share2, Smartphone, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <ShoppingCart className="w-4 h-4 mr-2" />
            주문 취합 서비스
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            함께 주문하면
            <span className="text-blue-600 block">더 즐겁고 편리해요</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            매장 등록 없이도 메뉴판만 촬영하면 바로 주문 링크를 생성할 수 있는 
            실시간 주문 취합 서비스입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/quick-order">
                🚀 빠른 주문 링크 생성
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register-shop">
                매장 등록하기
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register-menu">
                메뉴판 등록
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/shops">
                매장 둘러보기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            왜 주문취합앱을 선택해야 할까요?
          </h2>
          <p className="text-lg text-gray-600">
            간단하고 직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>실시간 협업</CardTitle>
              <CardDescription>
                팀원들이 동시에 주문에 참여하고 실시간으로 업데이트되는 주문 현황을 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>타이머 기능</CardTitle>
              <CardDescription>
                주문 마감 시간을 설정하여 정해진 시간까지 주문을 받고 자동으로 마감됩니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>간편한 공유</CardTitle>
              <CardDescription>
                링크 하나로 주문 세션을 공유하여 팀원들이 쉽게 참여할 수 있습니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>모바일 최적화</CardTitle>
              <CardDescription>
                모든 디바이스에서 완벽하게 작동하는 반응형 디자인으로 언제 어디서나 사용 가능합니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>빠른 설정</CardTitle>
              <CardDescription>
                몇 번의 클릭만으로 매장과 메뉴를 등록하고 바로 주문을 시작할 수 있습니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>메뉴 관리</CardTitle>
              <CardDescription>
                커스텀 메뉴를 등록하고 관리하여 원하는 메뉴로 주문을 받을 수 있습니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            사용 방법
          </h2>
          <p className="text-lg text-gray-600">
            3단계로 간단하게 주문을 시작하세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">매장 등록</h3>
            <p className="text-gray-600">
              매장 정보와 메뉴를 등록하여 주문을 받을 준비를 합니다
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">주문 세션 생성</h3>
            <p className="text-gray-600">
              새로운 주문을 시작하고 팀원들과 공유할 링크를 생성합니다
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">실시간 주문</h3>
            <p className="text-gray-600">
              팀원들이 링크를 통해 참여하여 실시간으로 주문을 취합합니다
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            복잡한 주문 취합 과정을 간단하게 만들어드립니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/quick-order">
                🚀 빠른 주문 링크 생성
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register-shop">
                매장 등록하기
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register-menu">
                메뉴판 등록
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 주문취합앱. 모든 권리 보유.
          </p>
        </div>
      </footer>
    </div>
  );
} 