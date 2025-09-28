import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/ProjectCard";
import BlogCard from "@/components/BlogCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Shield, Users, Award } from "lucide-react";
import Link from "next/link";
import { mockProperties, mockProjects, blogPosts } from "@/lib/mockData";
import Image from "next/image";

export default function Home() {
  // Filter featured properties
  const featuredProperties = mockProperties.slice(0, 6);
  const featuredProjects = mockProjects.slice(0, 3);
  const latestBlogPosts = blogPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />

      {/* Current Listings Banner */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-gray-700">
              <span className="font-semibold">הזנו לדירה עכשיו בבנק הפועלים</span>
              {" - "}
              אישור עקרוני אונליין לכבור רכישת חופי ומשכנתא בהתאמה אישית כמו שלא ראיתם עדיין!
            </p>
            <Button variant="link" className="text-primary mt-2">
              לקבלת הצעה ←
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">נכסים מומלצים</h2>
              <p className="text-muted-foreground">
                מבחר נכסים איכותיים שנבחרו במיוחד עבורכם
              </p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="hidden md:flex">
                לכל המודעות בתל אביב יפו
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/properties">
              <Button variant="outline">
                לכל המודעות
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New Projects Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">דירות ופרויקטים חדשים</h2>
              <p className="text-muted-foreground">
                היו הראשונים לרכוש דירה בפרויקטים החדשים והמבוקשים
              </p>
            </div>
            <Link href="/projects">
              <Button variant="outline" className="hidden md:flex">
                לכל הדירות החדשות
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/projects">
              <Button variant="outline">
                לכל הפרויקטים
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">הכניסה החופשית ביותר</h2>
            <p className="text-muted-foreground">
              חכמים ממחלקת המחקר של מדלן
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center">
              <Image
                src="https://ext.same-assets.com/3745260647/1599116769.false"
                alt="פרק ג׳ לוחר רוכש דירה ירון"
                width={200}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-lg mb-2">
                פרק ג׳ לוחר רוכש דירה ירון
              </h3>
            </div>

            <div className="bg-white rounded-lg p-6 text-center">
              <Image
                src="https://ext.same-assets.com/3745260647/998198623.false"
                alt="יד אליהו: השכונה הדרוקה והכמה משכונות פועלים למוקד משיכה בעיר לעשפחות צעירות"
                width={200}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-lg mb-2">
                יד אליהו: השכונה החמה
              </h3>
            </div>

            <div className="bg-white rounded-lg p-6 text-center">
              <Image
                src="https://ext.same-assets.com/3745260647/1974825054.false"
                alt="פרק תמישי: נסיחוי של משקיעי נדל״ן מתחילים | אורית: המאי אוהד דוסט"
                width={200}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-lg mb-2">
                פרק חמישי: טעויות של משקיעי נדל״ן
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Madad Section */}
      <section className="py-16 bg-teal-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">מדד המחזוכים של מדלן 2024/25</h2>
              <p className="text-xl mb-6 opacity-90">
                מחפשים מחזון ולא זוכרים למי לפנות? מדד המחזוכים של מדלן יעזור לכם לבחור
                מחוזן מנכלי להצטער. ודרוג אמון ואובייקטיבי של משרדי תיווך בכל הארץ,
                המעליים ביותר מידע שהיו את מתהרדות.
              </p>
              <Button className="bg-white text-teal-700 hover:bg-gray-100">
                לצפייה במוצאות הדירוג לשנת 2024/25 ←
              </Button>
            </div>
            <div className="hidden lg:block">
              <div className="bg-yellow-400 rounded-full p-8">
                <div className="text-teal-700 text-center">
                  <div className="text-2xl font-bold">TOP 10</div>
                  <div className="text-sm">2024/25</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">בלוג מדלן</h2>
              <p className="text-muted-foreground">
                כתבות, מדריכים וטיפים לקונים ומוכרים
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="hidden md:flex">
                לכל הכתבות
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestBlogPosts.map((post) => (
              <BlogCard key={post.id} {...post} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/blog">
              <Button variant="outline">
                לכל הכתבות
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
